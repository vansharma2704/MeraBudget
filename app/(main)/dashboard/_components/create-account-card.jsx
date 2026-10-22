"use client";

import { Plus } from "lucide-react";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Card, CardContent } from "@/components/ui/card";

// The drawer trigger merges itself into this card (asChild). Building the card in a client component
// keeps it a plain element; passed from a server component it can arrive as a lazy element that the
// drawer's Radix Slot (1.2.3) can't clone, which caused a hydration mismatch and a dead tap target.
export default function CreateAccountCard() {
  return (
    <CreateAccountDrawer>
      <Card className="glass-card cursor-pointer group h-full text-center border-primary/20 hover:border-primary/50 transition-all">
        <CardContent className="flex flex-col items-center justify-center p-6 min-h-[160px] h-full">
          <div className="p-4 rounded-full bg-primary/10 mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-500">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs font-black text-white uppercase tracking-widest">Create Account</p>
          <p className="text-[10px] text-slate-500 mt-1 italic">Manage your wallets</p>
        </CardContent>
      </Card>
    </CreateAccountDrawer>
  );
}
