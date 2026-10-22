"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function MonthlySummary({ transactions = [] }) {
  // Insights summarizes the complete data set supplied by the dashboard so a
  // historical statement import is reflected in the headline figures too.
  const income = transactions
    .filter(t => t.type === "INCOME")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const expenses = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const balance = income - expenses;

  const stats = [
    { label: "Net Inflow", value: income, icon: <TrendingUp className="text-emerald-400" />, color: "text-emerald-400", change: <ArrowUpRight size={10}/> },
    { label: "Net Outflow", value: expenses, icon: <TrendingDown className="text-rose-400" />, color: "text-rose-400", change: <ArrowDownRight size={10}/> },
  ];

  return (
    <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <Wallet size={16} />
          <span>Financial Summary</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, idx) => (
            <div key={idx} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
              <div className="flex items-center gap-2 mb-2 opacity-60">
                {stat.icon}
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">{stat.label}</span>
              </div>
              <div className={`text-xl font-black ${stat.color} flex items-center justify-between`}>
                ₹{stat.value.toLocaleString()}
                <span className="opacity-40 group-hover:opacity-100 transition-opacity">{stat.change}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 bg-gradient-to-br from-blue-500/10 to-gold-500/10 rounded-[2rem] border border-blue-500/10 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Operational Surplus</p>
            <p className="text-3xl font-black text-white glow-text tracking-tighter">₹{balance.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-blue-500/20 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] relative z-10">
            <TrendingUp className="text-blue-300 h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
