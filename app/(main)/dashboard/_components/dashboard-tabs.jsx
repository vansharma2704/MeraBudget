import Link from "next/link";
import { LayoutGrid, Target, LineChart, Wrench } from "lucide-react";

/* URL-driven tab bar (?tab=...) so tabs are linkable and the server renders only the active one. */

export const TABS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "planning", label: "Planning", icon: Target },
  { id: "insights", label: "Insights", icon: LineChart },
  { id: "tools", label: "Tools", icon: Wrench },
];

export default function DashboardTabs({ active }) {
  return (
    <div role="navigation" aria-label="Dashboard sections"
      className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.07] w-full sm:w-fit overflow-x-auto">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <Link key={id} href={id === "overview" ? "/dashboard" : `/dashboard?tab=${id}`} scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors
              ${isActive ? "bg-gold-400 text-[#1a1f2b]" : "text-white/60 hover:text-white hover:bg-white/[0.05]"}`}>
            <Icon size={15} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
