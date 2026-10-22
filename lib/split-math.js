// Pure money helpers for expense splitting. All internal math is in paise (integers) to avoid
// floating-point drift; inputs/outputs are rupees.

const toPaise = (rupees) => Math.round((Number(rupees) || 0) * 100);
const toRupees = (paise) => paise / 100;

// Split `total` into parts proportional to `weights`; parts always add up exactly to the total
export function splitByWeights(total, weights) {
  const paise = toPaise(total);
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const raw = weights.map((w) => (paise * w) / sum);
  const floored = raw.map(Math.floor);
  let remainder = paise - floored.reduce((a, b) => a + b, 0);
  // Leftover paise go to the largest fractional parts
  raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => { if (remainder > 0) { floored[i] += 1; remainder -= 1; } });
  return floored.map(toRupees);
}

// Net balance per member: positive = is owed money, negative = owes money.
// expenses: [{ amount, paidById, shares: [{ memberId, amount }] }]
// settlements: [{ amount, fromId, toId }]  (from paid to back)
export function computeBalances(members, expenses, settlements) {
  const net = Object.fromEntries(members.map((m) => [m.id, 0]));
  for (const e of expenses) {
    if (e.paidById in net) net[e.paidById] += toPaise(e.amount);
    for (const s of e.shares || []) if (s.memberId in net) net[s.memberId] -= toPaise(s.amount);
  }
  for (const s of settlements) {
    if (s.fromId in net) net[s.fromId] += toPaise(s.amount);
    if (s.toId in net) net[s.toId] -= toPaise(s.amount);
  }
  return Object.fromEntries(Object.entries(net).map(([id, p]) => [id, toRupees(p)]));
}

// Fewest payments that settle everyone: repeatedly match the biggest debtor with the biggest creditor.
// Returns [{ fromId, toId, amount }]
export function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];
  for (const [id, rupees] of Object.entries(balances)) {
    const p = toPaise(rupees);
    if (p > 0) creditors.push({ id, p });
    else if (p < 0) debtors.push({ id, p: -p });
  }
  creditors.sort((a, b) => b.p - a.p);
  debtors.sort((a, b) => b.p - a.p);

  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].p, creditors[j].p);
    transfers.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: toRupees(pay) });
    debtors[i].p -= pay;
    creditors[j].p -= pay;
    if (debtors[i].p === 0) i++;
    if (creditors[j].p === 0) j++;
  }
  return transfers;
}
