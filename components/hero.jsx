"use client";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import DashboardPreview from "@/components/dashboard-preview";
import { statsData } from "@/data/landing";
import { ArrowRight, Sparkles, Shield, CheckCircle, Star } from "lucide-react";

const HeroSection = () => {
  const imageRef = useRef(null);

  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;
    const onScroll = () => {
      el.style.transform = `perspective(1000px) rotateY(${Math.min(window.scrollY * 0.01, 3)}deg) translateY(${window.scrollY * 0.08}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative w-full overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-20">

      {/* ── Background ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[700px] h-[600px] bg-gold-500/[0.06] rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-sky-400/[0.04] rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* ── Two-column split ── */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* ── LEFT: Text column ── */}
          {/* CSS-only entrance so content is visible even before JavaScript loads */}
          <div className="flex-1 min-w-0 text-center lg:text-left animate-in fade-in slide-in-from-bottom-6 duration-700">

            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 mb-6
              px-3 py-1.5 rounded-full
              bg-gold-500/10 border border-gold-500/25
              text-gold-300 text-[11px] font-bold tracking-widest uppercase">
              <Sparkles size={10} />
              Made for India · Powered by AI
            </div>

            {/* Headline */}
            <h1 className="font-bold tracking-tight leading-[1.02] mb-6"
              style={{ fontSize: "clamp(2.5rem,5.2vw,4.5rem)" }}>
              <span className="block text-white">Spend smarter.</span>
              <span className="block text-white">Save more.</span>
              <span className="block text-gold-300">Grow wealth.</span>
            </h1>

            {/* Subtext */}
            <p className="text-white/65 leading-relaxed mb-8 mx-auto lg:mx-0"
              style={{ fontSize: "clamp(1rem,1.8vw,1.15rem)", maxWidth: "460px" }}>
              The money app built for India — track every rupee, stick to your budget
              and see exactly how your money can grow.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className="group w-full sm:w-auto inline-flex items-center justify-center gap-2.5
                  px-8 py-3.5 rounded-full font-bold text-[15px] text-[#1a1f2b]
                  bg-gold-400 hover:bg-gold-300
                  shadow-[0_10px_30px_rgba(233,196,106,0.25)]
                  transition-colors duration-300">
                  Start for free
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2
                  px-8 py-3.5 rounded-full font-semibold text-[15px]
                  text-white/80 hover:text-white
                  border border-white/15 hover:border-gold-500/35 hover:bg-white/4
                  transition-all duration-300">
                  See how it works
                </button>
              </Link>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-white/55 text-sm">
              {[
                { icon: CheckCircle, text: "Free forever" },
                { icon: Shield, text: "Bank-grade encryption" },
                { icon: Star, text: "4.9 from 2,400+ reviews" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="inline-flex items-center gap-1.5">
                  <Icon size={14} className="text-gold-400 shrink-0" />
                  {text}
                </span>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Dashboard preview ── */}
          <div className="flex-1 min-w-0 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">

            <div className="relative w-full">
              {/* Glow behind */}
              <div className="absolute -inset-6 rounded-[2rem] opacity-40
                bg-gradient-to-r from-gold-600/15 via-sky-400/10 to-gold-600/15
                blur-[60px]" />

              {/* Gradient border ring */}
              <div className="relative p-px rounded-[1.5rem]"
                style={{
                  background: "linear-gradient(135deg,rgba(233,196,106,0.5),rgba(255,255,255,0.04),rgba(212,168,67,0.4))"
                }}>
                <div
                  ref={imageRef}
                  className="relative bg-[#1a1f2b] rounded-[1.4rem] overflow-hidden p-2
                    shadow-[0_30px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)]
                    transition-transform duration-100"
                >
                  {/* Top specular */}
                  <div className="absolute top-0 left-[12%] right-[12%] h-px z-10
                    bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                  <DashboardPreview />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* ── Stats ── */}
        <dl className="mt-20 pt-10 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-4 gap-y-8">
          {statsData.map(({ value: v, label: l }) => (
            <div key={l} className="text-center lg:text-left">
              <dt className="text-white font-bold text-3xl tracking-tight">{v}</dt>
              <dd className="text-white/50 text-sm mt-1">{l}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default HeroSection;