"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import {useFetch} from "@/hooks/use-fetch";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/budget";

export function BudgetProgress({ initialBudget, currentExpenses }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    await updateBudgetFn(amount);
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  useEffect(() => {
    if (updatedBudget?.success) {
      setIsEditing(false);
      toast.success("Budget updated successfully");
    }
  }, [updatedBudget]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  return (
    <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <span>Budget Control</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-24 bg-white/5 border-white/10 text-white h-7 text-[10px]"
                placeholder="Amt"
                autoFocus
                disabled={isLoading}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUpdateBudget}
                disabled={isLoading}
                className="h-7 w-7 hover:bg-teal-500/10 text-teal-400"
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancel}
                disabled={isLoading}
                className="h-7 w-7 hover:bg-red-500/10 text-red-400"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span className="text-[10px] text-white lowercase tracking-normal font-medium mr-2">
                {initialBudget
                  ? `₹${(currentExpenses ?? 0).toFixed(0)} / ₹${initialBudget.amount.toFixed(0)}`
                  : "No established budget"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-7 w-7 text-slate-500 hover:text-white transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1">
        {initialBudget && (
          <div className="space-y-4">
            <Progress
              value={percentUsed}
              indicatorClassName={
                percentUsed >= 90
                  ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  : percentUsed >= 75
                    ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
              }
            />
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
              <span className={percentUsed >= 90 ? "text-red-400" : "text-slate-500"}>
                {percentUsed >= 90 ? "Critical Usage" : "Safe Zone"}
              </span>
              <span className="text-white font-semibold">{percentUsed.toFixed(1)}% Used</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BudgetProgress;