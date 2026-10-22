import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp } from "lucide-react";
import Link from "next/link";

const GoalsCard = ({ goals }) => {
  if (!goals || goals.length === 0) {
    return (
      <Link href="/goals" className="h-full">
        <Card className="glass-card cursor-pointer group h-full border-dashed border-primary/20 hover:border-primary/50 transition-all">
          <CardContent className="flex flex-col items-center justify-center p-6 h-full min-h-[160px]">
            <div className="p-4 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-bold text-white uppercase tracking-wider">Set Your Goals</p>
            <p className="text-xs text-slate-500 mt-1 italic">Track your financial milestones</p>
          </CardContent>
        </Card>
      </Link>
    );
  }

  // Show top goal or summary
  const topGoal = goals[0];
  const progress = (Number(topGoal.currentAmount) / Number(topGoal.targetAmount)) * 100;

  return (
    <Link href="/goals" className="h-full">
      <Card className="glass-card h-full group hover:shadow-[0_0_30px_rgba(233,196,106,0.15)] transition-all">
        <CardContent className="p-6 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">
              Goal Tracking
            </span>
          </div>
          
          <div className="space-y-1 mb-4">
            <h3 className="font-black text-sm text-white uppercase tracking-widest truncate">{topGoal.name}</h3>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>₹{Number(topGoal.currentAmount).toLocaleString()}</span>
              <span>Target: ₹{Number(topGoal.targetAmount).toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
               <span className="text-[9px] font-black text-primary uppercase tracking-widest">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-primary shadow-[0_0_10px_rgba(212,168,67,0.5)] transition-all duration-500" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GoalsCard;
