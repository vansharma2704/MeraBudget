"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Meh, Frown, Sparkles, AlertCircle } from "lucide-react";

const moods = [
  { label: "Excited", emoji: "🤩", icon: <Sparkles className="text-yellow-400" />, key: "excited" },
  { label: "Happy", emoji: "😊", icon: <Smile className="text-green-400" />, key: "happy" },
  { label: "Neutral", emoji: "😐", icon: <Meh className="text-blue-400" />, key: "neutral" },
  { label: "Stressed", emoji: "😰", icon: <AlertCircle className="text-orange-400" />, key: "stressed" },
  { label: "Sad", emoji: "😢", icon: <Frown className="text-red-400" />, key: "sad" },
];

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedMood = localStorage.getItem("userMood");
    if (savedMood) {
      setSelectedMood(savedMood);
    }
    setIsLoaded(true);
  }, []);

  const handleMoodSelect = (moodKey) => {
    setSelectedMood(moodKey);
    localStorage.setItem("userMood", moodKey);
  };

  if (!isLoaded) return null;

  return (
    <Card className="glass-card h-full border-gold-500/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-widest text-gold-300">
          Daily Mood Tracker
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap justify-between items-center gap-2">
          {moods.map((mood) => (
            <motion.button
              key={mood.key}
              whileHover={{ scale: 1.2, y: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleMoodSelect(mood.key)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
                selectedMood === mood.key
                  ? "bg-gold-500/20 border-gold-500/50 shadow-[0_0_20px_rgba(233,196,106,0.3)]"
                  : "bg-white/5 border-transparent hover:bg-white/10"
              } border`}
            >
              <div className="text-2xl mb-1">{mood.emoji}</div>
              <span className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
                {mood.label}
              </span>
              
              {selectedMood === mood.key && (
                <motion.div
                  layoutId="mood-glow"
                  className="absolute inset-0 rounded-2xl border border-gold-400/30 pointer-events-none"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>
        
        <div className="mt-4 pt-3 border-t border-white/5 text-center">
          <p className="text-[11px] text-muted-foreground italic">
            {selectedMood 
              ? `You're feeling ${selectedMood} today. Keep it up!` 
              : "How are your finances making you feel?"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MoodTracker;
