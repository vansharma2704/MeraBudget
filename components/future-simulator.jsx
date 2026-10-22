"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export default function FutureSimulator() {
  const [monthlySavings, setMonthlySavings] = useState(5000);
  const [returnRate, setReturnRate] = useState(12);
  const [years, setYears] = useState(10);

  const data = useMemo(() => {
    const projection = [];
    let balance = 0;
    const monthlyRate = returnRate / 100 / 12;

    for (let month = 0; month <= years * 12; month++) {
      if (month % 12 === 0) {
        projection.push({
          year: month / 12,
          projection: Math.round(balance),
        });
      }
      balance = (balance + monthlySavings) * (1 + monthlyRate);
    }
    return projection;
  }, [monthlySavings, returnRate, years]);

  const finalBalance = data[data.length - 1].projection;

  return (
    <Card className="glass-card shadow-gold-500/10 h-full flex flex-col">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <span>MeraBudget Growth Simulator</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Monthly Contribution</Label>
                <span className="text-xs font-black text-white glow-text tracking-tighter">₹{monthlySavings.toLocaleString()}</span>
              </div>
              <Slider 
                value={[monthlySavings]} 
                onValueChange={(v) => setMonthlySavings(v[0])} 
                max={100000} 
                step={1000} 
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Return Rate (%)</Label>
                <span className="text-xs font-black text-white glow-text tracking-tighter">{returnRate}%</span>
              </div>
              <Slider 
                value={[returnRate]} 
                onValueChange={(v) => setReturnRate(v[0])} 
                max={30} 
                step={0.5} 
                className="py-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Time Horizon</Label>
                <span className="text-xs font-black text-white glow-text tracking-tighter">{years} YRS</span>
              </div>
              <Slider 
                value={[years]} 
                onValueChange={(v) => setYears(v[0])} 
                max={40} 
                step={1} 
                className="py-2"
              />
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 shadow-inner group">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 transition-colors group-hover:text-primary">Expected Balance</p>
              <p className="text-3xl font-black text-white glow-text leading-none">₹{finalBalance.toLocaleString()}</p>
            </div>
          </div>

          <div className="lg:col-span-2 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4a843" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#d4a843" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tick={{ fill: "#64748b", fontWeight: "bold" }}
                  tickFormatter={(val) => `YR ${val}`}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.2)" 
                  fontSize={10} 
                  tick={{ fill: "#64748b", fontWeight: "bold" }}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(26, 31, 43, 0.95)", 
                    border: "1px solid rgba(212, 168, 67, 0.2)", 
                    borderRadius: "16px",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  }}
                  itemStyle={{ color: "#fff", fontWeight: "bold", fontSize: "12px" }}
                  labelStyle={{ color: "#d4a843", fontWeight: "black", marginBottom: "4px", fontSize: "10px", textTransform: "uppercase" }}
                  formatter={(val) => [`₹${val.toLocaleString()}`, "Capital"]}
                  labelFormatter={(label) => `Timeline: Year ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="projection" 
                  stroke="#d4a843" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorProjection)" 
                  className="drop-shadow-[0_0_15px_rgba(212,168,67,0.5)]"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
