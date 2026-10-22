import { Wallet, ArrowUpRight, ArrowDownRight, PieChart, Target } from "lucide-react";

/* Always-visible KPI row at the top of the dashboard. */

const inr = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

const Stat = ({ icon: Icon, label, value, sub, children }) => (
  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">
    <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-wider">
      <Icon size={14} className="text-gold-300" />
      {label}
    </div>
    <p className="text-white font-bold text-2xl tracking-tight mt-2 tabular-nums">{value}</p>
    {sub && <div className="text-xs text-white/50 mt-1">{sub}</div>}
    {children}
  </div>
);

export default function SummaryStrip({ accounts = [], transactions = [], budget, currentExpenses = 0, goals = [] }) {
  const totalBalance = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  // This is an account-wide cash-flow summary. Keeping it restricted to the
  // current month hid imported statements whose transaction dates were from a
  // previous month, even though those rows were correctly saved.
  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount || 0), 0);
  const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount || 0), 0);
  const net = income - expense;

  const budgetAmount = Number(budget?.amount || 0);
  const budgetPct = budgetAmount ? Math.min(100, Math.round((currentExpenses / budgetAmount) * 100)) : null;

  // Goal closest to completion
  const topGoal = [...goals]
    .map((g) => ({ ...g, pct: Number(g.targetAmount) ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Stat icon={Wallet} label="Total balance" value={inr(totalBalance)}
        sub={`${accounts.length} account${accounts.length === 1 ? "" : "s"}`} />

      <Stat icon={net >= 0 ? ArrowUpRight : ArrowDownRight} label="Net cash flow" value={`${net >= 0 ? "+" : "−"}${inr(Math.abs(net))}`}
        sub={<><span className="text-green-400">↑ {inr(income)}</span> · <span className="text-white/60">↓ {inr(expense)}</span></>} />

      <Stat icon={PieChart} label="Budget used" value={budgetPct === null ? "—" : `${budgetPct}%`}
        sub={budgetPct === null ? "No budget set" : `${inr(currentExpenses)} of ${inr(budgetAmount)}`}>
        {budgetPct !== null && (
          <div className="h-1.5 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
            <div className={`h-full rounded-full ${budgetPct >= 90 ? "bg-orange-400" : "bg-gold-400"}`} style={{ width: `${budgetPct}%` }} />
          </div>
        )}
      </Stat>

      <Stat icon={Target} label="Top goal" value={topGoal ? `${Math.round(topGoal.pct)}%` : "—"}
        sub={topGoal ? topGoal.name : "No goals yet"}>
        {topGoal && (
          <div className="h-1.5 rounded-full bg-white/[0.06] mt-3 overflow-hidden">
            <div className="h-full rounded-full bg-gold-400" style={{ width: `${Math.min(100, topGoal.pct)}%` }} />
          </div>
        )}
      </Stat>
    </div>
  );
}
