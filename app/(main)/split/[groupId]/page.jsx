"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Trash2, UserPlus, X, Receipt, HandCoins } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getGroup, addExpense, deleteExpense, recordSettlement, deleteSettlement, addMember, removeMember, deleteGroup,
} from "@/actions/split-groups";
import ExpenseForm from "../_components/expense-form";
import { inr, balanceText, balanceTone } from "../_components/format";

const Panel = ({ title, children, className = "" }) => (
  <section className={`rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6 ${className}`}>
    {title && <h2 className="text-white font-semibold mb-4">{title}</h2>}
    {children}
  </section>
);

export default function GroupPage() {
  const { groupId } = useParams();
  const router = useRouter();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);
  const [newMember, setNewMember] = useState("");

  useEffect(() => {
    getGroup(groupId).then((r) => (r.success ? setGroup(r.data) : setError(r.error)));
  }, [groupId]);

  // Every mutating action returns the refreshed group
  const apply = async (promise, successMsg) => {
    const r = await promise;
    if (!r.success) {
      toast.error(r.error || "Something went wrong");
      return false;
    }
    setGroup(r.data);
    if (successMsg) toast.success(successMsg);
    return true;
  };

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 mt-16 text-center text-white/60">
        <p>{error}</p>
        <Link href="/split" className="text-gold-300 underline mt-4 inline-block">Back to groups</Link>
      </div>
    );
  }
  if (!group) return <div className="max-w-5xl mx-auto px-4 mt-16 text-white/40">Loading group…</div>;

  const name = Object.fromEntries(group.members.map((m) => [m.id, m.name]));
  const self = group.members.find((m) => m.isSelf);
  const yours = group.yourBalance;

  // Expenses and repayments together, newest first
  const activity = [
    ...group.expenses.map((e) => ({ ...e, kind: "expense" })),
    ...group.settlements.map((s) => ({ ...s, kind: "settlement" })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const handleDeleteGroup = async () => {
    if (!confirm(`Delete "${group.name}" and all its expenses? This can't be undone.`)) return;
    const r = await deleteGroup(group.id);
    if (r.success) {
      toast.success("Group deleted");
      router.push("/split");
    } else toast.error(r.error);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 mt-16 pb-20 space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/split" className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white mb-3">
            <ArrowLeft size={14} /> All groups
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">{group.name}</h1>
          <p className="text-white/45 text-sm mt-1">{group.members.length} people · {inr(group.totalSpent)} spent in total</p>
        </div>
        <Button variant="ghost" onClick={handleDeleteGroup} className="text-white/40 hover:text-red-400 hover:bg-red-500/10">
          <Trash2 size={16} className="mr-1.5" /> Delete group
        </Button>
      </div>

      {/* Your position */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${yours > 0.004 ? "border-green-500/20 bg-green-500/[0.06]" : yours < -0.004 ? "border-orange-400/20 bg-orange-400/[0.06]" : "border-white/[0.07] bg-white/[0.025]"}`}>
        <p className="text-white/55 text-sm">Your balance</p>
        <p className={`text-3xl font-bold tracking-tight mt-1 ${balanceTone(yours)}`}>
          {yours > 0.004 ? `You are owed ${inr(yours)}` : yours < -0.004 ? `You owe ${inr(-yours)}` : "You're all settled up"}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
        <div className="space-y-6">
          {/* Settle up */}
          <Panel title="Settle up">
            {group.transfers.length === 0 ? (
              <p className="text-sm text-white/45">Nobody owes anything. 🎉</p>
            ) : (
              <ul className="space-y-2.5">
                {group.transfers.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                    <span className="flex-1 flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="text-white font-semibold">{name[t.fromId]}</span>
                      <ArrowRight size={14} className="text-white/40" />
                      <span className="text-white font-semibold">{name[t.toId]}</span>
                      <span className="text-gold-200 font-bold tabular-nums">{inr(t.amount)}</span>
                    </span>
                    <Button size="sm" variant="outline"
                      onClick={() => apply(recordSettlement(group.id, t), `Recorded ${inr(t.amount)} from ${name[t.fromId]}`)}
                      className="h-8 text-xs border-white/15">
                      Mark paid
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* Balances + members */}
          <Panel title="Balances">
            <ul className="divide-y divide-white/[0.05]">
              {group.members.map((m) => (
                <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="flex items-center gap-2 text-white/85">
                    <span className="w-7 h-7 rounded-full bg-white/[0.07] flex items-center justify-center text-[11px] font-bold text-white/70">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    {m.name}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`font-semibold tabular-nums ${balanceTone(group.balances[m.id])}`}>{balanceText(group.balances[m.id])}</span>
                    {!m.isSelf && (
                      <button type="button" aria-label={`Remove ${m.name}`}
                        onClick={() => apply(removeMember(group.id, m.id), `${m.name} removed`)}
                        className="text-white/25 hover:text-red-400 p-1">
                        <X size={14} />
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <form className="flex gap-2 mt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await apply(addMember(group.id, newMember), `${newMember.trim()} added`)) setNewMember("");
              }}>
              <Input placeholder="Add a person" value={newMember} onChange={(e) => setNewMember(e.target.value)}
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl" />
              <Button type="submit" variant="outline" disabled={!newMember.trim()} className="h-10 border-white/15">
                <UserPlus size={16} />
              </Button>
            </form>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Add an expense">
            <ExpenseForm members={group.members} onSubmit={(data) => apply(addExpense(group.id, data), "Expense added")} />
          </Panel>

          {/* Activity */}
          <Panel title="Activity">
            {activity.length === 0 ? (
              <p className="text-sm text-white/45">No expenses yet. Add the first one above.</p>
            ) : (
              <ul className="space-y-2">
                {activity.map((a) => {
                  if (a.kind === "settlement") {
                    return (
                      <li key={a.id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.03]">
                        <span className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                          <HandCoins size={16} className="text-green-400" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white">{name[a.fromId]} paid {name[a.toId]}</p>
                          <p className="text-xs text-white/40">{format(new Date(a.date), "dd MMM yyyy")}</p>
                        </div>
                        <span className="text-sm font-semibold text-green-400 tabular-nums">{inr(a.amount)}</span>
                        <button type="button" aria-label="Delete payment" onClick={() => apply(deleteSettlement(group.id, a.id), "Payment removed")}
                          className="text-white/25 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                      </li>
                    );
                  }
                  const yourShare = a.shares.find((s) => s.memberId === self?.id)?.amount || 0;
                  const youPaid = a.paidById === self?.id;
                  const note = youPaid
                    ? (a.amount - yourShare > 0 ? { text: `you lent ${inr(a.amount - yourShare)}`, cls: "text-green-400" } : null)
                    : (yourShare > 0 ? { text: `you borrowed ${inr(yourShare)}`, cls: "text-orange-300" } : { text: "not involved", cls: "text-white/35" });
                  return (
                    <li key={a.id} className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.03]">
                      <span className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                        <Receipt size={16} className="text-gold-300" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{a.description}</p>
                        <p className="text-xs text-white/40">
                          {name[a.paidById]} paid {inr(a.amount)} · {format(new Date(a.date), "dd MMM")}
                        </p>
                      </div>
                      {note && <span className={`text-xs font-semibold ${note.cls} text-right`}>{note.text}</span>}
                      <button type="button" aria-label="Delete expense" onClick={() => apply(deleteExpense(group.id, a.id), "Expense deleted")}
                        className="text-white/25 hover:text-red-400 p-1"><Trash2 size={14} /></button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
