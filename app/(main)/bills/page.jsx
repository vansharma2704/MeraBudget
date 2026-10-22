"use client";

import { useEffect, useState } from "react";
import { getBills, createBill, updateBillStatus, deleteBill } from "@/actions/bills";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Trash2, CheckCircle2, AlertCircle, ReceiptText } from "lucide-react";
import { toast } from "sonner";

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [frequency, setFrequency] = useState("MONTHLY");
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const result = await getBills();
    if (result.success) setBills(result.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!name || !amount) return;
    setLoading(true);
    const result = await createBill({
      name,
      amount: parseFloat(amount),
      dueDate: date,
      frequency,
    });
    if (result.success) {
      toast.success("Bill added!");
      setName("");
      setAmount("");
      fetchData();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const result = await deleteBill(id);
    if (result.success) {
      toast.success("Bill deleted");
      fetchData();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-12 page-fade-in">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl font-black uppercase tracking-[0.2em] text-white glow-text">Bills</h1>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Track and manage your recurring bills and payments.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="glass-card shadow-primary/5 lg:col-span-1 h-fit">
          <CardHeader className="standard-header">
            <span className="text-primary uppercase tracking-widest">Add New Bill</span>
          </CardHeader>
          <CardContent className="space-y-6 pt-8">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Bill Name</label>
              <Input placeholder="E.G. ELECTRICITY, RENT, INTERNET" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/5 border-white/10 text-white font-bold h-11 rounded-xl focus:ring-primary/50" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount (₹)</label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white/5 border-white/10 text-white font-bold h-11 rounded-xl focus:ring-primary/50" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Execution Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left bg-white/5 border-white/10 h-11 rounded-xl text-slate-400 font-bold hover:bg-white/10">
                    <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                    {date ? format(date, "PPP") : <span className="uppercase tracking-widest text-[10px]">PICK A DATE</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-50 glassmorphism border-white/10 backdrop-blur-xl">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Billing Frequency</label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-white/5 border-white/10 h-11 rounded-xl text-white font-bold focus:ring-primary/50">
                  <SelectValue placeholder="Frequency" />
                </SelectTrigger>
                <SelectContent className="glassmorphism border-white/10">
                  <SelectItem value="DAILY" className="text-[10px] font-black uppercase tracking-widest">Daily</SelectItem>
                  <SelectItem value="WEEKLY" className="text-[10px] font-black uppercase tracking-widest">Weekly</SelectItem>
                  <SelectItem value="MONTHLY" className="text-[10px] font-black uppercase tracking-widest">Monthly</SelectItem>
                  <SelectItem value="YEARLY" className="text-[10px] font-black uppercase tracking-widest">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCreate} disabled={loading} className="w-full h-12 bg-primary hover:bg-primary/80 text-white font-black uppercase tracking-[0.3em] rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 mt-4">
              {loading ? "SAVING..." : "ADD BILL"}
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 glass-card border-dashed border-primary/20 gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <AlertCircle className="h-8 w-8 text-primary/30" />
              </div>
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">No bills found. Add your first bill above.</p>
            </div>
          ) : (
            bills.map((bill) => (
              <Card key={bill.id} className="glass-card shadow-gold-500/5 group hover:bg-white/[0.03]">
                <CardContent className="p-8 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                      <ReceiptText className="h-7 w-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-black text-lg text-white uppercase tracking-widest">{bill.name}</h3>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        DUE: <span className="text-primary">{format(new Date(bill.dueDate), "PPP")}</span> • {bill.frequency}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right space-y-2">
                      <div className="text-2xl font-black text-white glow-text">₹{Number(bill.amount).toLocaleString()}</div>
                      <div className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${
                        bill.status === "PAID" 
                        ? "bg-teal-500/10 text-teal-400 border-teal-500/20 shadow-[0_0_10px_rgba(45,212,191,0.1)]" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
                      }`}>
                        {bill.status}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(bill.id)} className="text-red-500 hover:bg-red-500/10 transition-all rounded-full h-11 w-11">
                      <Trash2 size={22} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
