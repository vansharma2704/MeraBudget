"use server";

import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const money = (value) => Math.round(Number(value) || 0);

async function saveReport(userId, report, { periodStart, periodEnd, transactionCount }) {
  try {
    const saved = await db.aiInsightReport.create({
      data: {
        report,
        source: report.source,
        model: report.source === "gemini" ? MODEL : null,
        transactionCount,
        periodStart,
        periodEnd,
        userId,
      },
    });

    const olderReports = await db.aiInsightReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: 12,
      select: { id: true },
    });
    if (olderReports.length) {
      await db.aiInsightReport.deleteMany({ where: { id: { in: olderReports.map((item) => item.id) }, userId } });
    }

    return { ...report, reportId: saved.id, generatedAt: saved.createdAt.toISOString() };
  } catch (error) {
    console.error("Save insight report error:", error.message);
    return { ...report, reportId: null, generatedAt: new Date().toISOString() };
  }
}

export async function getSavedInsightReports() {
  try {
    const user = await getDbUser();
    if (!user) return { success: false, error: "Unauthorized", data: [] };

    const [reports, transactionState] = await Promise.all([
      db.aiInsightReport.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      db.transaction.aggregate({
        where: { userId: user.id },
        _count: { id: true },
        _max: { updatedAt: true },
      }),
    ]);

    return {
      success: true,
      data: reports.map((item) => ({
        id: item.id,
        report: item.report,
        source: item.source,
        transactionCount: item.transactionCount,
        periodStart: item.periodStart.toISOString(),
        periodEnd: item.periodEnd.toISOString(),
        createdAt: item.createdAt.toISOString(),
        outdated: item.transactionCount !== transactionState._count.id ||
          Boolean(transactionState._max.updatedAt && transactionState._max.updatedAt > item.createdAt),
      })),
    };
  } catch (error) {
    console.error("Get insight reports error:", error.message);
    return { success: false, error: "Could not load report history", data: [] };
  }
}

export async function deleteSavedInsightReport(id) {
  try {
    const user = await getDbUser();
    if (!user) return { success: false, error: "Unauthorized" };
    const result = await db.aiInsightReport.deleteMany({ where: { id, userId: user.id } });
    if (!result.count) return { success: false, error: "Report not found" };
    return { success: true };
  } catch (error) {
    console.error("Delete insight report error:", error.message);
    return { success: false, error: "Could not delete report" };
  }
}

