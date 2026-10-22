"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeBill = (bill) => ({
  ...bill,
  amount: bill.amount ? Number(bill.amount) : 0,
  dueDate: bill.dueDate instanceof Date ? bill.dueDate.toISOString() : bill.dueDate,
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
    const dueDate = new Date(data?.dueDate);
    if (!name) throw new Error("Bill name is required");
    if (!(amount > 0)) throw new Error("Amount must be more than 0");
    if (Number.isNaN(dueDate.getTime())) throw new Error("Invalid due date");
    if (!["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(data?.frequency)) throw new Error("Invalid frequency");

    const bill = await db.billReminder.create({
      data: { name, amount, dueDate, frequency: data.frequency, userId: user.id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/bills");
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
      orderBy: { dueDate: "asc" },
    });

    return { success: true, data: bills.map(serializeBill) };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    return { success: false, error: error.message };
  }
}

export async function updateBillStatus(id, status) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    if (!["PENDING", "PAID"].includes(status)) throw new Error("Invalid status");

    // Only the owner's bill can be updated
    const { count } = await db.billReminder.updateMany({
      where: { id, user: { clerkUserid: clerkUserId } },
      data: { status },
    });
    if (count === 0) throw new Error("Bill not found");
    const bill = await db.billReminder.findUnique({ where: { id } });

    revalidatePath("/dashboard");
    revalidatePath("/bills");
    return { success: true, data: serializeBill(bill) };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    return { success: false, error: error.message };
  }
}

export async function deleteBill(id) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    // Only the owner's bill can be deleted
    const { count } = await db.billReminder.deleteMany({
      where: { id, user: { clerkUserid: clerkUserId } },
    });
    if (count === 0) throw new Error("Bill not found");

    revalidatePath("/dashboard");
    revalidatePath("/bills");
    return { success: true };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    return { success: false, error: error.message };
  }
}
