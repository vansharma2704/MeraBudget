"use server";

import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeSplitExpense = (split) => ({
  ...split,
  totalAmount: split.totalAmount ? Number(split.totalAmount) : 0,
  createdAt: split.createdAt instanceof Date ? split.createdAt.toISOString() : split.createdAt,
  updatedAt: split.updatedAt instanceof Date ? split.updatedAt.toISOString() : split.updatedAt,
});

export async function createSplitExpense(data) {
  try {
    const user = await getDbUser();
    if (!user) throw new Error("Unauthorized");

    const description = String(data?.description || "").trim();
    const totalAmount = Number(data?.totalAmount);
    const participants = Array.isArray(data?.participants)
      ? data.participants.map((p) => ({
          name: String(p?.name || "").trim(),
          share: Math.round(Number(p?.share) * 100) / 100,
          paid: Boolean(p?.paid),
          payer: Boolean(p?.payer),
        }))
      : [];
    if (participants.filter((p) => p.payer).length > 1) throw new Error("Only one person can have paid the bill");

    if (!description) throw new Error("Add a description");
    if (!(totalAmount > 0)) throw new Error("Total must be more than 0");
    if (participants.length < 2) throw new Error("Add at least two people");
    if (participants.some((p) => !p.name)) throw new Error("Every person needs a name");
    if (participants.some((p) => !(p.share >= 0))) throw new Error("Shares can't be negative");
    const sum = participants.reduce((acc, p) => acc + p.share, 0);
    if (Math.abs(sum - totalAmount) > 0.01) throw new Error("Shares must add up to the total");

    const split = await db.splitExpense.create({
      data: { description, totalAmount, participants, userId: user.id },
    });

    revalidatePath("/dashboard");
    revalidatePath("/split");
    return { success: true, data: serializeSplitExpense(split) };
  } catch (error) {
    if (error.message?.includes("Dynamic server usage")) throw error;
    console.error("DB Error in createSplitExpense:", error.message);
    return { success: false, error: error.message };
  }
}

// Flip one participant between paid and pending
export async function toggleSplitParticipantPaid(id, index) {
  try {
    const user = await getDbUser();
    if (!user) throw new Error("Unauthorized");

    const split = await db.splitExpense.findFirst({ where: { id, userId: user.id } });
    if (!split) throw new Error("Split not found");

    const participants = Array.isArray(split.participants) ? [...split.participants] : [];
    if (!participants[index]) throw new Error("Person not found");
    participants[index] = { ...participants[index], paid: !participants[index].paid };

    const updated = await db.splitExpense.update({ where: { id }, data: { participants } });

    revalidatePath("/split");
    return { success: true, data: serializeSplitExpense(updated) };
  } catch (error) {
    console.error("DB Error in toggleSplitParticipantPaid:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getSplitExpenses() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: clerkUserId },
    });

    if (!user) throw new Error("User not found");

    const splits = await db.splitExpense.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: splits.map(serializeSplitExpense) };
  } catch (error) {
    if (error.message?.includes("Dynamic server usage")) throw error;
    console.error("DB Error in getSplitExpenses:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteSplitExpense(id) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    // Only delete splits that belong to the signed-in user
    const { count } = await db.splitExpense.deleteMany({
      where: { id, user: { clerkUserid: clerkUserId } },
    });
    if (count === 0) throw new Error("Split not found");

    revalidatePath("/dashboard");
    revalidatePath("/split");
    return { success: true };
  } catch (error) {
    console.error("DB Error in deleteSplitExpense:", error.message);
    return { success: false, error: error.message };
  }
}
