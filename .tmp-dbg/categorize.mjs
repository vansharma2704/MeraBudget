// Rule-based category + keyword tagging for Indian bank statement narrations.
// Category ids match data/categories.js.

// [categoryId, tag, words...] — words are matched case-insensitively as whole words/phrases
const RULES = [
  // Income
  ["salary", "salary", "salary", "sal", "payroll", "wages"],
  ["investments", "investment income", "dividend", "interest", "int pd", "int.pd", "int credit", "redemption", "maturity"],
  ["freelance", "freelance", "upwork", "fiverr", "freelance", "toptal"],
  ["rental", "rent received", "rent received", "rental income"],
  ["other-income", "refund", "refund", "reversal", "reversed", "cashback"],
  // Expenses
  ["food", "food", "swiggy", "zomato", "eatsure", "dominos", "domino", "mcdonald", "mcdonalds", "kfc", "pizza hut", "burger king", "starbucks", "restaurant", "cafe", "dhaba", "haldiram", "chaayos", "subway", "buffet", "barbeque", "bbq", "biryani", "bakery", "sweets", "kitchen", "bistro", "dine", "eatery", "food court"],
  ["groceries", "groceries", "bigbasket", "blinkit", "zepto", "instamart", "dmart", "jiomart", "grofers", "reliance fresh", "more retail", "spencers", "nature basket", "grocery", "supermarket", "kirana"],
  ["shopping", "shopping", "amazon", "flipkart", "myntra", "ajio", "meesho", "nykaa", "tatacliq", "tata cliq", "decathlon", "croma", "reliance digital", "lifestyle", "westside", "zudio", "ikea"],
  ["transportation", "transport", "uber", "ola", "rapido", "fastag", "petrol", "diesel", "fuel", "hpcl", "bpcl", "iocl", "indian oil", "shell", "metro", "parking", "namma yatri"],
  ["travel", "travel", "irctc", "makemytrip", "goibibo", "indigo", "air india", "vistara", "spicejet", "akasa", "cleartrip", "yatra", "oyo", "airbnb", "redbus", "ixigo"],
  ["utilities", "utilities", "electricity", "bescom", "msedcl", "tata power", "adani electricity", "torrent power", "water bill", "mahanagar gas", "indane", "bharat gas", "hp gas", "broadband", "airtel", "jio", "vodafone", "vi", "bsnl", "act fibernet", "recharge", "dth", "tata play"],
  ["entertainment", "entertainment", "netflix", "spotify", "hotstar", "disney", "prime video", "sonyliv", "sony liv", "zee5", "bookmyshow", "pvr", "inox", "youtube", "steam", "playstation", "jiocinema"],
  ["healthcare", "health", "apollo", "pharmeasy", "1mg", "tata 1mg", "netmeds", "medplus", "hospital", "clinic", "pharmacy", "chemist", "diagnostic", "practo", "lab"],
  ["education", "education", "udemy", "coursera", "byjus", "byju", "unacademy", "school", "college", "university", "tuition", "exam fee"],
  ["housing", "rent", "rent", "nobroker", "maintenance", "society", "housing"],
  ["insurance", "insurance", "lic", "insurance", "policybazaar", "hdfc life", "icici pru", "star health", "premium"],
  ["personal", "personal care", "salon", "spa", "urban company", "urbanclap", "gym", "cult fit", "cultfit"],
  ["gifts", "gifts", "donation", "temple", "charity", "gift"],
  ["bills", "bills", "emi", "loan", "credit card", "cc payment", "card payment", "bill payment", "billpay", "charges", "service charge", "annual fee", "penalty", "gst", "sms charges", "late fee"],
];

// Payment rail detection → keyword
const METHODS = [
  ["upi", /\bupi\b/i],
  ["neft", /\bneft\b/i],
  ["imps", /\bimps\b/i],
  ["rtgs", /\brtgs\b/i],
  ["atm", /\b(atm|atw|nwd|cash wdl|cash withdrawal)\b/i],
  ["card", /\b(pos|pos\s*purchase|pospurchase|card|ecom|visa|mastercard|rupay)\b/i],
  ["auto-debit", /\b(nach|ecs|ach|si|mandate|autopay)\b/i],
  ["cheque", /\b(chq|cheque|check|clg|clearing)\b/i],
  ["bill-pay", /\b(bil|billpay|bbps)\b/i],
];

