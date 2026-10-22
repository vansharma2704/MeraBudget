"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Flame, ShieldCheck, Zap, Award } from "lucide-react";
import { getUserGamificationData, checkStreaksAndAchievements } from "@/actions/gamification";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";

const iconMap = {
  ShieldCheck: <ShieldCheck className="h-6 w-6 text-teal-400 group-hover:drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]" />,
  Trophy: <Trophy className="h-6 w-6 text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />,
  Zap: <Zap className="h-6 w-6 text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />,
  Award: <Award className="h-6 w-6 text-primary group-hover:drop-shadow-[0_0_8px_rgba(212,168,67,0.5)]" />,
};

export default function Achievements() {
  const [data, setData] = useState({ streak: { currentStreak: 0 }, achievements: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const checkResult = await checkStreaksAndAchievements();
      if (checkResult.newAchievements?.length > 0) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#d4a843", "#2DD4BF", "#F43F5E"],
        });
      }

      const gamificationData = await getUserGamificationData();
      // On failure the action returns { error } only; keep the empty defaults instead of crashing
      if (!gamificationData?.error) setData(gamificationData);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak Card */}
        <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="h-32 w-32 text-orange-500" />
          </div>
          <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
            <div className="flex items-center gap-2 text-primary">
              <Flame size={16} />
              <span>Login Streak</span>
            </div>
            {data.streak.currentStreak > 0 && (
              <motion.span
                animate={{ scale: [1, 1.4, 1], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500/50" />
              </motion.span>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-white tracking-tighter leading-none">{data.streak.currentStreak} <span className="text-sm font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Days</span></div>
            <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-widest border-t border-white/5 pt-3">
              LONGEST STREAK: {data.streak.longestStreak} DAYS
            </p>
          </CardContent>
        </Card>

        {/* Level Card */}
        <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative group">
          <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
            <div className="flex items-center gap-2 text-primary">
              <Award size={16} />
              <span>User Level</span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-4xl font-black text-white tracking-tighter leading-none">
              {data.achievements.length < 2 ? "BEGINNER" : data.achievements.length < 5 ? "INTERMEDIATE" : "EXPERT"}
            </div>
            <p className="text-[10px] font-bold text-slate-500 mt-3 uppercase tracking-widest border-t border-white/5 pt-3">
              {data.achievements.length} ACHIEVEMENTS UNLOCKED
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Badges Section */}
      <Card className="h-full flex flex-col bg-[#232a38] border border-white/5 rounded-xl overflow-hidden relative">
        <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
          <div className="flex items-center gap-2 text-primary">
            <Trophy size={16} />
            <span>Achievements</span>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-8">
          <div className="flex flex-wrap gap-6 justify-center items-center">
            {data.achievements.length === 0 ? (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-8">Complete transactions to unlock achievements.</p>
            ) : (
              data.achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.05, y: -8 }}
                  className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/5 border border-white/10 w-32 text-center group transition-all hover:bg-white/[0.08]"
                >
                  <div className="p-3 rounded-2xl bg-[#141924]/40 border border-white/5 group-hover:border-primary/50 transition-colors">
                    {iconMap[achievement.icon] || <Trophy className="h-6 w-6 text-primary" />}
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-tighter line-clamp-2 leading-tight group-hover:text-primary transition-colors">{achievement.name}</span>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
