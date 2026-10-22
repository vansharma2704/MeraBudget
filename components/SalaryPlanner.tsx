"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { IndianRupee, Wallet, PiggyBank, ShoppingBag, Info, Settings2, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Button } from "./ui/button";

const SalaryPlanner = () => {
  const [salary, setSalary] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [categories, setCategories] = useState([
    { id: 1, label: "Essential Needs", percentage: 50, color: "bg-gold-500", icon: "Wallet", desc: "Rent, bills, groceries, and debt." },
    { id: 2, label: "Savings & Investments", percentage: 30, color: "bg-sky-400", icon: "PiggyBank", desc: "Emergency fund, retirement, and stocks." },
    { id: 3, label: "Wants & Lifestyle", percentage: 20, color: "bg-orange-400", icon: "ShoppingBag", desc: "Dining out, hobbies, and shopping." }
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ label: "", percentage: 0 });

  useEffect(() => {
    const savedSalary = localStorage.getItem("merabudget_salary");
    const savedCategories = localStorage.getItem("merabudget_categories");
    if (savedSalary) setSalary(savedSalary);
    if (savedCategories) setCategories(JSON.parse(savedCategories));
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("merabudget_categories", JSON.stringify(categories));
    }
  }, [categories, isLoaded]);

  const handleSalaryChange = (e) => {
    const val = e.target.value;
    setSalary(val);
    localStorage.setItem("merabudget_salary", val);
  };

  const addCategory = () => {
    const newId = categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCategory = {
      id: newId,
      label: "New Category",
      percentage: 0,
      color: "bg-slate-500",
      icon: "Wallet",
      desc: "Custom category"
    };
    setCategories([...categories, newCategory]);
    startEditing(newCategory);
  };

  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  const startEditing = (cat) => {
    setEditingId(cat.id);
    setEditForm({ label: cat.label, percentage: cat.percentage });
  };

  const saveEdit = () => {
    setCategories(categories.map(c => 
      c.id === editingId ? { ...c, label: editForm.label, percentage: Number(editForm.percentage) } : c
    ));
    setEditingId(null);
  };

  const amount = parseFloat(salary) || 0;
  const totalPercentage = categories.reduce((sum, cat) => sum + cat.percentage, 0);

  const getIcon = (name) => {
    switch (name) {
      case "Wallet": return <Wallet className="h-4 w-4" />;
      case "PiggyBank": return <PiggyBank className="h-4 w-4" />;
      case "ShoppingBag": return <ShoppingBag className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  if (!isLoaded) return null;

  return (
    <Card className="glass-card h-full border-gold-500/10">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-gold-300 flex items-center gap-2">
            MeraBudget Smart Planner
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 opacity-50" />
                </TooltipTrigger>
                <TooltipContent className="glassmorphism p-2 text-[10px] max-w-[200px]">
                  Customize your budget allocations. Total currently: {totalPercentage}%
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsCustomizing(!isCustomizing)}
            className={`h-8 px-2 text-[10px] font-bold uppercase tracking-tighter transition-all ${isCustomizing ? "bg-gold-500/20 text-gold-300" : "text-slate-500 hover:text-white"}`}
          >
            <Settings2 className="h-3 w-3 mr-1" />
            {isCustomizing ? "Done" : "Customize"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative group">
          <input
            type="number"
            placeholder="Enter Monthly Salary"
            value={salary}
            onChange={handleSalaryChange}
            className="flex h-14 w-full bg-white/5 border-white/10 focus:border-gold-500/50 transition-all text-xl font-bold py-6 pl-10 rounded-2xl outline-none"
          />
          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gold-400 opacity-70" />
        </div>

        <div className="space-y-4 pt-2">
          {categories.map((item) => (
            <div key={item.id} className="group/item relative space-y-1.5">
              {editingId === item.id ? (
                <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-gold-500/30">
                  <input 
                    className="bg-transparent border-b border-white/10 text-[11px] font-bold uppercase text-white outline-none w-full"
                    value={editForm.label}
                    onChange={(e) => setEditForm({...editForm, label: e.target.value})}
                  />
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      className="bg-transparent border-b border-white/10 text-[11px] font-bold text-white outline-none w-12 text-right"
                      value={editForm.percentage}
                      onChange={(e) => setEditForm({...editForm, percentage: Number(e.target.value)})}
                    />
                    <span className="text-[10px] text-slate-500">%</span>
                  </div>
                  <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                  <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-tight">
                    <span className="flex items-center gap-1.5 opacity-80">
                      <span className="text-gold-400">{getIcon(item.icon)}</span>
                      {item.label} ({item.percentage}%)
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-white">₹{((amount * item.percentage) / 100).toLocaleString()}</span>
                      {isCustomizing && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditing(item)} className="text-slate-500 hover:text-gold-400 transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => deleteCategory(item.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full ${item.color} transition-all duration-1000 shadow-[0_0_10px_rgba(233,196,106,0.4)]`}
                      style={{ width: `${amount > 0 ? item.percentage : 0}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          ))}

          {isCustomizing && (
            <Button 
              variant="outline" 
              size="default"
              onClick={addCategory}
              className="w-full border-dashed border-white/10 hover:border-gold-500/50 bg-transparent text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white"
            >
              <Plus className="h-3 w-3 mr-2" />
              Add Category
            </Button>
          )}

          {totalPercentage !== 100 && (
            <p className="text-[9px] text-orange-400/70 font-medium text-center uppercase tracking-widest italic">
              Warning: Total allocation is {totalPercentage}% (Ideal: 100%)
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SalaryPlanner;
