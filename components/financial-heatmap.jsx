"use client";

import React, { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Calendar as CalendarIcon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const FinancialHeatmap = ({ transactions = [], compact = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleDateClick = (date) => {
    const params = new URLSearchParams(searchParams);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (params.get('date') === dateStr) {
      params.delete('date');
    } else {
      params.set('date', dateStr);
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Process transactions to get daily summaries
  const dailyData = useMemo(() => {
    const data = {};
    
    transactions.forEach(t => {
      // Create a date string to use as a key without timezone issues
      const dt = new Date(t.date);
      const dayKey = format(dt, 'yyyy-MM-dd');
      
      if (!data[dayKey]) {
        data[dayKey] = {
          income: 0,
          expense: 0,
          count: 0
        };
      }
      
      if (t.type === 'INCOME' || (t.amountType && t.amountType === 'INCOME')) {
        data[dayKey].income += t.amount || (t.balance || 0); // Handle both formats if needed
      } else {
        data[dayKey].expense += t.amount || (t.balance || 0);
      }
      
      data[dayKey].count += 1;
    });
    
    return data;
  }, [transactions]);

  // Determine thresholds based on data or defaults
  const thresholds = useMemo(() => {
    const expenses = Object.values(dailyData).map(d => d.expense).filter(e => e > 0);
    
    if (expenses.length === 0) return { low: 0, medium: 0 };
    
    // Simple thresholds: bottom 33%, middle 33%, top 33%
    expenses.sort((a, b) => a - b);
    const lowIndex = Math.floor(expenses.length * 0.33);
    const medIndex = Math.floor(expenses.length * 0.66);
    
    return {
      low: expenses[lowIndex] || 500,
      medium: expenses[medIndex] || 2000
    };
  }, [dailyData]);

  const getColorClass = (date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const data = dailyData[dayKey];
    const isSelected = searchParams.get('date') === dayKey;
    
    if (!data || (data.income === 0 && data.expense === 0)) {
      return isSelected ? "bg-primary/20 ring-2 ring-primary border-primary" : "bg-secondary/40 hover:bg-secondary border-border/20"; // Empty/No data
    }

    if (data.income > data.expense * 2) {
      return `bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/20 border-blue-500/50 ${isSelected ? 'ring-2 ring-blue-300 ring-offset-2' : ''}`; // High income day
    }

    if (data.expense === 0) return `bg-green-400 hover:bg-green-500 text-white ${isSelected ? 'ring-2 ring-green-300 ring-offset-2' : ''}`; // Income only

    // Expense logic
    if (data.expense <= thresholds.low) {
      return `bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 border-emerald-500/50 ${isSelected ? 'ring-2 ring-emerald-300 ring-offset-2' : ''}`; // Low spending
    }
    
    if (data.expense <= thresholds.medium) {
      return `bg-amber-400 hover:bg-amber-500 text-white shadow-sm shadow-amber-500/20 border-amber-500/50 ${isSelected ? 'ring-2 ring-amber-300 ring-offset-2' : ''}`; // Medium spending
    }
    
    return `bg-rose-500 hover:bg-rose-600 text-white shadow-sm shadow-rose-500/20 border-rose-500/50 ${isSelected ? 'ring-2 ring-rose-300 ring-offset-2' : ''}`; // High spending
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  return (
    <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative">
      <CardHeader className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 sm:px-6 py-4 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <CalendarIcon size={16} />
          <span>Transaction Activity</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          <button onClick={prevMonth} className="p-1 px-3 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 transition-all text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white">Back</button>
          <span className="font-black text-[10px] uppercase tracking-widest text-white min-w-[96px] text-center whitespace-nowrap">{format(currentDate, 'MMMM yyyy')}</span>
          <button onClick={nextMonth} className="p-1 px-3 rounded-full bg-white/5 hover:bg-primary/20 border border-white/10 transition-all text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white">Next</button>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-6 flex-1">
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-3">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, i) => (
            <div key={`${day}-${i}`} className="text-center text-[9px] font-black text-slate-600 uppercase tracking-normal sm:tracking-[0.2em]">
              {day}
            </div>
          ))}
        </div>

        <TooltipProvider delayDuration={100}>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {/* Empty slots for start of month */}
            {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square rounded-xl bg-transparent" />
            ))}

            {/* Calendar Days */}
            {daysInMonth.map(date => {
              const dayKey = format(date, 'yyyy-MM-dd');
              const data = dailyData[dayKey];
              const hasData = data && (data.income > 0 || data.expense > 0);
              const isSelected = searchParams.get('date') === dayKey;

              return (
                <Tooltip key={dayKey}>
                  <TooltipTrigger asChild>
                    <div 
                      onClick={() => handleDateClick(date)}
                      className={cn(
                        "aspect-square rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group",
                        getColorClass(date),
                        isSameDay(date, new Date()) ? 'ring-2 ring-primary ring-offset-2 ring-offset-[#1a1f2b]' : '',
                        isSelected ? 'scale-110 z-10' : 'hover:scale-105'
                      )}
                    >
                      <span className="text-[11px] font-black tracking-tighter leading-none">{format(date, 'd')}</span>
                      {hasData && (
                        <div className="w-1 h-1 rounded-full bg-white opacity-50 absolute bottom-1" />
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 rounded-2xl border-2 border-white/50 animate-pulse" />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-[#232a38] border-white/10 p-4 shadow-2xl backdrop-blur-xl">
                    <div className="space-y-3 min-w-[150px]">
                      <h4 className="font-black text-[10px] border-b border-white/10 pb-2 text-primary uppercase tracking-widest">{format(date, 'MMMM d, yyyy')}</h4>
                      {hasData ? (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Income:</span>
                            <span className="font-black text-emerald-400">₹{data.income.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-500 font-bold uppercase tracking-widest">Expense:</span>
                            <span className="font-black text-rose-400">₹{data.expense.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] mt-2 pt-2 border-t border-white/5">
                            <span className="text-slate-600 font-black uppercase tracking-widest">Transactions:</span>
                            <span className="font-black text-white">{data.count}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] italic py-2 text-center">No transactions on this day</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>

        {/* Legend */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-white/5 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-lg bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-lg bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-lg bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-lg bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Income</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

};

export default FinancialHeatmap;
