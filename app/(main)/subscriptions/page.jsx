"use client";

import { useEffect, useState } from "react";
import { getSubscriptions, createSubscription, deleteSubscription } from "@/actions/subscriptions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Trash2, Smartphone, Infinity, Zap } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const result = await getSubscriptions();
    if (result.success) setSubs(result.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!name || !amount) return;
    setLoading(true);
    const result = await createSubscription({
      name,
      amount: parseFloat(amount),
      nextBilling: new Date(),
      frequency: "MONTHLY",
    });
    if (result.success) {
      toast.success("Subscription added!");
      setName("");
      setAmount("");
      fetchData();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const result = await deleteSubscription(id);
    if (result.success) {
      toast.success("Subscription removed");
      fetchData();
    }
  };

  const totalMonthly = subs.reduce((sum, sub) => sum + Number(sub.amount), 0);

  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-12 page-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Subscriptions</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Manage your recurring subscriptions and services.</p>
        </div>
        <Card className="glass-card border-primary/30 p-4 sm:p-6 sm:px-10 shadow-primary/10">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">TOTAL MONTHLY SPEND</div>
          <div className="text-3xl font-black text-white">₹{totalMonthly.toLocaleString()}</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <Card className="glass-card shadow-primary/5 lg:col-span-1 h-fit">
          <CardHeader className="border-b border-white/5 bg-white/5">
            <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-primary">Add Subscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Service Name</label>
              <Input placeholder="E.G. NETFLIX, SPOTIFY, AMAZON" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white font-bold h-11 rounded-xl focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Monthly Amount (₹)</label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white/5 border-white/10 text-white font-bold h-11 rounded-xl focus:ring-primary/50" />
            </div>
            <Button onClick={handleCreate} disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-[0.3em] rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 mt-4">
              {loading ? "SAVING..." : "ADD SUBSCRIPTION"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subs.map((sub) => (
            <Card key={sub.id} className="glass-card hover:bg-white/[0.03] group h-fit">
              <CardContent className="p-8 flex flex-col justify-between h-full space-y-6">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <Smartphone size={24} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(sub.id)} className="text-red-500 hover:bg-red-500/10 transition-all rounded-full h-10 w-10">
                    <Trash2 size={20} />
                  </Button>
                </div>
                <div className="space-y-1">
                  <h3 className="font-black text-lg text-white uppercase tracking-widest">{sub.name}</h3>
                  <p className="text-2xl font-black text-white">₹{Number(sub.amount).toLocaleString()}<span className="text-[10px] text-slate-500 font-medium ml-1">/ month</span></p>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] pt-4 border-t border-white/5">
                  <Zap size={14} className="text-amber-500" /> REENTRY: <span className="text-primary">{format(new Date(sub.nextBilling), "MMM dd")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
