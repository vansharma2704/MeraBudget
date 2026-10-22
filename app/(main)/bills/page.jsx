"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertCircle, CalendarDays, Clock3, ReceiptText, Repeat2, Trash2 } from "lucide-react";
import { getBills, createBill, deleteBill } from "@/actions/bills";
import { getSubscriptions, createSubscription, deleteSubscription } from "@/actions/subscriptions";
import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const FILTERS = [["BILL", "Bills"], ["SUBSCRIPTION", "Subscriptions"]];
const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const EXPENSE_CATEGORIES = defaultCategories.filter((category) => category.type === "EXPENSE");

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [itemType, setItemType] = useState("BILL");
  const [filter, setFilter] = useState("BILL");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [frequency, setFrequency] = useState("MONTHLY");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState("utilities");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(null);

  const fetchData = async () => {
    const [billResult, subscriptionResult, accountResult] = await Promise.all([
      getBills(),
      getSubscriptions(),
      getUserAccounts(),
    ]);
    if (billResult.success) setBills(billResult.data);
    if (subscriptionResult.success) setSubscriptions(subscriptionResult.data);
    setAccounts(accountResult);
    setAccountId((current) => current || accountResult.find((account) => account.isDefault)?.id || accountResult[0]?.id || "");
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const countdown = (value) => {
    if (!now) return "Calculating…";
    const difference = new Date(value).getTime() - now;
    if (difference <= 0) {
      const overdueMinutes = Math.floor(Math.abs(difference) / 60_000);
      const overdueDays = Math.floor(overdueMinutes / 1_440);
      const overdueHours = Math.floor((overdueMinutes % 1_440) / 60);
      return overdueDays > 0 ? `${overdueDays}d ${overdueHours}h overdue` : `${overdueHours}h overdue`;
    }
    const minutes = Math.floor(difference / 60_000);
    const days = Math.floor(minutes / 1_440);
    const hours = Math.floor((minutes % 1_440) / 60);
    return days > 0 ? `${days}d ${hours}h remaining` : `${hours}h ${minutes % 60}m remaining`;
  };

  const handleCreate = async () => {
    if (!name.trim() || !(Number(amount) > 0) || !date) {
      toast.error("Enter a name, amount and payment date");
      return;
    }
    if (itemType === "BILL" && !accountId) {
      toast.error("Create or select an account before recording a paid bill");
      return;
    }
    setLoading(true);
    const paymentDate = new Date(`${date}T12:00:00`).toISOString();
    const result = itemType === "BILL"
      ? await createBill({ name, amount: Number(amount), paidAt: paymentDate, accountId, category })
      : await createSubscription({ name, amount: Number(amount), nextBilling: paymentDate, frequency });
    setLoading(false);
    if (!result.success) return toast.error(result.error || "Could not save payment");
    toast.success(itemType === "BILL" ? "Bill added" : "Subscription added");
    setName("");
    setAmount("");
    await fetchData();
  };

  const removeBill = async (id) => {
    const result = await deleteBill(id);
    if (result.success) { toast.success("Bill deleted"); fetchData(); }
  };

  const removeSubscription = async (id) => {
    const result = await deleteSubscription(id);
    if (result.success) { toast.success("Subscription removed"); fetchData(); }
  };

  const visibleBills = filter === "SUBSCRIPTION" ? [] : bills;
  const visibleSubscriptions = filter === "BILL" ? [] : subscriptions;
  const empty = visibleBills.length === 0 && visibleSubscriptions.length === 0;
  const monthlySpend = subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0);
  const paidTotal = bills.reduce((sum, bill) => sum + Number(bill.amount), 0);

  const changeMode = (value) => {
    setFilter(value);
    setItemType(value);
    setName("");
    setAmount("");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 page-fade-in">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.1em] text-white">Recurring Expenses</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Bills and subscriptions, organised by their next due date.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3">
            <p className="text-[9px] uppercase tracking-widest text-slate-500">{filter === "BILL" ? "Total bills paid" : "Monthly subscriptions"}</p>
            <p className="text-xl font-black text-white">₹{(filter === "BILL" ? paidTotal : monthlySpend).toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(([value, label]) => (
            <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => changeMode(value)} className="min-w-[140px] rounded-full">
              {value === "BILL" ? <ReceiptText size={15} /> : <Repeat2 size={15} />}{label}
            </Button>
          ))}
        </div>
        <div className={`rounded-2xl border p-4 flex items-start gap-3 ${filter === "BILL" ? "border-gold-400/20 bg-gold-400/[0.05]" : "border-sky-400/20 bg-sky-400/[0.05]"}`}>
          {filter === "BILL" ? <ReceiptText className="text-gold-300 shrink-0" size={20} /> : <Repeat2 className="text-sky-300 shrink-0" size={20} />}
          <div>
            <p className="text-sm font-bold text-white">{filter === "BILL" ? "Bills record payments you have already made" : "Subscriptions renew automatically"}</p>
            <p className="text-xs text-white/50 mt-1">{filter === "BILL" ? "Record the amount paid and the date you paid rent, electricity, insurance or another bill." : "Track the next payment date for Netflix, YouTube Premium, Spotify or software memberships."}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="min-h-16 border-b border-white/5 bg-white/5 flex items-center justify-center px-6 !pb-0"><CardTitle className="w-full text-center text-sm uppercase tracking-widest text-primary">Add {itemType === "BILL" ? "Bill" : "Subscription"}</CardTitle></CardHeader>
          <CardContent className="space-y-5 pt-6">
            <Field label={`${itemType === "BILL" ? "Bill" : "Service"} Name`}>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder={itemType === "BILL" ? "E.G. RENT, ELECTRICITY" : "E.G. NETFLIX, SPOTIFY"} />
            </Field>
            <Field label="Amount (₹)"><Input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></Field>
            <Field label={itemType === "BILL" ? "Payment Date" : "Next Payment Date"}><Input type="date" min={itemType === "SUBSCRIPTION" ? format(new Date(), "yyyy-MM-dd") : undefined} max={itemType === "BILL" ? format(new Date(), "yyyy-MM-dd") : undefined} value={date} onChange={(event) => setDate(event.target.value)} className="[color-scheme:dark]" /></Field>
            {itemType === "BILL" && <>
              <Field label="Paid From Account">
                <Select value={accountId} onValueChange={setAccountId} disabled={accounts.length === 0}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select an account" /></SelectTrigger>
                  <SelectContent className="bg-[#232a38] border-white/10">{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}{account.isDefault ? " (Default)" : ""}</SelectItem>)}</SelectContent>
                </Select>
                {accounts.length === 0 && <p className="mt-2 text-xs text-amber-300/80">Create an account from the Dashboard first.</p>}
              </Field>
              <Field label="Expense Category">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#232a38] border-white/10">{EXPENSE_CATEGORIES.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <p className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-xs leading-relaxed text-white/50">Recording this paid bill also creates an expense and deducts it from the selected account.</p>
            </>}
            {itemType === "SUBSCRIPTION" && <Field label="Frequency">
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#232a38] border-white/10">{FREQUENCIES.map((value) => <SelectItem key={value} value={value}>{value[0] + value.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
              </Select>
            </Field>}
            <Button onClick={handleCreate} disabled={loading || (itemType === "BILL" && accounts.length === 0)} className="w-full h-12 font-black uppercase tracking-widest">{loading ? "Saving…" : itemType === "BILL" ? "Record Paid Bill" : "Add Subscription"}</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {empty && <EmptyState />}
          {visibleBills.map((bill) => (
            <PaymentCard key={`bill-${bill.id}`} kind="Bill" icon={<ReceiptText size={24} />} title={bill.name} date={bill.paidAt || bill.dueDate} dateLabel="Paid on" details={[bill.account?.name, categoryName(bill.category)].filter(Boolean).join(" • ")} amount={bill.amount} badge="PAID">
              <Button variant="ghost" size="icon" onClick={() => removeBill(bill.id)} className="text-red-500 hover:bg-red-500/10"><Trash2 size={20} /></Button>
            </PaymentCard>
          ))}
          {visibleSubscriptions.map((sub) => (
            <PaymentCard key={`subscription-${sub.id}`} kind="Subscription" icon={<Repeat2 size={24} />} title={sub.name} date={sub.nextBilling} dateLabel="Next payment" frequency={sub.frequency} amount={sub.amount} badge="AUTO-RENEW" countdown={countdown(sub.nextBilling)} overdue={now && new Date(sub.nextBilling).getTime() <= now}>
              <Button variant="ghost" size="icon" onClick={() => removeSubscription(sub.id)} className="text-red-500 hover:bg-red-500/10"><Trash2 size={20} /></Button>
            </PaymentCard>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1.5"><label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">{label}</label>{children}</div>;
}

function categoryName(id) {
  return EXPENSE_CATEGORIES.find((category) => category.id === id)?.name;
}

function PaymentCard({ kind, icon, title, date, dateLabel, frequency, details, amount, badge, countdown: timer, overdue, children }) {
  return (
    <Card className="glass-card hover:bg-white/[0.03]">
      <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">{icon}</div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-white uppercase tracking-wider truncate">{title}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${kind === "Bill" ? "border-gold-400/30 bg-gold-400/10 text-gold-300" : "border-sky-400/30 bg-sky-400/10 text-sky-300"}`}>{kind}</span>
            </div>
            <p className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider"><CalendarDays size={12} /> {dateLabel}: <span className="text-white/70">{format(new Date(date), "dd MMM yyyy")}</span>{frequency ? ` • ${frequency}` : ""}</p>
            {details && <p className="text-[10px] text-slate-400 uppercase tracking-wider">{details}</p>}
            {timer && <p className={`flex items-center gap-1.5 text-xs font-bold ${overdue ? "text-rose-400" : "text-gold-300"}`}><Clock3 size={13} /> {timer}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right"><p className="text-xl font-black text-white">₹{Number(amount).toLocaleString("en-IN")}</p><span className="text-[9px] text-primary uppercase tracking-wider">{badge}</span></div>
          <div className="flex">{children}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return <div className="flex flex-col items-center justify-center p-16 glass-card border-dashed gap-3"><AlertCircle className="h-8 w-8 text-primary/40" /><p className="text-xs text-slate-500 uppercase tracking-widest text-center">Nothing added in this section yet.</p></div>;
}
