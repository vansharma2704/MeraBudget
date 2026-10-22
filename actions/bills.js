"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { defaultCategories } from "@/data/categories";

const expenseCategoryIds = new Set(
  defaultCategories.filter((category) => category.type === "EXPENSE").map((category) => category.id)
);

const serializeBill = (bill) => ({
  ...bill,
  amount: bill.amount ? Number(bill.amount) : 0,
  dueDate: bill.dueDate instanceof Date ? bill.dueDate.toISOString() : bill.dueDate,
  paidAt: bill.paidAt instanceof Date ? bill.paidAt.toISOString() : bill.paidAt,
  createdAt: bill.createdAt instanceof Date ? bill.createdAt.toISOString() : bill.createdAt,
  updatedAt: bill.updatedAt instanceof Date ? bill.updatedAt.toISOString() : bill.updatedAt,
});

export async function createBill(data) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: clerkUserId },
    });

    if (!user) throw new Error("User not found");

    const name = String(data?.name || "").trim();
    const amount = Number(data?.amount);
    const accountId = String(data?.accountId || "");
    const category = String(data?.category || "");
    const paidAt = new Date(data?.paidAt || data?.dueDate);
    if (!name) throw new Error("Bill name is required");
    if (!(amount > 0)) throw new Error("Amount must be more than 0");
    if (Number.isNaN(paidAt.getTime())) throw new Error("Invalid payment date");
    if (!accountId) throw new Error("Select the account used for this payment");
    if (!expenseCategoryIds.has(category)) throw new Error("Select a valid expense category");
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    if (paidAt > endOfToday) throw new Error("Payment date cannot be in the future");

    const account = await db.account.findFirst({
      where: { id: accountId, userId: user.id },
    });
    if (!account) throw new Error("Account not found");

    const bill = await db.$transaction(async (tx) => {
      const expense = await tx.transaction.create({
        data: {
          type: "EXPENSE",
          amount,
          description: name,
          date: paidAt,
          category,
          status: "COMPLETED",
          userId: user.id,
          accountId,
        },
      });

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });

      return tx.billReminder.create({
        data: {
          name,
          amount,
          dueDate: paidAt,
          paidAt,
          status: "PAID",
          // Kept for compatibility with the existing model. Paid bills do not
          // use a recurrence schedule in the UI.
          frequency: "MONTHLY",
          category,
          accountId,
          transactionId: expense.id,
          userId: user.id,
        },
        include: { account: { select: { id: true, name: true } } },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/bills");
    revalidatePath("/reports");
    revalidatePath(`/account/${accountId}`);
    return { success: true, data: serializeBill(bill) };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    return { success: false, error: error.message };
  }
}

export async function getBills() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: clerkUserId },
    });

    if (!user) throw new Error("User not found");

    const bills = await db.billReminder.findMany({
      where: { userId: user.id },
      include: { account: { select: { id: true, name: true } } },
      orderBy: { paidAt: "desc" },
    });

    return { success: true, data: bills.map(serializeBill) };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    return { success: false, error: error.message };
  }
}

export async function deleteBill(id) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const bill = await db.billReminder.findFirst({
      where: { id, user: { clerkUserid: clerkUserId } },
    });
    if (!bill) throw new Error("Bill not found");

    await db.$transaction(async (tx) => {
      if (bill.transactionId) {
        const expense = await tx.transaction.findFirst({
          where: { id: bill.transactionId, userId: bill.userId },
        });
        if (expense) {
          await tx.transaction.delete({ where: { id: expense.id } });
          await tx.account.update({
            where: { id: expense.accountId },
            data: { balance: { increment: expense.amount } },
          });
        }
      }
      await tx.billReminder.delete({ where: { id: bill.id } });
    });

    revalidatePath("/dashboard");
    revalidatePath("/bills");
    revalidatePath("/reports");
    if (bill.accountId) revalidatePath(`/account/${bill.accountId}`);
    return { success: true };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    return { success: false, error: error.message };
  }
}