// Matched words that describe the kind of transaction rather than who it was with
const GENERIC = new Set(["salary", "sal", "payroll", "wages", "interest", "int pd", "int.pd", "int credit", "dividend", "emi", "loan",
  "rent", "refund", "reversal", "reversed", "cashback", "charges", "premium", "maintenance", "insurance", "redemption", "maturity"]);
const LABELS = { "int pd": "Interest", "int.pd": "Interest", "int credit": "Interest", sal: "Salary" };

const STOP = new Set([
  "upi", "neft", "imps", "rtgs", "dr", "cr", "p2a", "p2m", "pay", "payment", "to", "by", "from", "transfer", "trf", "ref", "txn",
  "pos", "ecom", "atm", "ach", "nach", "ecs", "the", "and", "for", "ltd", "pvt", "private", "limited", "india", "bank", "na", "inb",
  "mb", "ib", "sent", "using", "collect", "request", "via", "wdl", "atw", "nwd", "cash", "withdrawal", "bil", "onl", "d", "c",
  "int", "pd", "int.pd", "cr", "salary", "sal", "emi", "terminal", "purchase", "pospurchase", "preauthorized",
  "credit", "debit", "check", "chq", "deposit",
]);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const COMPILED = RULES.map(([category, tag, ...words]) => ({
  category,
  tag,
  re: new RegExp(`(?:^|[^a-z0-9])(${words.map(escape).join("|")})(?=$|[^a-z0-9])`, "i"),
}));

// Best-effort counterparty name from narrations like "UPI-SWIGGY-swiggy@icici-..." or "UPI/DR/1234/RAHUL S/HDFC"
function counterparty(text) {
  const parts = text
    .replace(/[a-z0-9._]+@[a-z]+/gi, " ") // VPA handles
    // Keep short hyphenated names together ("WAL-MART") unless one side is a rail/marker word
    .replace(/\b([A-Za-z]{2,5})-([A-Za-z]{2,6})\b/g, (m, a, b) => (STOP.has(a.toLowerCase()) || STOP.has(b.toLowerCase()) ? m : `${a} ${b}`))
    .split(/[\/\-|:*]+|\s{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const p of parts) {
    const words = p.toLowerCase().split(/\s+/).filter((w) => /[a-z]/.test(w) && !/\d{3,}/.test(w) && !STOP.has(w));
    if (words.length && words.join(" ").length >= 3) return words.slice(0, 3).join(" ");
  }
  return null;
}

const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase());

/**
 * @param {{ description: string, type: "INCOME"|"EXPENSE" }} row
 * @param {Record<string, "INCOME"|"EXPENSE">} categoryTypes - category id → type
 * @returns {{ category: string, keywords: string[], description: string }}
 */
export function categorize(row, categoryTypes) {
  const text = row.description || "";
  let category = row.type === "INCOME" ? "other-income" : "other-expense";
  let tag = null;
  let matched = null;

  for (const rule of COMPILED) {
    if (categoryTypes[rule.category] !== row.type) continue; // keep category consistent with income/expense
    const m = text.match(rule.re);
    if (m) {
      category = rule.category;
      tag = rule.tag;
      matched = m[1].toLowerCase();
      break;
    }
  }

  const method = METHODS.find(([, re]) => re.test(text))?.[0] || null;
  const party = counterparty(text);
  const keywords = [...new Set([method, matched || (method === "atm" ? null : party), tag].filter(Boolean))].slice(0, 4);
  if (method === "atm" && !tag) keywords.push("cash");

  // Friendlier description: "UPI-SWIGGY-swiggy@icici-..." → "Swiggy", "NEFT CR-ACME TECH-SALARY" → "Acme Tech"
  let description;
  if (method === "atm") description = "ATM withdrawal";
  else if (matched && !GENERIC.has(matched)) description = titleCase(matched);
  else if (party) description = titleCase(party);
  else if (matched) description = LABELS[matched] || titleCase(matched);
  else description = text;

  return { category, keywords: [...new Set(keywords)], description };
}
