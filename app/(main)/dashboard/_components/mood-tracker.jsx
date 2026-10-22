"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Smile } from "lucide-react";

const MOODS = [
  { emoji: "😄", label: "Happy",   color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30 hover:bg-yellow-400/20" },
  { emoji: "😐", label: "Neutral", color: "text-slate-400",  bg: "bg-slate-400/10  border-slate-400/30  hover:bg-slate-400/20"  },
  { emoji: "😢", label: "Sad",     color: "text-blue-400",   bg: "bg-blue-400/10   border-blue-400/30   hover:bg-blue-400/20"   },
  { emoji: "🤩", label: "Excited", color: "text-pink-400",   bg: "bg-pink-400/10   border-pink-400/30   hover:bg-pink-400/20"   },
  { emoji: "😤", label: "Stressed",color: "text-red-400",    bg: "bg-red-400/10    border-red-400/30    hover:bg-red-400/20"    },
];

export default function MoodTracker() {
  const [selected, setSelected] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("merabudget_mood");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSelected(parsed.label);
        setSavedAt(parsed.savedAt);
      }
    } catch {}
  }, []);

  const handleSelect = (mood) => {
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSelected(mood.label);
    setSavedAt(now);
    localStorage.setItem("merabudget_mood", JSON.stringify({ label: mood.label, emoji: mood.emoji, savedAt: now }));
  };

  const activeMood = MOODS.find((m) => m.label === selected);

  return (
    <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <Smile size={16} />
          <span>Mood Tracker</span>
        </div>
        {activeMood && (
          <span className="text-xl" title={activeMood.label}>
            {activeMood.emoji}
          </span>
        )}
      </CardHeader>

      <CardContent className="p-6 flex-1 flex flex-col justify-center gap-6">
        {/* Mood grid */}
        <div className="grid grid-cols-2 min-[420px]:grid-cols-3 sm:grid-cols-5 gap-3">
          {MOODS.map((mood) => (
            <button
              key={mood.label}
              onClick={() => handleSelect(mood)}
              title={mood.label}
              className={`
                flex flex-col items-center gap-2 py-3 rounded-2xl border transition-all duration-300
                ${selected === mood.label
                  ? "bg-white/20 border-white/40 scale-110 shadow-lg shadow-white/5"
                  : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:scale-105"}
              `}
            >
              <span className="text-2xl leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{mood.emoji}</span>
              <span className={`text-[8px] font-black uppercase tracking-tighter ${selected === mood.label ? "text-white" : "text-slate-500"}`}>
                {mood.label}
              </span>
            </button>
          ))}
        </div>

        {/* Status line */}
        <div className="text-center">
          {selected ? (
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              CURRENT MOOD: <span className={`text-white ${activeMood?.color}`}>{selected}</span>
              {savedAt && <span className="block opacity-50 mt-1 text-[8px]">LOGGED AT {savedAt}</span>}
            </p>
          ) : (
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] animate-pulse italic">
              How are you feeling today?
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