function buildFallback(summary) {
  const top = summary.categories[0];
  const savings = summary.income - summary.expenses;
  const savingsRate = summary.income > 0 ? (savings / summary.income) * 100 : 0;
  const tips = [];
  const healthScore = summary.transactions === 0 ? 0 : Math.max(10, Math.min(100,
    Math.round(45 + Math.max(-25, Math.min(35, savingsRate)) + (summary.totalAccountBalance >= 0 ? 10 : -10))
  ));

  if (top) {
    const target = Math.max(Math.round((top.amount / summary.monthCount) * 0.1), 100);
    tips.push({
      title: `Review ${top.category}`,
      reason: `It is your largest expense category at ₹${top.amount.toLocaleString("en-IN")} in this period.`,
      action: `Set a 10% lower limit for this category and review it once a week.`,
      estimatedMonthlySaving: target,
    });
  }

  if (savingsRate < 20 && summary.income > 0) {
    tips.push({
      title: "Pay yourself first",
      reason: `Your current savings rate is about ${Math.round(savingsRate)}%.`,
      action: "Move a small fixed amount to savings immediately after income arrives; work toward 20% gradually.",
      estimatedMonthlySaving: Math.max(Math.round(summary.averageMonthlyIncome * 0.05), 100),
    });
  } else {
    tips.push({
      title: "Protect your surplus",
      reason: savings > 0 ? `Your recorded surplus is ₹${money(savings).toLocaleString("en-IN")}.` : "Your recorded expenses currently match or exceed income.",
      action: savings > 0 ? "Automate part of this surplus toward your highest-priority goal." : "Pause non-essential purchases for seven days and set a weekly spending cap.",
      estimatedMonthlySaving: Math.max(Math.round(Math.max(savings / summary.monthCount, summary.averageMonthlyExpenses * 0.03)), 0),
    });
  }

  if (summary.budget && summary.averageMonthlyExpenses > summary.budget) {
    tips.push({
      title: "Reset the budget gap",
      reason: `Average monthly expenses are ₹${money(summary.averageMonthlyExpenses - summary.budget).toLocaleString("en-IN")} above your budget.`,
      action: "Reduce the two largest flexible categories first instead of cutting every category equally.",
      estimatedMonthlySaving: money(summary.averageMonthlyExpenses - summary.budget),
    });
  } else {
    tips.push({
      title: "Use a weekly allowance",
      reason: "A monthly target is easier to follow when split into smaller checkpoints.",
      action: `Use a weekly spending allowance of about ₹${money((summary.budget || summary.averageMonthlyExpenses) / 4.33).toLocaleString("en-IN")}.`,
      estimatedMonthlySaving: Math.round(summary.averageMonthlyExpenses * 0.03),
    });
  }

  tips.push({
    title: "Build a cash buffer",
    reason: `Your recorded balance covers about ${summary.averageMonthlyExpenses > 0 ? Math.max(0, summary.totalAccountBalance / summary.averageMonthlyExpenses).toFixed(1) : "0"} months of average expenses.`,
    action: "Create a separate emergency goal and add a fixed amount to it every month.",
    estimatedMonthlySaving: Math.max(Math.round(summary.averageMonthlyIncome * 0.03), 100),
  });
  tips.push({
    title: "Run a weekly money review",
    reason: "Frequent reviews make unusual spending visible before the month ends.",
    action: "Spend ten minutes every Sunday checking categories, subscriptions and progress against budget.",
    estimatedMonthlySaving: Math.round(summary.averageMonthlyExpenses * 0.02),
  });

  return {
    headline: summary.transactions === 0 ? "Add transactions to unlock personalised guidance" : "Your practical savings plan",
    summary: summary.transactions === 0
      ? "There is not enough financial activity yet. Add income and expenses, then generate guidance again."
      : `Based on ${summary.transactions} transactions from the last six months, focus on one repeatable change at a time.`,
    tips: tips.slice(0, 5),
    healthScore,
    status: healthScore >= 75 ? "Strong" : healthScore >= 50 ? "Needs attention" : "At risk",
    snapshot: {
      averageMonthlyIncome: summary.averageMonthlyIncome,
      averageMonthlyExpenses: summary.averageMonthlyExpenses,
      averageMonthlySavings: money(summary.averageMonthlyIncome - summary.averageMonthlyExpenses),
      savingsRate: Math.round(savingsRate),
      totalBalance: summary.totalAccountBalance,
    },
    findings: [
      {
        title: savingsRate >= 20 ? "Healthy savings rate" : "Savings rate needs improvement",
        detail: summary.income > 0 ? `You retained about ${Math.round(savingsRate)}% of recorded income.` : "No income is recorded in this period, so savings performance cannot be measured accurately.",
        level: savingsRate >= 20 ? "good" : "warning",
      },
      {
        title: top ? `${top.category} leads spending` : "No category pattern yet",
        detail: top ? `This category represents ${summary.expenses > 0 ? Math.round((top.amount / summary.expenses) * 100) : 0}% of recorded expenses.` : "Add more expenses to identify the categories with the best saving opportunities.",
        level: "info",
      },
      {
        title: summary.budget ? "Budget comparison available" : "Monthly budget missing",
        detail: summary.budget ? `Average monthly spending is ${summary.averageMonthlyExpenses <= summary.budget ? "within" : "above"} your ₹${summary.budget.toLocaleString("en-IN")} budget.` : "Set a monthly budget so the coach can measure overspending and recommend limits.",
        level: summary.budget && summary.averageMonthlyExpenses > summary.budget ? "warning" : "info",
      },
      {
        title: "Cash-buffer coverage",
        detail: summary.averageMonthlyExpenses > 0 ? `Your recorded balance equals about ${Math.max(0, summary.totalAccountBalance / summary.averageMonthlyExpenses).toFixed(1)} months of average expenses.` : "Add expense data to calculate emergency-fund coverage.",
        level: summary.totalAccountBalance >= summary.averageMonthlyExpenses * 3 ? "good" : "warning",
      },
      {
        title: "Data coverage",
        detail: `This report used ${summary.transactions} transactions across ${summary.monthCount} active month${summary.monthCount === 1 ? "" : "s"}. More complete records produce more reliable guidance.`,
        level: summary.transactions >= 20 ? "good" : "info",
      },
    ],
    actionPlan: {
      today: tips[0]?.action ? [tips[0].action] : ["Record your regular income and expenses."],
      thisWeek: tips[1]?.action ? [tips[1].action, "Review every expense category and correct any miscategorised transactions."] : ["Set a realistic weekly spending limit."],
      thisMonth: tips[2]?.action ? [tips[2].action, "Compare actual spending with this report after 30 days."] : ["Review your progress after 30 days."],
    },
    source: "rules",
  };
}

function validInsight(value) {
  return value && typeof value.headline === "string" && typeof value.summary === "string" &&
    Array.isArray(value.tips) && value.tips.length > 0 && Array.isArray(value.findings) && value.actionPlan;
}

