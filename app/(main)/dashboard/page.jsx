import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import { getGoals } from "@/actions/goals";
import { X } from "lucide-react";
import React, { Suspense } from "react";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";
import DashboardOverview from "./_components/transaction-overview";
import UpcomingBills from "@/components/upcoming-bills";
import ReceiptScanner from "@/components/receipt-scanner";
import Achievements from "./_components/achievements";
import FutureSimulator from "@/components/future-simulator";
import LifestyleTracker from "./_components/lifestyle-tracker";
import TaxStrategist from "./_components/tax-strategist";
import FinancialHeatmap from "@/components/financial-heatmap";
import MoodTracker from "./_components/mood-tracker";
import SalaryPlanner from "@/components/SalaryPlanner";
import MonthlySummary from "./_components/monthly-summary";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import GoalsCard from "./_components/goals-card";
import SummaryStrip from "./_components/summary-strip";
import { getDbUser } from "@/lib/getDbUser";
import { processDueRecurring } from "@/lib/recurring-process";
import CreateAccountCard from "./_components/create-account-card";
import DashboardTabs, { TABS } from "./_components/dashboard-tabs";
import AiSavingsCoach from "./_components/ai-savings-coach";

async function DashboardPage({ searchParams }) {
  const { date, tab: tabParam } = (await searchParams) || {};
  const tab = TABS.some((t) => t.id === tabParam) ? tabParam : "overview";

  // Data for the summary strip (always visible) — fetched in one parallel batch, alongside a
  // catch-up of this user's due recurring transactions (works even before the daily cron runs)
  const user = await getDbUser();
  let [accounts, goalsResult, allTransactions, budgetResult, recurring] = await Promise.all([
    getUserAccounts(),
    getGoals(),
    getDashboardData(),
    getCurrentBudget(),
    user ? processDueRecurring({ userId: user.id }).catch(() => ({ created: 0 })) : { created: 0 },
  ]);
  // Rare path: new recurring copies were just created, so reload what they affect
  if (recurring.created > 0) {
    [accounts, allTransactions, budgetResult] = await Promise.all([getUserAccounts(), getDashboardData(), getCurrentBudget()]);
  }
  const goals = goalsResult.success ? goalsResult.data : [];
  const defaultAccount = accounts?.find((account) => account.isDefault);
  const budgetData = defaultAccount ? budgetResult : null;

  // Date-filtered transactions are only needed by the Overview tab
  const transactions = tab === "overview" && date ? await getDashboardData(date) : allTransactions;

  return (
    <div className="mt-6 pb-20 space-y-6 page-fade-in px-4">
      <SummaryStrip
        accounts={accounts}
        transactions={allTransactions || []}
        budget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
        goals={goals}
      />

      <DashboardTabs active={tab} />

      {/* ── OVERVIEW: accounts, budget, activity ── */}
      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            <CreateAccountCard />
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>

          {defaultAccount && (
            <BudgetProgress
              initialBudget={budgetData?.budget}
              currentExpenses={budgetData?.currentExpenses || 0}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <FinancialHeatmap transactions={allTransactions || []} compact={true} />
              {date && (
                <div className="flex justify-end mt-2">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                      <X className="mr-2 h-4 w-4" /> Clear Filter: {date}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            <div className="lg:col-span-3">
              <Suspense fallback={"Loading Overview..."}>
                <DashboardOverview accounts={accounts} transactions={transactions || []} />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* ── PLANNING: goals and forward-looking tools ── */}
      {tab === "planning" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <GoalsCard goals={goals} />
            <div className="lg:col-span-2">
              <SalaryPlanner />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2">
              <FutureSimulator />
            </div>
            <TaxStrategist />
          </div>
        </div>
      )}

      {/* ── INSIGHTS: patterns and habits ── */}
      {tab === "insights" && (
        <div className="space-y-6">
          <AiSavingsCoach />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            <div className="lg:col-span-3">
              <MonthlySummary transactions={allTransactions || []} />
            </div>
            <div className="lg:col-span-2">
              <MoodTracker />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <LifestyleTracker />
            <div className="lg:col-span-2">
              <Achievements />
            </div>
          </div>
        </div>
      )}

      {/* ── TOOLS: utilities ── */}
      {tab === "tools" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          <UpcomingBills />
          <ReceiptScanner />
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
