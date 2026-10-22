"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle, IndianRupee, Plus } from "lucide-react";
import { splitByWeights } from "@/lib/split-math";
import { inr } from "./format";

const MODES = [
  { id: "equal", label: "Equally" },
  { id: "amount", label: "By amount" },
  { id: "percent", label: "By %" },
  { id: "shares", label: "By shares" },
];

const label = "text-[11px] font-semibold text-white/50 uppercase tracking-wider";

// Starting value for each person when switching mode
const defaultValue = (mode, amount, count) => {
  if (mode === "percent") return +(100 / count).toFixed(2);
  if (mode === "shares") return 1;
  if (mode === "amount") return amount ? +(amount / count).toFixed(2) : "";
  return "";
};

export default function ExpenseForm({ members, onSubmit }) {
  const self = members.find((m) => m.isSelf) || members[0];
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(self?.id);
  const [mode, setMode] = useState("equal");
  // Per member: included (equal mode) and value (other modes)
  const [rows, setRows] = useState(() => Object.fromEntries(members.map((m) => [m.id, { included: true, value: "" }])));
  const [saving, setSaving] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const row = (id) => rows[id] || { included: true, value: "" };

  const changeMode = (next) => {
    setMode(next);
    setRows(Object.fromEntries(members.map((m) => [m.id, { ...row(m.id), value: defaultValue(next, amountNum, members.length) }])));
  };

  const setRow = (id, patch) => setRows((prev) => ({ ...prev, [id]: { ...row(id), ...patch } }));

  // Live shares + whether they add up
  const { shares, status } = useMemo(() => {
    const ids = members.map((m) => m.id);
    const values = ids.map((id) => Math.max(0, parseFloat(row(id).value) || 0));
    const sum = values.reduce((a, b) => a + b, 0);
    if (!amountNum) return { shares: ids.map(() => 0), status: { ok: false, text: "Enter the amount" } };

    if (mode === "equal") {
      const weights = ids.map((id) => (row(id).included ? 1 : 0));
      const count = weights.filter(Boolean).length;
      return {
        shares: splitByWeights(amountNum, weights),
        status: count ? { ok: true, text: `Split equally between ${count} ${count === 1 ? "person" : "people"}` } : { ok: false, text: "Include at least one person" },
      };
    }
    if (mode === "amount") {
      const diff = +(amountNum - sum).toFixed(2);
      return {
        shares: values,
        status: diff === 0 ? { ok: true, text: "Amounts add up" } : { ok: false, text: diff > 0 ? `${inr(diff)} left to assign` : `${inr(-diff)} over the amount` },
      };
    }
    if (mode === "percent") {
      const diff = +(100 - sum).toFixed(2);
      return {
        shares: splitByWeights(amountNum, values),
        status: diff === 0 ? { ok: true, text: "Percentages add up to 100%" } : { ok: false, text: `Percentages add up to ${+sum.toFixed(2)}% (need 100%)` },
      };
    }
    return {
      shares: splitByWeights(amountNum, values),
      status: sum > 0 ? { ok: true, text: `${sum} share${sum === 1 ? "" : "s"} · ${inr(amountNum / sum)} each` } : { ok: false, text: "Give at least one person a share" },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, mode, amountNum, members]);

  const canSave = status.ok && description.trim() && paidById;
  const suffix = { amount: "₹", percent: "%", shares: "×" }[mode];

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const ok = await onSubmit({
      description,
      amount: amountNum,
      paidById,
      splitMode: mode,
      shares: members.map((m, i) => ({ memberId: m.id, amount: shares[i] })).filter((s) => s.amount > 0),
    });
    setSaving(false);
    if (ok) {
      setDescription("");
      setAmount("");
      setMode("equal");
      setRows(Object.fromEntries(members.map((m) => [m.id, { included: true, value: "" }])));
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid sm:grid-cols-[1fr_10rem] gap-3">
        <div className="space-y-1.5">
          <label className={label} htmlFor="exp-desc">Description</label>
          <Input id="exp-desc" placeholder="e.g. Hotel, Dinner, Cab" value={description} onChange={(e) => setDescription(e.target.value)}
            className="bg-white/5 border-white/10 text-white h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <label className={label} htmlFor="exp-amt">Amount</label>
          <div className="relative">
            <Input id="exp-amt" type="number" min="0" step="0.01" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="bg-white/5 border-white/10 text-white h-11 rounded-xl pl-8" />
            <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-gold-300/60" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className={label}>Paid by</p>
        <div role="radiogroup" aria-label="Paid by" className="flex flex-wrap gap-2">
          {members.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={paidById === m.id} onClick={() => setPaidById(m.id)}
              className={`h-9 px-4 text-sm font-semibold border transition-colors ${paidById === m.id ? "bg-gold-400 text-[#1a1f2b] border-gold-400" : "border-white/10 text-white/60 hover:text-white hover:bg-white/[0.05]"}`}>
              {m.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className={label}>Split</p>
        <div role="radiogroup" aria-label="Split mode" className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
          {MODES.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => changeMode(m.id)}
              className={`h-9 text-sm font-semibold transition-colors ${mode === m.id ? "bg-gold-400 text-[#1a1f2b]" : "text-white/60 hover:text-white hover:bg-white/[0.05]"}`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {members.map((m, i) => (
          <div key={m.id} className="flex items-center gap-3">
            {mode === "equal" ? (
              <label className="flex-1 flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={row(m.id).included} onChange={(e) => setRow(m.id, { included: e.target.checked })}
                  className="w-4 h-4 accent-[#e9c46a]" />
                <span className={`text-sm ${row(m.id).included ? "text-white" : "text-white/35 line-through"}`}>{m.name}</span>
              </label>
            ) : (
              <>
                <span className="flex-1 text-sm text-white">{m.name}</span>
                <div className="relative w-24">
                  <Input type="number" min="0" step={mode === "shares" ? "1" : "0.01"} value={row(m.id).value}
                    aria-label={`${m.name} ${mode}`}
                    onChange={(e) => setRow(m.id, { value: e.target.value })}
                    className="bg-white/5 border-white/10 text-white h-9 rounded-lg pr-7" />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-white/40">{suffix}</span>
                </div>
              </>
            )}
            <span className="w-28 text-right text-sm font-semibold text-white tabular-nums">{inr(shares[i])}</span>
          </div>
        ))}
      </div>

      <div className={`flex items-center gap-2 rounded-xl px-4 py-2.5 border text-sm
        ${status.ok ? "bg-green-500/[0.06] border-green-500/20 text-green-300" : "bg-orange-400/[0.06] border-orange-400/20 text-orange-200"}`}>
        {status.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        {status.text}
      </div>

      <Button type="submit" disabled={!canSave || saving}
        className="w-full h-11 bg-gold-400 hover:bg-gold-300 text-[#1a1f2b] font-bold rounded-xl disabled:opacity-40">
        <Plus size={16} className="mr-1.5" /> {saving ? "Adding..." : "Add expense"}
      </Button>
    </form>
  );
}
