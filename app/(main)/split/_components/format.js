export const inr = (n) =>
  "₹" + (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

// Short label for a balance from the member's side
export const balanceText = (amount) =>
  amount > 0.004 ? `gets back ${inr(amount)}` : amount < -0.004 ? `owes ${inr(-amount)}` : "settled up";

export const balanceTone = (amount) =>
  amount > 0.004 ? "text-green-400" : amount < -0.004 ? "text-orange-300" : "text-white/40";
