"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Users2, X, ChevronRight, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getGroups, createGroup } from "@/actions/split-groups";
import { getSplitExpenses, deleteSplitExpense } from "@/actions/split-expense";
import { inr, balanceTone } from "./_components/format";

export default function SplitGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState(null);
  const [legacy, setLegacy] = useState([]);
  const [name, setName] = useState("");
  const [person, setPerson] = useState("");
  const [people, setPeople] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getGroups().then((r) => setGroups(r.success ? r.data : []));
    getSplitExpenses().then((r) => r.success && setLegacy(r.data));
  }, []);

  const addPerson = () => {
    const n = person.trim();
    if (!n) return;
    if (n.toLowerCase() === "you" || people.some((p) => p.toLowerCase() === n.toLowerCase())) {
      toast.error(`${n} is already added`);
      return;
    }
    setPeople([...people, n]);
    setPerson("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    const r = await createGroup({ name, members: people });
    setCreating(false);
    if (!r.success) return toast.error(r.error);
    toast.success("Group created");
    router.push(`/split/${r.data.id}`);
  };

  const owed = (groups || []).reduce((a, g) => a + Math.max(0, g.yourBalance), 0);
  const owe = (groups || []).reduce((a, g) => a + Math.max(0, -g.yourBalance), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-20 space-y-8 page-fade-in">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Split</h1>
        <p className="text-white/50 mt-1">Groups for trips, flatmates and friends — see who owes whom.</p>
      </div>

      {/* Overall position */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.06] p-5">
          <p className="text-white/55 text-sm">You are owed</p>
          <p className="text-3xl font-bold text-green-400 tracking-tight mt-1 tabular-nums">{inr(owed)}</p>
        </div>
        <div className="rounded-2xl border border-orange-400/20 bg-orange-400/[0.06] p-5">
          <p className="text-white/55 text-sm">You owe</p>
          <p className="text-3xl font-bold text-orange-300 tracking-tight mt-1 tabular-nums">{inr(owe)}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-6 items-start">
        {/* Groups */}
        <section className="space-y-3">
          <h2 className="text-white font-semibold">Your groups</h2>
          {groups === null ? (
            <p className="text-white/40 text-sm">Loading…</p>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 rounded-2xl border border-dashed border-white/10 text-white/45">
              <Users2 className="h-8 w-8 mb-3" />
              <p className="text-sm">No groups yet — create one to start splitting.</p>
            </div>
          ) : (
            groups.map((g) => (
              <Link key={g.id} href={`/split/${g.id}`}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:border-gold-400/30 transition-colors sm:flex-nowrap sm:gap-4 sm:p-5">
                <span className="w-11 h-11 rounded-xl bg-gold-500/10 border border-gold-400/20 flex items-center justify-center shrink-0">
                  <Users2 size={18} className="text-gold-300" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{g.name}</p>
                  <p className="text-white/40 text-xs truncate">{g.members.map((m) => m.name).join(", ")}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className={`text-sm font-semibold tabular-nums ${balanceTone(g.yourBalance)}`}>
                    {g.yourBalance > 0.004 ? `you get ${inr(g.yourBalance)}` : g.yourBalance < -0.004 ? `you owe ${inr(-g.yourBalance)}` : "settled up"}
                  </p>
                  <p className="text-white/35 text-xs">{inr(g.totalSpent)} spent</p>
                </div>
                <ChevronRight size={18} className="text-white/30" />
              </Link>
            ))
          )}
        </section>

        {/* Create group */}
        <form onSubmit={handleCreate} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 space-y-4">
          <h2 className="text-white font-semibold">New group</h2>
          <div className="space-y-1.5">
            <label htmlFor="g-name" className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Group name</label>
            <Input id="g-name" placeholder="e.g. Goa Trip, Flat 302" value={name} onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 text-white h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="g-person" className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">People</label>
            <div className="flex gap-2">
              <Input id="g-person" placeholder="Add a name" value={person} onChange={(e) => setPerson(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPerson(); } }}
                className="bg-white/5 border-white/10 text-white h-10 rounded-xl" />
              <Button type="button" variant="outline" onClick={addPerson} disabled={!person.trim()} className="h-10 border-white/15">
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs px-2.5 py-1 rounded-full bg-gold-500/15 text-gold-200">You</span>
              {people.map((p) => (
                <span key={p} className="text-xs pl-2.5 pr-1 py-1 rounded-full bg-white/[0.07] text-white/80 inline-flex items-center gap-1">
                  {p}
                  <button type="button" aria-label={`Remove ${p}`} onClick={() => setPeople(people.filter((x) => x !== p))}
                    className="hover:text-red-400 p-0.5"><X size={12} /></button>
                </span>
              ))}
            </div>
          </div>
          <Button type="submit" disabled={creating || !name.trim() || people.length === 0}
            className="w-full h-11 bg-gold-400 hover:bg-gold-300 text-[#1a1f2b] font-bold rounded-xl disabled:opacity-40">
            {creating ? "Creating…" : "Create group"}
          </Button>
        </form>
      </div>

      {/* One-off splits saved before groups existed */}
      {legacy.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-white/70 font-semibold text-sm">Earlier splits</h2>
          {legacy.map((sp) => (
            <div key={sp.id} className="flex items-center gap-4 rounded-xl border border-white/[0.06] px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{sp.description}</p>
                <p className="text-xs text-white/40">
                  {format(new Date(sp.createdAt), "dd MMM yyyy")} ·{" "}
                  {(Array.isArray(sp.participants) ? sp.participants : []).map((p) => `${p.name} ${inr(p.share)}`).join(" · ")}
                </p>
              </div>
              <span className="text-sm text-white/70 tabular-nums">{inr(sp.totalAmount)}</span>
              <button type="button" aria-label="Delete split"
                onClick={async () => {
                  const r = await deleteSplitExpense(sp.id);
                  if (r.success) setLegacy(legacy.filter((x) => x.id !== sp.id));
                  else toast.error(r.error);
                }}
                className="text-white/25 hover:text-red-400 p-1"><Trash2 size={14} /></button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
