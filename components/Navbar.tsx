"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Home, 
  LayoutDashboard, 
  PenBox, 
  CalendarCheck, 
  Target, 
  Users2, 
  FileBarChart, 
  Search,
  Menu,
  Sparkles,
  Repeat,
} from "lucide-react";
import { Button } from "./ui/button";
import SearchModal from "./search-modal";
import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";

const Navbar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/bills", label: "Bills", icon: CalendarCheck },
    { href: "/goals", label: "Goals", icon: Target },
    { href: "/split", label: "Split", icon: Users2 },
    { href: "/subscriptions", label: "Subscriptions", icon: Repeat },
    { href: "/reports", label: "Reports", icon: FileBarChart },
  ];

  return (
    <header className={`sticky top-0 left-0 right-0 w-full z-40 bg-[#141924]/70 transition-all duration-500 ${
      isScrolled 
        ? "bg-[#141924]/70 backdrop-blur-2xl border-b border-white/8 shadow-[0_1px_0_rgba(233,196,106,0.15)]" 
        : "bg-transparent"
    }`}>
      {/* Top gradient line */}
      {isScrolled && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
      )}

      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <svg viewBox="0 0 40 40" className="w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-105" aria-hidden="true">
            <rect width="40" height="40" rx="11" fill="rgba(233,196,106,0.12)" stroke="rgba(233,196,106,0.35)" />
            <path d="M10 27L17 19L22 24L30 13" fill="none" stroke="#e9c46a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="30" cy="13" r="2.5" fill="#f4dfa3" />
          </svg>
          <span className="text-lg font-bold tracking-tight text-white">
            Mera<span className="text-gold-300">Budget</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden xl:flex items-center justify-center gap-1">
          <Show when="signed-in">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                className="nav-link flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <link.icon size={14} className="opacity-70" />
                <span>{link.label}</span>
              </Link>
            ))}
          </Show>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Show when="signed-in">
            {/* Search Button */}
            <button 
               onClick={() => setIsSearchOpen(true)}
               className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/8 text-white/40 hover:text-white/70 hover:bg-white/8 hover:border-white/15 transition-all duration-200 text-xs font-medium"
               title="Search (Ctrl+K)"
            >
              <Search size={13} />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono">⌘K</kbd>
            </button>
          </Show>
          
          <Show when="signed-in">
            <Link href={"/transaction/create"} className="hidden sm:block">
              <Button 
                variant="default" 
                size="sm" 
                className="btn-premium text-white font-semibold px-4 py-2 text-sm shadow-lg shadow-gold-500/20"
              >
                <PenBox size={14} className="mr-1.5" />
                <span>Add</span>
              </Button>
            </Link>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 border-2 border-gold-500/30 hover:border-gold-500/70 transition-all rounded-full ring-2 ring-transparent hover:ring-gold-500/20",
                },
              }}
            />
          </Show>

          <Show when="signed-out">
            <SignInButton forceRedirectUrl="/dashboard">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden min-[400px]:inline-flex border-white/15 text-white/80 hover:text-white hover:bg-white/8 hover:border-gold-500/40 rounded-xl text-sm font-semibold backdrop-blur-md transition-all duration-200"
              >
                Sign In
              </Button>
            </SignInButton>
            <Link href="/dashboard">
              <Button 
                variant="default"
                size="sm" 
                className="btn-premium text-white font-semibold px-4 shadow-lg shadow-gold-500/20"
              >
                Get Started
              </Button>
            </Link>
          </Show>

          {/* Mobile Menu Toggle */}
          <Show when="signed-in">
            <Drawer direction="right" open={menuOpen} onOpenChange={setMenuOpen}>
              <DrawerTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="xl:hidden text-white/60 hover:text-white hover:bg-white/8 rounded-xl w-9 h-9"
                >
                  <Menu size={18} />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="bg-[#1a1f2b]/97 border-l border-gold-500/15 backdrop-blur-3xl">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent" />
                
                <DrawerHeader className="border-b border-white/6 pb-5 pt-6">
                  <DrawerTitle className="text-left">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                        <Sparkles size={12} className="text-gold-400" />
                      </div>
                      <span className="text-gradient font-bold text-lg">Navigation</span>
                    </div>
                  </DrawerTitle>
                </DrawerHeader>

                <div className="flex flex-col gap-1 p-4">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setIsSearchOpen(true); }}
                    className="sm:hidden flex items-center gap-3 p-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                      <Search size={15} className="text-white/50" />
                    </div>
                    <span className="text-base font-medium">Search</span>
                  </button>
                  {navLinks.map((link, i) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 p-3.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all group"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-gold-500/15 border border-white/5 group-hover:border-gold-500/30 flex items-center justify-center transition-all">
                        <link.icon size={15} className="text-white/50 group-hover:text-gold-400 transition-colors" />
                      </div>
                      <span className="text-base font-medium">{link.label}</span>
                    </Link>
                  ))}
                  
                  <div className="mt-3 pt-3 border-t border-white/6 sm:hidden">
                    <Link href={"/transaction/create"} onClick={() => setMenuOpen(false)}>
                      <Button 
                        variant="default" 
                        size="lg" 
                        className="w-full btn-premium py-3 text-base font-semibold"
                      >
                        <PenBox size={16} className="mr-2" />
                        Add Transaction
                      </Button>
                    </Link>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </Show>
        </div>
      </nav>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
};

export default Navbar;
