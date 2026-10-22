// Pulls the useful bits out of OCR text from a shop receipt / bill (Indian formats).
import { categorize } from "@/lib/statement/categorize";

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

// Labels for the final payable amount, strongest first
const TOTAL_LABELS = [
  /grand\s*total/i,
  /net\s*(amount|payable|total)/i,
  /(amount|amt)\s*(payable|due|paid)/i,
  /total\s*(amount|amt|payable|due|value|rs|inr|₹)/i,
  /bill\s*(amount|amt|total)/i,
  /\btotal\b/i,
];
// Lines that mention "total" but aren't the final amount
const NOT_TOTAL = /\b(sub\s*-?\s*total|total\s*(qty|quantity|items?|savings?|discount|tax|gst|cgst|sgst)|savings|you saved|round\s*off|tendered|change|cash\s*received|mrp)\b/i;
const NOT_MERCHANT = /\b(tax\s*invoice|invoice|bill\s*(no|number)?|receipt|gst(in)?|cin|fssai|phone|ph|mob(ile)?|tel|email|date|time|cashier|table|order|token|kot|address|road|rd|street|nagar|sector|pin|welcome|thank|total|amount|qty)\b|www\.|\.com/i;

// 1,23,456.78 / 1234.50 / 1234 / ₹ 450 / Rs.450.00
const AMOUNT = /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+\.\d{1,2}|\d{2,7})(?![\d.,]*\s*%)/gi;

const toNumber = (s) => parseFloat(String(s).replace(/,/g, ""));

function amountsIn(line) {
  return [...line.matchAll(AMOUNT)]
    .map((m) => toNumber(m[1]))
    .filter((n) => n > 0 && n < 10_000_000);
}

function findTotal(lines) {
  for (const label of TOTAL_LABELS) {
    // Last matching line wins (totals are at the bottom); amount may sit on the next line
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!label.test(lines[i]) || NOT_TOTAL.test(lines[i])) continue;
      const here = amountsIn(lines[i].replace(label, " "));
      if (here.length) return here[here.length - 1];
      const next = lines[i + 1] ? amountsIn(lines[i + 1]) : [];
      if (next.length) return next[next.length - 1];
    }
  }
  // No label found: the largest decimal amount on the receipt is usually the total
  const decimals = lines.flatMap((l) => [...l.matchAll(/\d[\d,]*\.\d{2}\b/g)].map((m) => toNumber(m[0])));
  return decimals.length ? Math.max(...decimals) : null;
}

function findDate(text) {
  const now = new Date();
  const candidates = [];
  const push = (y, m, d) => {
    if (y < 100) y += 2000;
    if (m < 0 || m > 11 || d < 1 || d > 31) return;
    const date = new Date(Date.UTC(y, m, d));
    // Receipts are from the past (allow a day of clock/time-zone slack)
    if (date.getTime() <= now.getTime() + 86400000 && y >= 2000) candidates.push(date);
  };
  for (const m of text.matchAll(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/g)) push(+m[3], +m[2] - 1, +m[1]);
  for (const m of text.matchAll(/\b(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/g)) push(+m[1], +m[2] - 1, +m[3]);
  for (const m of text.matchAll(/\b(\d{1,2})[\s\-\/]?([A-Za-z]{3,4})[a-z]*[\s\-\/,']+(\d{2,4})\b/g)) {
    const mo = MONTHS[m[2].toLowerCase()];
    if (mo !== undefined) push(+m[3], mo, +m[1]);
  }
  return candidates[0] || null;
}

function findMerchant(lines) {
  for (const line of lines.slice(0, 8)) {
    const clean = line.replace(/[^A-Za-z0-9&'.\- ]/g, " ").replace(/\s+/g, " ").trim();
    const letters = clean.replace(/[^A-Za-z]/g, "");
    if (letters.length < 3 || NOT_MERCHANT.test(clean) || /^\d/.test(clean)) continue;
    if (letters.length / clean.replace(/\s/g, "").length < 0.6) continue; // mostly digits/noise
    return clean
      .toLowerCase()
      .replace(/\b(pvt|private|ltd|limited|llp)\b\.?/g, "")
      .replace(/\b[a-z]/g, (c) => c.toUpperCase())
      .trim()
      .slice(0, 60);
  }
  return null;
}

/**
 * @param {string} text - raw OCR output
 * @param {Record<string, "INCOME"|"EXPENSE">} categoryTypes
 * @returns {{ amount: number|null, date: string|null, merchant: string|null, category: string, keywords: string[] }}
 */
export function parseReceiptText(text, categoryTypes) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const amount = findTotal(lines);
  const date = findDate(lines.join("\n"));
  const merchant = findMerchant(lines);
  // Merchant name decides first (e.g. "DMart"); otherwise words anywhere on the bill ("petrol", "pharmacy")
  const byMerchant = categorize({ description: merchant || "", type: "EXPENSE" }, categoryTypes);
  const byText = categorize({ description: lines.join(" "), type: "EXPENSE" }, categoryTypes);
  const chosen = byMerchant.category !== "other-expense" ? byMerchant : byText;
  const METHODS = ["upi", "card", "neft", "imps", "rtgs", "cheque", "auto-debit", "bill-pay", "atm", "cash"];
  const keywords = [...new Set([
    merchant ? merchant.toLowerCase().split(" ").slice(0, 3).join(" ") : null,
    // dictionary hits only (short), not free-text counterparty guesses
    ...(chosen.category !== "other-expense" ? chosen.keywords : []),
  ].filter((k) => k && !METHODS.includes(k) && k.split(" ").length <= 3))].slice(0, 3);
  const category = chosen.category;

  return {
    amount: amount ? Math.round(amount * 100) / 100 : null,
    date: date ? date.toISOString() : null,
    merchant,
    category,
    keywords,
  };
}
