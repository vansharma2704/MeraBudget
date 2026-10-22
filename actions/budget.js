"use server";

import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeBudget = (budget) => ({
  ...budget,
  amount: budget.amount ? Number(budget.amount) : 0,
  createdAt: budget.createdAt instanceof Date ? budget.createdAt.toISOString() : budget.createdAt,
  updatedAt: budget.updatedAt instanceof Date ? budget.updatedAt.toISOString() : budget.updatedAt,
});

export async function getCurrentBudget(accountId) {
  try {
    const user = await getDbUser();

    if (!user) {
      throw new Error("User not found");
    }

    // Scope expenses to the current calendar month — it's a monthly budget tracker,
    // and scanning all-time transactions is unnecessarily slow as the DB grows.
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [budget, expenses] = await Promise.all([
      db.budget.findFirst({
        where: {
          userID: user.id,
        },
      }),
      db.transaction.aggregate({
        where: {
          userId: user.id,
          type: "EXPENSE",
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: {
          amount: true,
        }
      }),
    ]);

    return {
      budget: budget ? serializeBudget(budget) : null,
      currentExpenses: expenses._sum.amount ? Number(expenses._sum.amount) : 0,
    };

  } catch (error) {
    console.error("Error fetching budget:", error.message);
    return { budget: null, currentExpenses: 0 };
  }
}

export async function updateBudget(amount) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const value = Number(amount);
    if (!(value > 0)) throw new Error("Budget must be more than 0");

    const budget = await db.budget.upsert({
      where: {
        userID: user.id,
      },
      update: {
        amount: value,
      },
      create: {
        userID: user.id,
        amount: value,
      },
    });

    revalidatePath("/dashboard");
    return {
      success: true,
      data: serializeBudget(budget),
    };
  } catch (error) {
    console.error("Error updating budget:", error.message);
    return { success: false, error: error.message };
  }
}