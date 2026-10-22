"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  Search, 
  X, 
  CreditCard, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  History,
  CalendarClock,
  Trophy,
  RefreshCw,
  Tags,
  FileBarChart,
  ChevronRight,
  Monitor
} from "lucide-react";
import { searchFinancialData } from "@/actions/search";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const inputRef = useRef(null);

  const addToRecent = useCallback((search) => {
    setRecentSearches((current) => {
      const updated = [search, ...current.filter((item) => item !== search)].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSelect = useCallback((url, title) => {
    addToRecent(title);
    onClose();
    router.push(url);
  }, [addToRecent, onClose, router]);

  const icons = {
    CreditCard: <CreditCard size={20} />,
    TrendingUp: <TrendingUp size={20} />,
    TrendingDown: <TrendingDown size={20} />,
    CalendarClock: <CalendarClock size={20} />,
    Trophy: <Trophy size={20} />,
    RefreshCw: <RefreshCw size={20} />,
    Tags: <Tags size={20} />,
    FileBarChart: <FileBarChart size={20} />,
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      const saved = localStorage.getItem("recentSearches");
      if (saved) setRecentSearches(JSON.parse(saved));
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSearch = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }
      setLoading(true);
      const res = await searchFinancialData(debouncedQuery);
      if (res.success) {
        setResults(res.results);
        setSelectedIndex(0);
      }
      setLoading(false);
    };
    handleSearch();
  }, [debouncedQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter" && results.length > 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex].url, results[selectedIndex].title);
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelect, isOpen, onClose, results, selectedIndex]);

  // Helper to highlight matching text
  const HighlightText = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-primary/30 text-white rounded-px px-0.5">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Grouping logic
  const groupedResults = results.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#141924]/80 backdrop-blur-md animate-in fade-in duration-500"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl glass-card rounded-2xl sm:rounded-[3rem] border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500 overflow-hidden">
        {/* Search Input Area */}
        <div className="p-3 sm:p-6 border-b border-white/5 flex items-center gap-2 sm:gap-4 bg-white/5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/10">
            <Search className="text-primary" size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-base sm:text-2xl font-bold tracking-tight"
            placeholder="Search records, accounts, goals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <kbd className="hidden sm:inline-flex h-7 select-none items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-black text-slate-500">
              ESC
            </kbd>
            <button 
              onClick={onClose}
              className="p-2 sm:p-3 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-h-[65vh] overflow-y-auto p-3 sm:p-6 custom-scrollbar bg-[#1a1f2b]/20">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(212,168,67,0.5)]" />
              </div>
              <p className="text-primary font-black tracking-[0.3em] text-xs uppercase animate-pulse">Searching financial records...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-8 pb-4">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="space-y-3">
                  <div className="px-4 flex items-center justify-between">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">{type}</h3>
                     <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{items.length} Results</span>
                  </div>
                  <div className="grid gap-2">
                    {items.map((item, idx) => {
                      const absoluteIndex = results.indexOf(item);
                      const active = absoluteIndex === selectedIndex;
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelect(item.url, item.title)}
                          onMouseEnter={() => setSelectedIndex(absoluteIndex)}
                          className={`w-full text-left p-4 rounded-[2rem] transition-all flex items-center justify-between group relative overflow-hidden ${
                            active 
                            ? "bg-primary/10 border border-primary/30 translate-x-1 shadow-xl shadow-primary/5" 
                            : "bg-white/[0.02] hover:bg-white/[0.04] border border-transparent"
                          }`}
                        >
                          {active && <div className="absolute left-0 top-0 w-1 h-full bg-primary" />}
                          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
                              active ? "scale-110 rotate-6 bg-primary text-white" : 
                              item.type === 'Accounts' ? 'bg-gold-500/20 text-gold-400' : 
                              item.type === 'Income' ? 'bg-teal-500/20 text-teal-400' : 
                              item.type === 'Bills' ? 'bg-red-500/20 text-red-400' :
                              item.type === 'Goals' ? 'bg-pink-500/20 text-pink-400' :
                              item.type === 'Subscriptions' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-500/20 text-slate-400'
                            }`}>
                              {icons[item.icon] || <Tags size={24} />}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`truncate text-sm sm:text-base font-bold transition-colors ${active ? "text-white" : "text-slate-200"}`}>
                                <HighlightText text={item.title} highlight={query} />
                              </h4>
                              <p className="truncate text-[10px] sm:text-[11px] text-slate-500 font-medium uppercase tracking-wider sm:tracking-widest mt-0.5">
                                <HighlightText text={item.subtitle} highlight={query} />
                              </p>
                            </div>
                          </div>
                          <div className={`transition-all duration-500 ${active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
                             <ChevronRight className="text-primary" size={24} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : query ? (
            <div className="py-24 text-center space-y-6">
              <div className="w-24 h-24 bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-red-500/30 border border-red-500/5">
                <History size={48} />
              </div>
              <div className="space-y-2">
                <p className="text-white font-black uppercase tracking-widest">No matching records found</p>
                <p className="text-sm text-slate-500">Try searching for a different term or date.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-10 py-6">
              {recentSearches.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5 flex items-center gap-2">
                    <History size={14} /> Recent Searches
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(s)}
                        className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-primary/20 border border-white/5 hover:border-primary/30 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-3 group shadow-lg"
                      >
                        {s}
                        <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-5">
                  <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                    <TrendingUp size={14} /> Search Tips
                  </h3>
                  <div className="grid gap-4">
                    <div className="p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 text-[11px] text-slate-500 font-medium leading-relaxed">
                       Search by month (e.g. <span className="text-primary font-black">&quot;APRIL&quot;</span>) to filter by period.
                    </div>
                    <div className="p-4 rounded-[1.5rem] bg-white/[0.02] border border-white/5 text-[11px] text-slate-500 font-medium leading-relaxed">
                       Search amounts (e.g. <span className="text-teal-400 font-black">&quot;5000&quot;</span>) to find exact matches.
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-[10px] font-black text-gold-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <RefreshCw size={14} /> Shortcuts
                  </h3>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 px-5 rounded-[1.2rem] bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Invoke</span>
                      <kbd className="bg-primary/20 border border-primary/20 px-2 py-0.5 rounded-lg text-[10px] font-black text-primary">CTRL K</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 px-5 rounded-[1.2rem] bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Navigate</span>
                      <kbd className="bg-primary/20 border border-primary/20 px-2 py-0.5 rounded-lg text-[10px] font-black text-primary">↑ ↓</kbd>
                    </div>
                    <div className="flex items-center justify-between p-3 px-5 rounded-[1.2rem] bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Select</span>
                      <kbd className="bg-primary/20 border border-primary/20 px-2 py-0.5 rounded-lg text-[10px] font-black text-primary">ENTER</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-3 sm:p-4 bg-primary/10 text-center text-[9px] sm:text-[10px] text-primary font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] border-t border-primary/20">
          ADVANCED SEARCH INTERFACE • MeraBudget V4.0
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
