import { Check } from "lucide-react";

/* Feature grid: six equal cards, each a fixed-height visual on top and text below. */

const Card = ({ eyebrow, title, description, children }) => (
  <div className="group rounded-3xl border border-white/[0.07] bg-white/[0.025] p-3
    hover:border-gold-400/25 transition-colors duration-300 flex flex-col">
    <div className="h-48 rounded-2xl bg-[#161b25] border border-white/[0.05] p-5 flex flex-col justify-center overflow-hidden">
      {children}
    </div>
    <div className="px-3 pt-5 pb-3">
      <p className="text-gold-400 text-[11px] font-bold tracking-[0.18em] uppercase mb-2">{eyebrow}</p>
      <h3 className="text-white font-semibold text-lg leading-snug">{title}</h3>
      <p className="text-white/55 text-sm leading-relaxed mt-1.5">{description}</p>
    </div>
  </div>
);

const Bar = ({ pct, muted }) => (
  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
    <div className={`h-full rounded-full ${muted ? "bg-white/30" : "bg-gold-400"}`} style={{ width: `${pct}%` }} />
  </div>
);

function ReceiptVisual() {
  const items = [
    { name: "Groceries", amt: "₹1,240" },
    { name: "Household", amt: "₹380" },
    { name: "Snacks", amt: "₹215" },
  ];
  return (
    <div className="flex gap-4 items-center">
      <div className="w-20 shrink-0 rounded-lg bg-white/[0.07] border border-white/10 p-2.5 space-y-1.5 relative overflow-hidden">
        {[90, 70, 80, 55, 75, 60].map((w, i) => (
          <div key={i} className="h-1 rounded-full bg-white/25" style={{ width: `${w}%` }} />
        ))}
        <div className="absolute inset-x-0 top-1/2 h-px bg-gold-400 shadow-[0_0_8px_rgba(233,196,106,0.9)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/45 text-xs mb-2">BigBasket · auto-filled</p>
        <div className="space-y-1.5">
          {items.map((it) => (
            <div key={it.name} className="flex justify-between text-xs">
              <span className="text-white/70">{it.name}</span>
              <span className="text-white font-semibold tabular-nums">{it.amt}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-green-400 flex items-center gap-1 mt-3">
          <Check size={12} /> Added in 2 seconds
        </p>
      </div>
    </div>
  );
}

function StatementVisual() {
  const rows = [
    { label: "Salary", amount: "+₹40,000", income: true },
    { label: "Groceries", amount: "−₹1,250" },
    { label: "Electricity", amount: "−₹1,800" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/70 font-medium">Bank-statement.pdf</span>
        <span className="inline-flex items-center gap-1 text-green-400"><Check size={12} /> Ready</span>
      </div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2 text-xs">
            <span className="text-white/65">{row.label}</span>
            <span className={row.income ? "text-green-400 font-semibold" : "text-white font-semibold"}>{row.amount}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gold-300">Automatically categorised for review</p>
    </div>
  );
}

function SalaryVisual() {
  const split = [
    { label: "Needs", pct: 50, amt: "₹40,000" },
    { label: "Wants", pct: 30, amt: "₹24,000" },
    { label: "Savings", pct: 20, amt: "₹16,000" },
  ];
  return (
    <div className="space-y-3.5">
      {split.map((s, i) => (
        <div key={s.label}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/70">{s.label} · {s.pct}%</span>
            <span className="text-white font-semibold tabular-nums">{s.amt}</span>
          </div>
          <Bar pct={s.pct * 1.6} muted={i !== 2} />
        </div>
      ))}
    </div>
  );
}

function MoodVisual() {
  const moods = [
    { label: "Stressed", amt: "₹3,240", pct: 100, hot: true },
    { label: "Okay", amt: "₹1,420", pct: 44 },
    { label: "Happy", amt: "₹980", pct: 30 },
  ];
  return (
    <div className="space-y-3.5">
      {moods.map((m) => (
        <div key={m.label}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-white/70">{m.label}</span>
            <span className="text-white font-semibold tabular-nums">{m.amt}</span>
          </div>
          <Bar pct={m.pct} muted={!m.hot} />
        </div>
      ))}
    </div>
  );
}

function StreakVisual() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <>
      <p className="text-white font-bold text-4xl leading-none">21 <span className="text-white/45 text-sm font-normal">day streak</span></p>
      <div className="flex gap-1.5 mt-5">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <div className={`h-8 rounded-lg flex items-center justify-center ${i < 6 ? "bg-gold-400" : "border border-dashed border-white/20"}`}>
              {i < 6 && <Check size={13} className="text-[#1a1f2b]" />}
            </div>
            <p className="text-[10px] text-white/40 mt-1.5">{d}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function SplitVisual() {
  const people = [
    { n: "A", paid: true }, { n: "R", paid: true }, { n: "S", paid: false },
  ];
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-white/70 text-xs">Goa trip dinner</p>
        <p className="text-white font-bold text-xl">₹1,260</p>
      </div>
      <div className="mt-4 space-y-2">
        {people.map((p) => (
          <div key={p.n} className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-white/10 text-[10px] font-bold text-white/80 flex items-center justify-center">{p.n}</span>
            <span className="flex-1 text-xs text-white/60">₹420</span>
            <span className={`text-[11px] ${p.paid ? "text-green-400" : "text-gold-300"}`}>{p.paid ? "Paid" : "Pending"}</span>
          </div>
        ))}
      </div>
    </>
  );
}

const FEATURES = [
  { eyebrow: "AI receipt scanner", title: "Snap a bill, skip the typing.", description: "Photograph any receipt and every item is added for you.", Visual: ReceiptVisual },
  { eyebrow: "PDF statement import", title: "Bring in your banking history.", description: "Upload a statement, review the categories and import in one go.", Visual: StatementVisual },
  { eyebrow: "Salary planner", title: "Your salary, planned in one tap.", description: "Split every payday into needs, wants and savings.", Visual: SalaryVisual },
  { eyebrow: "Mood tracker", title: "Know why you overspend.", description: "See how stress and mood change what you buy.", Visual: MoodVisual },
  { eyebrow: "Streaks & levels", title: "Habits that actually stick.", description: "Daily streaks and achievements keep you motivated.", Visual: StreakVisual },
  { eyebrow: "Split bills", title: "Shared costs, zero awkwardness.", description: "Split with friends and track who still owes.", Visual: SplitVisual },
];

export default function LandingBento() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {FEATURES.map(({ Visual, ...f }) => (
        <Card key={f.eyebrow} {...f}>
          <Visual />
        </Card>
      ))}
    </div>
  );
}
