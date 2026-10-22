import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk" });

export const metadata = {
  title: "MeraBudget — AI-Powered Personal Finance",
  description: "Track expenses, plan budgets, split bills, and grow savings with AI-powered insights. The modern finance app built for India.",
  keywords: "personal finance, budget tracker, expense manager, India, AI finance, MeraBudget",
  openGraph: {
    title: "MeraBudget — AI-Powered Personal Finance",
    description: "The intelligent finance platform for modern Indians. Track, budget, and grow your wealth.",
    type: "website",
  },
  // The site is already dark; stop the Dark Reader extension from rewriting
  // inline styles, which causes hydration mismatches.
  other: {
    "darkreader-lock": "true",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className={`${spaceGrotesk.className} bg-[#1a1f2b] font-space-grotesk antialiased overflow-x-hidden`}><ClerkProvider>
          {/* Soft slate ambient glow */}
          <div
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 0% 0%, rgba(233, 196, 106, 0.06) 0%, transparent 60%),
                radial-gradient(ellipse 70% 50% at 100% 100%, rgba(125, 211, 252, 0.05) 0%, transparent 60%),
                linear-gradient(180deg, #1e2433 0%, #1a1f2b 50%, #171c27 100%)
              `
            }}
          />
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            disableTransitionOnChange
          >
            <Navbar />
            <main className="relative z-10 min-h-screen">
              {children}
            </main>
            <Toaster richColors position="top-center" />

            <footer className="border-t border-white/6 mt-24 relative z-10 bg-[#141924]/40 backdrop-blur-3xl">
              <div className="container mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                      <span className="text-xs font-black text-gold-400">M</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm tracking-tight">MeraBudget</p>
                      <p className="text-white/30 text-[10px] font-medium">AI-Powered Finance Platform</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-center text-white/25 text-xs">
                    <span>Built with Next.js · Prisma · Clerk · Supabase</span>
                  </div>
                  <p className="text-white/25 text-xs">© 2025 MeraBudget. All rights reserved.</p>
                </div>
              </div>
            </footer>
          </ThemeProvider>
        </ClerkProvider></body>
    </html>
  );
}
