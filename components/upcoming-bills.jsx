"use client";

import { useEffect, useState } from "react";
import { getSubscriptions } from "@/actions/subscriptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock } from "lucide-react";
import { format } from "date-fns";

export default function UpcomingBills() {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const subscriptionResult = await getSubscriptions();
      const payments = (subscriptionResult.success
        ? subscriptionResult.data.map((subscription) => ({ ...subscription, paymentDate: subscription.nextBilling, kind: "Subscription" }))
        : []).sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));
      setBills(payments.slice(0, 3));
    }
    fetchData();
  }, []);

  return (
    <Card className="glass-card shadow-gold-500/10 h-full flex flex-col">
      <CardHeader className="h-16 flex items-center justify-between px-6 border-b border-white/5 uppercase tracking-widest text-xs font-bold space-y-0">
        <div className="flex items-center gap-2 text-primary">
          <CalendarClock size={16} />
          <span>Upcoming Payments</span>
        </div>
      </CardHeader>
      <CardContent className="p-6 flex-1">
        {bills.length === 0 ? (
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">No upcoming payments found</p>
        ) : (
          <div className="space-y-4">
            {bills.map((bill) => (
              <div key={bill.id} className="flex justify-between items-center transition-all hover:translate-x-1 group">
                <div className="space-y-1">
                  <div className="font-bold text-white text-sm group-hover:text-primary">{bill.name}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{format(new Date(bill.paymentDate), "MMM dd")} • {bill.kind}</div>
                </div>
                <div className="text-white font-black text-sm glow-text">₹{Number(bill.amount).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
