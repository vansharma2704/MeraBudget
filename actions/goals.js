"use server";

import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Helper to convert Prisma items to plain objects
function serializeGoal(goal) {
  return {
    ...goal,
    targetAmount: goal.targetAmount ? Number(goal.targetAmount) : 0,
    currentAmount: goal.currentAmount ? Number(goal.currentAmount) : 0,
    monthlyContribution: goal.monthlyContribution ? Number(goal.monthlyContribution) : 0,
    createdAt: goal.createdAt instanceof Date ? goal.createdAt.toISOString() : goal.createdAt,
    updatedAt: goal.updatedAt instanceof Date ? goal.updatedAt.toISOString() : goal.updatedAt,
  };
}

export async function createGoal(data) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: clerkUserId },
    });

    if (!user) throw new Error("User not found");

    const targetAmount = Number(data.targetAmount);
    const currentAmount = Number(data.currentAmount) || 0;
    if (!data.name || !(targetAmount > 0)) throw new Error("Goal name and a positive target are required");
    if (currentAmount < 0 || currentAmount > targetAmount) {
      throw new Error("Already saved must be between 0 and the target amount");
    }

    const goal = await db.savingsGoal.create({
      data: {
        name: data.name,
        targetAmount,
        currentAmount,
        monthlyContribution: Number(data.monthlyContribution) || 0,
        icon: data.icon,
        userId: user.id,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    return { success: true, data: serializeGoal(goal) };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    console.error("DB Error in createGoal:", error.message);
    return { success: false, error: error.message };
  }
}

export async function getGoals() {
  try {
    const user = await getDbUser();

    if (!user) throw new Error("User not found");

    const goals = await db.savingsGoal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: goals.map(serializeGoal) };
  } catch (error) {
    if (error.message.includes("Dynamic server usage")) throw error;
    console.error("DB Error in getGoals:", error.message);
    return { success: false, error: error.message };
  }
}

export async function updateGoalProgress(id, currentAmount) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    const amount = Number(currentAmount);
    const existing = await db.savingsGoal.findFirst({
      where: { id, user: { clerkUserid: clerkUserId } },
      select: { id: true },
    });
    if (!existing) throw new Error("Goal not found");
    if (!(amount >= 0)) throw new Error("Saved amount can't be negative");

    const goal = await db.savingsGoal.update({
      where: { id },
      data: { currentAmount: amount },
    });

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    return { success: true, data: serializeGoal(goal) };
  } catch (error) {
    console.error("DB Error in updateGoalProgress:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteGoal(id) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) throw new Error("Unauthorized");

    // Only the owner's goal can be deleted
    const { count } = await db.savingsGoal.deleteMany({
      where: { id, user: { clerkUserid: clerkUserId } },
    });
    if (count === 0) throw new Error("Goal not found");

    revalidatePath("/dashboard");
    revalidatePath("/goals");
    return { success: true };
  } catch (error) {
    console.error("DB Error in deleteGoal:", error.message);
    return { success: false, error: error.message };
  }
}