export async function generateSavingsInsights() {
  try {
    const user = await getDbUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const since = new Date();
    since.setMonth(since.getMonth() - 6);
    const generatedAt = new Date();

    const [transactions, accounts, budget, totalTransactionCount] = await Promise.all([
      db.transaction.findMany({
        where: { userId: user.id, date: { gte: since } },
        select: { type: true, amount: true, category: true, date: true },
        orderBy: { date: "asc" },
      }),
      db.account.findMany({ where: { userId: user.id }, select: { balance: true } }),
      db.budget.findUnique({ where: { userID: user.id }, select: { amount: true } }),
      db.transaction.count({ where: { userId: user.id } }),
    ]);

    const categoryTotals = new Map();
    const monthTotals = new Map();
    let income = 0;
    let expenses = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      const month = transaction.date.toISOString().slice(0, 7);
      const monthly = monthTotals.get(month) || { month, income: 0, expenses: 0 };
      if (transaction.type === "INCOME") {
        income += amount;
        monthly.income += amount;
      } else {
        expenses += amount;
        monthly.expenses += amount;
        categoryTotals.set(transaction.category, (categoryTotals.get(transaction.category) || 0) + amount);
      }
      monthTotals.set(month, monthly);
    }

    const monthCount = Math.max(monthTotals.size, 1);
    const summary = {
      period: "last 6 months",
      transactions: transactions.length,
      income: money(income),
      expenses: money(expenses),
      monthCount,
      averageMonthlyIncome: money(income / monthCount),
      averageMonthlyExpenses: money(expenses / monthCount),
      budget: budget ? money(budget.amount) : null,
      totalAccountBalance: money(accounts.reduce((sum, account) => sum + Number(account.balance), 0)),
      categories: [...categoryTotals.entries()]
        .map(([category, amount]) => ({ category, amount: money(amount) }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8),
      months: [...monthTotals.values()].map((item) => ({
        month: item.month,
        income: money(item.income),
        expenses: money(item.expenses),
      })),
    };

    const fallback = buildFallback(summary);
    const saveAndReturn = async (report) => ({
      success: true,
      data: await saveReport(user.id, report, {
        periodStart: since,
        periodEnd: generatedAt,
        transactionCount: totalTransactionCount,
      }),
    });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || transactions.length === 0) return saveAndReturn(fallback);

    const prompt = `You are a cautious personal budgeting coach for an Indian user. Create a complete but concise financial guidance report using only the aggregate JSON below. Explain what is happening, where money can be saved, and exactly what the user should do next. Never invent facts. Do not provide investment, tax, credit, or legal advice. Return JSON with exactly this structure: {"headline":"short string","summary":"2-3 sentence executive summary","healthScore":number from 0 to 100,"status":"Strong|Needs attention|At risk","snapshot":{"averageMonthlyIncome":number,"averageMonthlyExpenses":number,"averageMonthlySavings":number,"savingsRate":number,"totalBalance":number},"findings":[{"title":"short string","detail":"data-grounded explanation","level":"good|warning|info"}],"tips":[{"title":"short string","reason":"data-grounded reason","action":"one concrete action","estimatedMonthlySaving":number}],"actionPlan":{"today":["action"],"thisWeek":["action"],"thisMonth":["action"]}}. Return 5 findings, 5 saving tips, and at least 2 actions for each time period. Savings estimates must be conservative non-negative monthly INR amounts. Data: ${JSON.stringify(summary)}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.25, maxOutputTokens: 1800 },
        }),
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      }
    );

    if (!response.ok) return saveAndReturn(fallback);
    const payload = await response.json();
    const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    let insight = null;
    try {
      insight = text ? JSON.parse(text) : null;
    } catch {
      return saveAndReturn(fallback);
    }
    if (!validInsight(insight)) return saveAndReturn(fallback);

    return saveAndReturn({
        headline: insight.headline.slice(0, 100),
        summary: insight.summary.slice(0, 500),
        healthScore: Math.max(0, Math.min(100, money(insight.healthScore))),
        status: ["Strong", "Needs attention", "At risk"].includes(insight.status) ? insight.status : "Needs attention",
        snapshot: {
          averageMonthlyIncome: money(insight.snapshot?.averageMonthlyIncome ?? summary.averageMonthlyIncome),
          averageMonthlyExpenses: money(insight.snapshot?.averageMonthlyExpenses ?? summary.averageMonthlyExpenses),
          averageMonthlySavings: money(insight.snapshot?.averageMonthlySavings ?? (summary.averageMonthlyIncome - summary.averageMonthlyExpenses)),
          savingsRate: Math.round(Number(insight.snapshot?.savingsRate) || 0),
          totalBalance: money(insight.snapshot?.totalBalance ?? summary.totalAccountBalance),
        },
        findings: insight.findings.slice(0, 5).map((finding) => ({
          title: String(finding.title || "Financial pattern").slice(0, 100),
          detail: String(finding.detail || "").slice(0, 400),
          level: ["good", "warning", "info"].includes(finding.level) ? finding.level : "info",
        })),
        tips: insight.tips.slice(0, 5).map((tip) => ({
          title: String(tip.title || "Savings opportunity").slice(0, 80),
          reason: String(tip.reason || "").slice(0, 300),
          action: String(tip.action || "").slice(0, 300),
          estimatedMonthlySaving: Math.max(0, money(tip.estimatedMonthlySaving)),
        })),
        actionPlan: {
          today: (insight.actionPlan?.today || []).slice(0, 3).map((item) => String(item).slice(0, 300)),
          thisWeek: (insight.actionPlan?.thisWeek || []).slice(0, 3).map((item) => String(item).slice(0, 300)),
          thisMonth: (insight.actionPlan?.thisMonth || []).slice(0, 3).map((item) => String(item).slice(0, 300)),
        },
        source: "gemini",
      });
  } catch (error) {
    console.error("AI insights error:", error.message);
    return { success: false, error: "Could not generate guidance right now. Please try again." };
  }
}
