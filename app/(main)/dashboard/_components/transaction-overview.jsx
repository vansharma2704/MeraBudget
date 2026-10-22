"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import React, { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ["#e9c46a", "#7dd3fc", "#f4a261", "#94a3b8", "#e07a5f", "#a3b18a", "#f4dfa3"];

const DashboardOverview = ({ accounts, transactions }) => {
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.isDefault)?.id || accounts[0]?.id
  );

  const accountTransactions = transactions.filter(
    (t) => t.accountId === selectedAccountId
  );

  const recentTransactions = accountTransactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  // Use the same account data as the recent-transactions panel. Restricting the
  // chart to the current month made successfully imported historical statements
  // disappear from the breakdown.
  const expenses = accountTransactions.filter((t) => t.type === "EXPENSE");

  const expensesByCategory = expenses.reduce((acc, transaction) => {
    const category = transaction.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += transaction.amount;
    return acc;
  }, {});

  const PieChartData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({
      name: category,
      value: amount,
    })
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Card className="glass-card shadow-gold-500/5 h-full flex flex-col">
        <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
          <div className="flex items-center gap-2 text-primary">
            <span>Recent Transactions</span>
          </div>
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-[11px] font-semibold rounded-xl h-9 hover:bg-white/10 transition-all uppercase tracking-wider text-slate-300">
              <SelectValue placeholder="Account" />
            </SelectTrigger>
            <SelectContent className="bg-[#232a38] border-white/10">
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id} className="text-[10px] uppercase font-bold tracking-widest text-slate-400 focus:text-white">
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>

        <CardContent className="p-6 flex-1">
          <div className="space-y-6">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-700 gap-3">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <ArrowUpRight className="h-8 w-8 opacity-20" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em]">No transactions found</p>
                  <p className="text-[9px] font-medium opacity-50 mt-1 uppercase tracking-widest">Add your first transaction to get started.</p>
                </div>
              </div>
            ) : (
              recentTransactions.map((transaction) => {
                return (
                  <div key={transaction.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                    <div className="space-y-1">
                      <p className="text-sm font-black text-white group-hover:text-primary transition-colors">
                        {transaction.description || "Transaction"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                        {format(new Date(transaction.date), "dd MMM, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-semibold border",
                          transaction.type === "EXPENSE"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}
                      >
                        {transaction.type === "EXPENSE" ? "-" : "+"} ₹{transaction.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card shadow-gold-500/5 h-full flex flex-col">
        <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
          <div className="flex items-center gap-2 text-primary">
            <span>Expense Breakdown</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex-1 flex items-center justify-center">
          {PieChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-slate-700 font-black uppercase tracking-[0.3em] text-[10px] italic">
              No expense data for this period.
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={PieChartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={8}
                    stroke="none"
                    dataKey="value"
                  >
                    {PieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="drop-shadow-[0_0_15px_rgba(212,168,67,0.3)] transition-all duration-500"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(26, 31, 43, 0.95)",
                      border: "1px solid rgba(212, 168, 67, 0.2)",
                      borderRadius: "16px",
                      backdropFilter: "blur(8px)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                    }}
                    itemStyle={{ color: "#fff", fontWeight: "black", fontSize: "12px", textTransform: "uppercase" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    wrapperStyle={{ paddingTop: "30px", fontSize: "10px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b" }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
