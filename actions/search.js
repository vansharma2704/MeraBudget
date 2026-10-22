"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function searchFinancialData(query) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserid: userId },
    });

    if (!user) throw new Error("User not found");

    if (!query || query.trim().length === 0) {
      return { success: true, results: [] };
    }

    const searchQuery = query.toLowerCase().trim();
    const searchAmount = !isNaN(parseFloat(searchQuery)) ? parseFloat(searchQuery) : null;
    
    // Month mapping for searching by name
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const monthIndex = months.findIndex(m => m.startsWith(searchQuery));
    
    // 1. Search Transactions
    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        OR: [
          { description: { contains: searchQuery, mode: "insensitive" } },
          { category: { contains: searchQuery, mode: "insensitive" } },
          ...(searchAmount ? [{ amount: { equals: searchAmount } }] : []),
          ...(monthIndex !== -1 ? [{
            date: {
              gte: new Date(new Date().getFullYear(), monthIndex, 1),
              lt: new Date(new Date().getFullYear(), monthIndex + 1, 1),
            }
          }] : []),
          { type: { equals: searchQuery.toUpperCase() === "INCOME" ? "INCOME" : searchQuery.toUpperCase() === "EXPENSE" ? "EXPENSE" : undefined } },
        ].filter(Boolean),
      },
      orderBy: { date: "desc" },
      take: 15,
      include: { account: true }
    });

    // 2. Search Bills
    const bills = await db.billReminder.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          ...(searchAmount ? [{ amount: { equals: searchAmount } }] : []),
        ],
      },
      take: 10,
    });

    // 3. Search Accounts
    const accounts = await db.account.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { type: { equals: searchQuery.toUpperCase() === "SAVINGS" ? "SAVINGS" : searchQuery.toUpperCase() === "CURRENT" ? "CURRENT" : undefined } },
        ].filter(Boolean),
      },
      take: 5,
    });

    // 4. Search Goals
    const goals = await db.savingsGoal.findMany({
      where: {
        userId: user.id,
        name: { contains: searchQuery, mode: "insensitive" },
      },
      take: 5,
    });

    // 5. Search Subscriptions
    const subscriptions = await db.subscription.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: searchQuery, mode: "insensitive" } },
          { category: { contains: searchQuery, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    // Format results by type
    const results = [
      ...accounts.map((acc) => ({
        id: acc.id,
        type: "Accounts",
        title: acc.name,
        subtitle: `${acc.type} • ₹${Number(acc.balance).toLocaleString()}`,
        url: `/dashboard`,
        icon: "CreditCard",
      })),
      ...transactions.map((tr) => ({
        id: tr.id,
        type: tr.type === "INCOME" ? "Income" : "Transactions",
        title: tr.description || "Untitled Transaction",
        subtitle: `${tr.category} • ₹${Number(tr.amount).toLocaleString()} • ${new Date(tr.date).toLocaleDateString()}`,
        amount: Number(tr.amount),
        date: tr.date,
        url: `/account/${tr.accountId}`,
        icon: tr.type === "INCOME" ? "TrendingUp" : "TrendingDown",
      })),
      ...bills.map((bill) => ({
        id: bill.id,
        type: "Bills",
        title: bill.name,
        subtitle: `Due: ${new Date(bill.dueDate).toLocaleDateString()} • ₹${Number(bill.amount).toLocaleString()}`,
        url: `/bills`,
        icon: "CalendarClock",
      })),
      ...goals.map((goal) => ({
        id: goal.id,
        type: "Goals",
        title: goal.name,
        subtitle: `Target: ₹${Number(goal.targetAmount).toLocaleString()} • Current: ₹${Number(goal.currentAmount).toLocaleString()}`,
        url: `/goals`,
        icon: "Trophy",
      })),
      ...subscriptions.map((sub) => ({
        id: sub.id,
        type: "Subscriptions",
        title: sub.name,
        subtitle: `${sub.category || "General"} • ₹${Number(sub.amount).toLocaleString()}`,
        url: `/bills`,
        icon: "RefreshCw",
      })),
    ];

    return { success: true, results };
  } catch (error) {
    if (error.message?.includes("Dynamic server usage")) throw error;
    console.error("Search error:", error);
    return { success: false, error: error.message };
  }
}
