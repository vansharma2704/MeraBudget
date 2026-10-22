import "server-only";
import { db } from "@/lib/prisma";
import { dueOccurrences } from "@/lib/recurring";

/**
 * Creates every due copy of recurring transactions and moves account balances.
 * Safe to run concurrently (daily cron + dashboard visits): each template is "claimed" with a
 * conditional update on its nextRecurringDate, so a series can't be processed twice.
 * @param {{ userId?: string, now?: Date, limit?: number, client?: object }} options - userId limits it to one user
 * @returns {Promise<{ created: number, templates: number }>}
 */
export async function processDueRecurring({ userId, now = new Date(), limit = 200, client = db } = {}) {
  const templates = await client.transaction.findMany({
    where: {
      isRecurring: true,
      status: "COMPLETED",
      recurringInterval: { not: null },
      nextRecurringDate: { lte: now },
      ...(userId && { userId }),
    },
    take: limit,
  });

  let created = 0;
  let processed = 0;
  for (const t of templates) {
    const { due, next } = dueOccurrences(t.date, t.recurringInterval, t.nextRecurringDate, now);
    if (due.length === 0) continue;

    const amount = Number(t.amount);
    const balanceChange = (t.type === "EXPENSE" ? -amount : amount) * due.length;

    const made = await client.$transaction(async (tx) => {
      // Claim this series; if another run already moved nextRecurringDate, skip it
      const claim = await tx.transaction.updateMany({
        where: { id: t.id, isRecurring: true, nextRecurringDate: t.nextRecurringDate },
        data: { nextRecurringDate: next, lastProcessed: now },
      });
      if (claim.count === 0) return 0;

      await tx.transaction.createMany({
        data: due.map((date) => ({
          type: t.type,
          amount: t.amount,
          description: t.description,
          date,
          category: t.category,
          keywords: [...new Set([...(t.keywords || []), "recurring"])],
          userId: t.userId,
          accountId: t.accountId,
          isRecurring: false, // copies are one-off; the original stays the template
          status: "COMPLETED",
        })),
      });

      await tx.account.update({
        where: { id: t.accountId, userId: t.userId },
        data: { balance: { increment: balanceChange } },
      });
      return due.length;
    });

    created += made;
    if (made) processed++;
  }
  return { created, templates: processed };
}
