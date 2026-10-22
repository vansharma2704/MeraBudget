"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell
} from "recharts";
import { getDashboardData } from "@/actions/dashboard";

export default function LifestyleTracker() {
  const [data, setData] = useState([]);
  const [isInflated, setIsInflated] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const transactions = await getDashboardData();
      if (!transactions || transactions.length === 0) return;

      // Group by month
      const months = {};
      transactions.forEach(t => {
        const date = new Date(t.date);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        if (!months[key]) months[key] = { name: key, income: 0, expense: 0 };
        if (t.type === "INCOME") months[key].income += Number(t.amount);
        else months[key].expense += Number(t.amount);
      });

      const chartData = Object.values(months).slice(-6); // Last 6 months
      setData(chartData);

      // Check for inflation: if average expense growth > income growth
      if (chartData.length >= 2) {
        const first = chartData[0];
        const last = chartData[chartData.length - 1];
        const incomeGrowth = first.income > 0 ? (last.income - first.income) / first.income : 0;
        const expenseGrowth = first.expense > 0 ? (last.expense - first.expense) / first.expense : 0;
        
        if (expenseGrowth > incomeGrowth && last.expense > first.expense) {
          setIsInflated(true);
        }
      }
    }
    fetchData();
  }, []);

  return (
    <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <span>Income vs Expenses</span>
          {isInflated ? (
            <TrendingUp className="h-4 w-4 text-red-500 animate-pulse" />
          ) : (
            <TrendingDown className="h-4 w-4 text-teal-400" />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1 flex flex-col justify-center space-y-6">
        {isInflated && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 shadow-lg shadow-red-500/5">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-200 leading-relaxed">
              <span className="font-black uppercase tracking-widest text-red-400">Warning:</span> Expenses are rising faster than income. Consider reviewing your budget.
            </p>
          </div>
        )}

        <div className="h-[220px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={10} 
                tick={{ fill: "#64748b", fontWeight: "bold" }}
                tickFormatter={(val) => val.split("-")[1] + "/" + val.split("-")[0].slice(-2)}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.2)" 
                fontSize={10} 
                tick={{ fill: "#64748b", fontWeight: "bold" }}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "rgba(26, 31, 43, 0.95)", 
                  border: "1px solid rgba(212, 168, 67, 0.2)", 
                  borderRadius: "16px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
                itemStyle={{ fontWeight: "black", fontSize: "12px" }}
                labelStyle={{ color: "#d4a843", fontWeight: "black", marginBottom: "4px", fontSize: "10px", textTransform: "uppercase" }}
              />
              <Legend 
                wrapperStyle={{ fontSize: "10px", fontWeight: "900", paddingTop: "20px", textTransform: "uppercase", letterSpacing: "0.1em" }} 
              />
              <Bar dataKey="income" fill="#e9c46a" radius={[6, 6, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
