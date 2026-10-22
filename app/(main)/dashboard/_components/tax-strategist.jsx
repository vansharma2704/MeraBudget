"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Info, CheckCircle2, ChevronRight } from "lucide-react";
import { getDashboardData } from "@/actions/dashboard";
import { Progress } from "@/components/ui/progress";

export default function TaxStrategist() {
  const [taxData, setTaxData] = useState({
    hra: { detected: false, amount: 0, suggestion: "Paying rent? You can save on tax via HRA." },
    section80C: { total: 0, limit: 150000, items: [] },
    insurance: { detected: false, amount: 0 }
  });

  useEffect(() => {
    async function fetchData() {
      const transactions = await getDashboardData();
      if (!transactions || transactions.length === 0) return;

      const newTaxData = {
        hra: { detected: false, amount: 0, suggestion: "Paying rent? You can save on tax via HRA." },
        section80C: { total: 0, limit: 150000, items: [] },
        insurance: { detected: false, amount: 0 }
      };

      transactions.forEach(t => {
        const desc = t.description?.toLowerCase() || "";
        const cat = t.category?.toLowerCase() || "";
        const amt = Number(t.amount);

        // Rent/HRA
        if (desc.includes("rent") || cat.includes("rent")) {
          newTaxData.hra.detected = true;
          newTaxData.hra.amount += amt;
        }

        // 80C - Insurance, PF, ELSS (simplified for demo)
        if (desc.includes("insurance") || desc.includes("elss") || desc.includes("mutual fund") || desc.includes("pf")) {
          newTaxData.section80C.total += amt;
          newTaxData.section80C.items.push({ name: t.description || t.category, amount: amt });
        }
      });

      setTaxData(newTaxData);
    }
    fetchData();
  }, []);

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <Lightbulb size={16} />
          <span>Tax Strategist</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 space-y-6">
        {/* HRA Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-tighter">HRA Deduction</h4>
            {taxData.hra.detected ? (
              <span className="text-[9px] text-teal-400 font-black px-2 py-0.5 rounded-full bg-teal-400/10 border border-teal-400/20">ELIGIBLE</span>
            ) : (
              <span className="text-[9px] text-slate-500 font-bold px-2 py-0.5 rounded-full bg-white/5">NOT FOUND</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            {taxData.hra.detected 
              ? `Found ₹${taxData.hra.amount.toLocaleString()} in rent payments. Submit receipts to claim HRA deduction.`
              : "No rent payments found in recent transactions."}
          </p>
        </div>

        {/* 80C Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-tighter">Section 80C Status</h4>
            <span className="text-[10px] font-bold text-primary">
              ₹{taxData.section80C.total.toLocaleString()} / ₹1.5L
            </span>
          </div>
          <Progress 
            value={(taxData.section80C.total / 150000) * 100} 
            className="h-1.5"
            indicatorClassName="bg-primary shadow-[0_0_8px_rgba(212,168,67,0.5)]"
          />
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
            {taxData.section80C.total < 150000 
              ? `You can save more: ₹${(150000 - taxData.section80C.total).toLocaleString()} remaining in Section 80C limit.`
              : "Section 80C limit reached for this financial year."}
          </p>
        </div>

        <div className="pt-2 border-t border-white/5">
          <button className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white group transition-all">
            View Tax-Saving Opportunities
            <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
