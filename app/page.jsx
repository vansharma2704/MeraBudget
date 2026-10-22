import HeroSection from "../components/hero";
import LandingBento from "../components/landing-bento";
import GrowthSimulatorDemo from "../components/growth-simulator-demo";
import { extrasData, testimonialsData } from "../data/landing";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ── Section header: small gold eyebrow + plain heading ── */
const SectionHeader = ({ eyebrow, title, subtitle }) => (
  <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-14">
    <p className="text-gold-400 text-xs font-bold tracking-[0.2em] uppercase mb-4">{eyebrow}</p>
    <h2 className="font-bold tracking-tight text-white"
      style={{ fontSize: "clamp(1.85rem,3.8vw,3rem)", lineHeight: 1.1 }}>
      {title}
    </h2>
    {subtitle && (
      <p className="text-white/60 text-base sm:text-lg leading-relaxed mt-4">{subtitle}</p>
    )}
  </div>
);

/* ═══════════════════════════════════════ PAGE ═══════════════════════════ */
export default function Home() {
  const [featured, ...others] = testimonialsData;

  return (
    <div className="w-full overflow-x-hidden">

      {/* 1 ── Hero */}
      <HeroSection />

      {/* 2 ── Feature bento */}
      <section id="features" className="pt-16 pb-24 sm:pt-20 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <SectionHeader
            eyebrow="Built for how India spends"
            title="Not just another expense tracker."
            subtitle="AI receipt scanning, bank statement imports, salary planning and habits that stick — the things other budget apps forget."
          />
          <LandingBento />
        </div>
      </section>

      {/* 3 ── Interactive simulator */}
      <section className="pb-24 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <SectionHeader
            eyebrow="Try it yourself"
            title="See what a small habit becomes."
            subtitle="Drag the sliders. This is the same growth simulator you get inside MeraBudget."
          />
          <GrowthSimulatorDemo />
        </div>
      </section>

      {/* 4 ── Also included */}
      <section className="py-16 sm:py-20 bg-white/[0.015] border-y border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <p className="text-center text-white/50 text-sm mb-10">Plus everything you&apos;d expect</p>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
            {extrasData.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center">
                <div className="w-11 h-11 mx-auto rounded-xl bg-white/[0.04] border border-white/[0.07]
                  flex items-center justify-center mb-3">
                  <Icon size={18} className="text-gold-300" />
                </div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-white/50 text-xs mt-1">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 ── Testimonials: one featured + two small */}
      <section className="py-24 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <figure className="text-center max-w-3xl mx-auto">
            <blockquote className="text-white font-medium tracking-tight leading-snug"
              style={{ fontSize: "clamp(1.35rem,2.8vw,2rem)" }}>
              “{featured.quote}”
            </blockquote>
            <figcaption className="flex items-center justify-center gap-3 mt-8">
              <Image src={featured.image} alt={featured.name} width={44} height={44}
                className="rounded-full ring-2 ring-gold-400/40" />
              <div className="text-left">
                <p className="text-white font-semibold text-sm">{featured.name}</p>
                <p className="text-white/55 text-sm">{featured.role}</p>
              </div>
            </figcaption>
          </figure>

          <div className="grid md:grid-cols-2 gap-5 mt-16">
            {others.map((t) => (
              <figure key={t.name}
                className="rounded-2xl bg-white/[0.025] border border-white/[0.07] p-6">
                <blockquote className="text-white/75 leading-relaxed">“{t.quote}”</blockquote>
                <figcaption className="flex items-center gap-3 mt-5">
                  <Image src={t.image} alt={t.name} width={32} height={32} className="rounded-full" />
                  <p className="text-sm">
                    <span className="text-white font-semibold">{t.name}</span>
                    <span className="text-white/55"> · {t.role}</span>
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 6 ── Final CTA */}
      <section className="pb-24 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl text-center px-6 sm:px-14 py-16 sm:py-20
            border border-gold-400/20 bg-gradient-to-b from-gold-500/[0.08] to-white/[0.02]">
            <h2 className="font-bold tracking-tight text-white mb-4"
              style={{ fontSize: "clamp(1.9rem,4.5vw,3rem)", lineHeight: 1.1 }}>
              Your first ₹1 lakh saved<br className="hidden sm:block" /> starts with one tap.
            </h2>
            <p className="text-white/60 text-base sm:text-lg max-w-md mx-auto mb-8">
              Free forever. No credit card. Set up in minutes.
            </p>
            <Link href="/dashboard"
              className="group inline-flex items-center gap-2.5 px-9 py-3.5 rounded-full
                font-bold text-[15px] text-[#1a1f2b] bg-gold-400 hover:bg-gold-300
                shadow-[0_10px_30px_rgba(233,196,106,0.25)] transition-colors">
              Get started free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
