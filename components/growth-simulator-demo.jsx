"use client";
import { useMemo, useState } from "react";

/* Interactive SIP-style growth calculator for the landing page. */

const inr = (n) => "₹" + Math.round(n).toLocaleString("en-IN");

const short = (n) => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return inr(n);
};

// Future value of a monthly contribution, compounded monthly
const futureValue = (monthly, annualRate, years) => {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
};

const Slider = ({ label, value, display, min, max, step, onChange }) => (
  <label className="block">
    <div className="flex justify-between items-baseline mb-3">
      <span className="text-white/65 text-sm">{label}</span>
      <span className="text-white font-semibold tabular-nums">{display}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#e9c46a]"
      style={{
        background: `linear-gradient(90deg,#e9c46a ${((value - min) / (max - min)) * 100}%,rgba(255,255,255,0.1) 0)`,
      }}
    />
  </label>
);

export default function GrowthSimulatorDemo() {
  const [monthly, setMonthly] = useState(5000);
  const [years, setYears] = useState(15);
  const [rate, setRate] = useState(12);

  const { total, invested, points } = useMemo(() => {
    const total = futureValue(monthly, rate, years);
    const invested = monthly * years * 12;
    const points = Array.from({ length: years + 1 }, (_, y) => ({
      value: futureValue(monthly, rate, y),
      invested: monthly * y * 12,
    }));
    return { total, invested, points };
  }, [monthly, years, rate]);

  // Chart paths (viewBox 300 x 140)
  const max = points[points.length - 1].value || 1;
  const x = (i) => (i / years) * 300;
  const y = (v) => 135 - (v / max) * 125;
  const line = (key) => points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
  const valueLine = line("value");

  return (
    <div className="grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 items-center
      rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.045] to-white/[0.01] p-6 sm:p-10">

      <div className="space-y-8">
        <Slider label="Monthly investment" value={monthly} display={inr(monthly)}
          min={500} max={50000} step={500} onChange={setMonthly} />
        <Slider label="Time period" value={years} display={`${years} years`}
          min={1} max={30} step={1} onChange={setYears} />
        <Slider label="Expected return" value={rate} display={`${rate}% p.a.`}
          min={4} max={18} step={0.5} onChange={setRate} />
      </div>

      <div>
        <p className="text-white/55 text-sm">In {years} years you could have</p>
        <p className="text-gold-200 font-bold tracking-tight tabular-nums mt-1"
          style={{ fontSize: "clamp(2.25rem,5vw,3.5rem)", lineHeight: 1.05 }}>
          {short(total)}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
          <span className="text-white/55">Invested <span className="text-white font-semibold">{short(invested)}</span></span>
          <span className="text-white/55">Returns <span className="text-green-400 font-semibold">+{short(total - invested)}</span></span>
        </div>

        <svg viewBox="0 0 300 140" className="w-full h-40 mt-6" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="sim-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e9c46a" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#e9c46a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${valueLine} L300 140 L0 140 Z`} fill="url(#sim-fill)" />
          <path d={line("invested")} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <path d={valueLine} fill="none" stroke="#e9c46a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="flex items-center gap-5 mt-2 text-xs text-white/50">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-gold-400" />Your wealth</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed border-white/40" />Amount invested</span>
        </div>
      </div>
    </div>
  );
}
