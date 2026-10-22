import { ArrowUpRight, ShoppingBag, Utensils, Fuel, Briefcase } from "lucide-react";

/* Coded hero preview of the dashboard — stays in sync with the theme, unlike a screenshot. */

const SPENDING = [
  { label: "Housing", pct: 35, color: "#e9c46a" },
  { label: "Food", pct: 22, color: "#7dd3fc" },
  { label: "Transport", pct: 18, color: "#f4a261" },
  { label: "Others", pct: 25, color: "#64748b" },
];

const TRANSACTIONS = [
  { name: "Salary", sub: "HDFC Bank", amount: "+₹95,000", icon: Briefcase, income: true },
  { name: "Amazon", sub: "Shopping", amount: "−₹4,500", icon: ShoppingBag },
  { name: "Swiggy", sub: "Food", amount: "−₹840", icon: Utensils },
  { name: "Fuel", sub: "Transport", amount: "−₹1,200", icon: Fuel },
];

const SPARK = "M0 34 L12 30 L24 32 L36 24 L48 27 L60 18 L72 21 L84 12 L96 15 L108 6 L120 8";

function Donut() {
  const r = 15.9155; // circumference = 100, so dash lengths equal percentages
  // Each segment starts where the previous ones end (computed up front, no mutation during render)
  const starts = SPENDING.map((_, i) => SPENDING.slice(0, i).reduce((sum, s) => sum + s.pct, 0));
  return (
    <svg viewBox="0 0 42 42" className="w-full h-full">
      <circle cx="21" cy="21" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
      {SPENDING.map(({ label, pct, color }, i) => (
        <circle
          key={label}
          cx="21" cy="21" r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${pct - 1.2} ${100 - pct + 1.2}`}
          strokeDashoffset={25 - starts[i]}
        />
      ))}
    </svg>
  );
}

export default function DashboardPreview() {
  return (
    <div className="grid grid-cols-5 gap-2.5 sm:gap-3 p-2.5 sm:p-3 text-left select-none">

      {/* Balance */}
      <div className="col-span-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col">
        <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Total Balance</p>
        <div className="flex items-end gap-2 mt-1.5">
          <p className="text-xl sm:text-2xl font-black text-white tracking-tight">₹2,84,540</p>
          <span className="mb-1 inline-flex items-center gap-0.5 text-[11px] font-bold text-green-400">
            <ArrowUpRight size={11} />3.8%
          </span>
        </div>
        <svg viewBox="0 0 120 40" className="w-full flex-1 min-h-16 mt-3" preserveAspectRatio="none">
          <defs>
            <linearGradient id="dp-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9c46a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#e9c46a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${SPARK} L120 40 L0 40 Z`} fill="url(#dp-spark)" />
          <path d={SPARK} fill="none" stroke="#e9c46a" strokeWidth="1.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>

      {/* Spending donut */}
      <div className="col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col">
        <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Spending</p>
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto my-2">
          <Donut />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] text-white/40">April</p>
            <p className="text-xs sm:text-sm font-black text-white">₹68.4k</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 mt-auto">
          {SPENDING.map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1 text-[10px] text-white/50 truncate">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="col-span-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold mb-2.5">Recent</p>
        <div className="space-y-2.5">
          {TRANSACTIONS.map(({ name, sub, amount, icon: Icon, income }) => (
            <div key={name} className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0">
                <Icon size={12} className={income ? "text-green-400" : "text-white/50"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white/85 leading-tight">{name}</p>
                <p className="text-[10px] text-white/35 leading-tight">{sub}</p>
              </div>
              <p className={`text-xs font-bold tabular-nums ${income ? "text-green-400" : "text-white/70"}`}>{amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget + goal */}
      <div className="col-span-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-baseline">
            <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">Budget</p>
            <p className="text-[11px] font-bold text-gold-300">68%</p>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
            <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-gold-500 to-gold-300" />
          </div>
          <p className="text-[10px] text-white/35 mt-1.5">₹68,410 of ₹1,00,000</p>
        </div>
        <div>
          <div className="flex justify-between items-baseline">
            <p className="text-[11px] uppercase tracking-widest text-white/40 font-semibold">New Home</p>
            <p className="text-[11px] font-bold text-sky-300">34%</p>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
            <div className="h-full w-[34%] rounded-full bg-sky-300/80" />
          </div>
          <p className="text-[10px] text-white/35 mt-1.5">₹8.45L of ₹25L</p>
        </div>
      </div>
    </div>
  );
}
