"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

export function AccountChart({ transactions }) {
  const [dateRange, setDateRange] = useState("1M");

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    // Filter transactions within date range
    const filtered = transactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    // Group transactions by date
    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [transactions, dateRange]);

  // Calculate totals for the selected period
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 border-b border-white/5">
        <CardTitle className="text-xs font-semibold uppercase tracking-widest text-primary">
          Account Overview
        </CardTitle>
        <Select defaultValue={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px] bg-white/5 border-white/10 rounded-xl">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent className="bg-[#232a38] border-white/10">
            {Object.entries(DATE_RANGES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-3 rounded-2xl bg-teal-500/5 border border-teal-500/10 hover:bg-teal-500/10 transition-all duration-300">
            <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-1">Total Income</p>
            <p className="text-xl font-bold text-white">
              ₹{totals.income.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all duration-300">
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Total Expense</p>
            <p className="text-xl font-bold text-white">
              ₹{totals.expense.toLocaleString()}
            </p>
          </div>
          <div className="text-center p-3 rounded-2xl bg-gold-500/5 border border-gold-500/10 hover:bg-gold-500/10 transition-all duration-300">
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Net Flow</p>
            <p
              className={`text-xl font-bold ${
                totals.income - totals.expense >= 0
                   ? "text-white"
                   : "text-red-400"
              }`}
            >
              ₹{(totals.income - totals.expense).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="date"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontWeight: "bold" }}
              />
              <YAxis
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontWeight: "bold" }}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                cursor={{ fill: "rgba(212, 168, 67, 0.05)" }}
                formatter={(value) => [`₹${value}`, undefined]}
                contentStyle={{
                  backgroundColor: "rgba(26, 31, 43, 0.95)",
                  border: "1px solid rgba(212, 168, 67, 0.2)",
                  borderRadius: "16px",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
                itemStyle={{ color: "#fff", fontWeight: "bold", fontSize: "12px" }}
                labelStyle={{ color: "#d4a843", fontWeight: "black", marginBottom: "4px", fontSize: "10px", textTransform: "uppercase" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }} />
              <Bar
                dataKey="income"
                name="Income"
                fill="#2DD4BF"
                radius={[6, 6, 0, 0]}
                className="drop-shadow-[0_0_8px_rgba(45,212,191,0.3)]"
              />
              <Bar
                dataKey="expense"
                name="Expenses"
                fill="#F43F5E"
                radius={[6, 6, 0, 0]}
                className="drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
