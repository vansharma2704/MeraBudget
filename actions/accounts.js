"use server";

import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj) => {
  const serialized = { ...obj };

  if (obj.balance) {
    serialized.balance = Number(obj.balance);
  }

  if (obj.amount) {
    serialized.amount = Number(obj.amount);
  }

  if (obj.date instanceof Date) {
    serialized.date = obj.date.toISOString();
  }

  if (obj.createdAt instanceof Date) {
    serialized.createdAt = obj.createdAt.toISOString();
  }

  if (obj.updatedAt instanceof Date) {
    serialized.updatedAt = obj.updatedAt.toISOString();
  }

  return serialized;
};

export async function updateDefaultAccount(accountId) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    await db.account.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const account = await db.account.update({
      where: {
        id: accountId,
        userId: user.id,
      },
      data: { isDefault: true },
    });

    revalidatePath("/dashboard");
    return { success: true, data: serializeTransaction(account) };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    console.error("DB Error in updateDefaultAccount:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getAccountWithTransactions(accountId) {
  try {
    const user = await getDbUser();

    if (!user) {
      throw new Error("User not found");
    }

    const account = await db.account.findUnique({
      where: { id: accountId, userId: user.id },
      include: {
        transactions: {
          orderBy: { date: "desc" },
          take: 200, // Load latest 200 — the table paginates client-side anyway
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!account) return null;

    return {
      ...serializeTransaction(account),
      transactions: account.transactions.map(serializeTransaction),
    };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    console.error("DB Error in getAccountWithTransactions:", error.message);
    return null;
  }
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (!Array.isArray(transactionIds) || transactionIds.some((t) => typeof t !== "string")) {
      throw new Error("Invalid transaction list");
    }

    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    const accountBalanceChanges = transactions.reduce((acc, transaction) => {
      const change =
        transaction.type === "EXPENSE"
          ? transaction.amount
          : -transaction.amount;

      acc[transaction.accountId] = (acc[transaction.accountId] || 0) + Number(change);
      return acc;
    }, {});

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(
        accountBalanceChanges
      )) {
        await tx.account.update({
          where: { id: accountId, userId: user.id },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return { success: true };
  } catch (error) {
    console.error("DB Error in bulkDeleteTransactions:", error.message);
    return { success: false, error: error.message };
  }
}