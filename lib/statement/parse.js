// Turns the text lines of a bank statement into transactions, without knowing the bank's layout.
// Works on lines like:
//   "01/04/24  UPI-SWIGGY-swiggy@icici-123456  01/04/24  250.00  10,250.00"
//   "1  05 Apr 2024  NEFT CR-ACME LTD SALARY  50,000.00  60,250.00"
// Income vs expense comes from the running balance when available (balance up = money in).

const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, sept: 8, oct: 9, nov: 10, dec: 11 };

const DATE_SRC =
  "(\\d{1,2})[\\/\\-.](\\d{1,2})[\\/\\-.](\\d{2,4})" + // 01/04/2024, 01-04-24, 01.04.2024
  "|(\\d{1,2})[\\s\\-\\/]([A-Za-z]{3,4})[\\s\\-\\/,]+(\\d{2,4})"; // 01 Apr 2024, 01-Apr-24
const LEADING_DATE = new RegExp(`^\\s*(?:\\d{1,4}\\s+)?(?:${DATE_SRC})(?=\\s|$)`);
// Some statements (e.g. US banks) print dates without a year: "10/02"
const LEADING_SHORT_DATE = /^\s*(?:\d{1,4}\s+)?(\d{1,2})[\/\-](\d{1,2})(?=\s)(?![\/\-.]\d)/;
const ANY_DATE = new RegExp(`(?:^|\\s)(?:${DATE_SRC})(?=\\s|$)`, "g");
// 1,00,000.00 / 250.00 / 1234.56 with optional Cr/Dr
const AMOUNT = /(?<![\w.,\/-])(-?(?:\d{1,3}(?:,\d{2,3})+|\d+)\.\d{2})(?:\s?(Cr|Dr|CR|DR|cr|dr)\b)?(?![\d\/])/g;

const OPENING = /\b(opening|beginning|brought forward|b\/f)\s+balance\b/i;
const HEADER_WORDS = /\b(narration|particulars|withdrawals?|deposits?|closing balance|ending balance|opening balance|statement of account|page \d+|chq\.?\s*\/?\s*ref|value dt|txn date|transaction date|account no|ifsc|branch|customer id|generated on|total)\b/i;
const CREDIT_HINTS = /\b(salary|sal\b|refund|reversal|reversed|cashback|interest|int\.?\s?pd|dividend|neft cr|imps cr|upi cr|by transfer|by clg|credited|deposit)\b|\/cr\//i;

const toNumber = (s) => parseFloat(String(s).replace(/,/g, ""));

function parseDate(m) {
  // m: regex match with groups 1-3 (numeric) or 4-6 (named month)
  let d, mo, y;
  if (m[1]) {
    d = +m[1]; mo = +m[2] - 1; y = +m[3];
  } else {
    d = +m[4]; mo = MONTHS[m[5].toLowerCase()]; y = +m[6];
    if (mo === undefined) return null;
  }
  if (y < 100) y += 2000;
  if (mo < 0 || mo > 11 || d < 1 || d > 31) return null;
  return new Date(Date.UTC(y, mo, d));
}

// Year-less "dd/mm" or "mm/dd": decide the order for the whole statement (a part > 12 can only be a day),
// defaulting to Indian dd/mm, and pick the latest year that isn't in the future.
function resolveShortDates(raw) {
  const shorts = raw.filter((r) => !r.date && r.short);
  if (!shorts.length) return;
  const monthFirst = shorts.some((r) => r.short[1] > 12) && !shorts.some((r) => r.short[0] > 12);
  // Walk in order; a big jump back in month (Dec → Jan) means the year rolled over
  const prov = [];
  let yearOffset = 0;
  let lastMonth = null;
  for (const r of shorts) {
    const [d, m] = monthFirst ? [r.short[1], r.short[0]] : r.short;
    if (m < 1 || m > 12 || d < 1 || d > 31) continue;
    if (lastMonth !== null && m < lastMonth - 6) yearOffset++;
    lastMonth = m;
    prov.push({ r, d, m, yearOffset });
  }
  if (!prov.length) return;
  // One base year for the whole statement: the latest that keeps every date out of the future
  const limit = Date.now() + 86400000;
  let base = new Date().getUTCFullYear();
  while (base > 1990 && Math.max(...prov.map((p) => Date.UTC(base + p.yearOffset, p.m - 1, p.d))) > limit) base--;
  for (const p of prov) p.r.date = new Date(Date.UTC(base + p.yearOffset, p.m - 1, p.d));
}

function cleanDescription(text) {
  return text
    .replace(/^\s*(?:\d{1,4}\s+)?\d{1,2}[\/\-]\d{1,2}(?=\s)/, " ") // leading year-less date
    .replace(ANY_DATE, " ")
    .replace(AMOUNT, " ")
    .replace(/\b\d{6,}\b/g, " ") // reference / cheque numbers
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s\-\/|:]+|[\s\-\/|:]+$/g, "")
    .trim();
}

function amountsIn(text) {
  return [...text.matchAll(AMOUNT)].map((m) => ({ value: Math.abs(toNumber(m[1])), side: m[2] ? m[2].toLowerCase() : null }));
}

/**
 * @param {string[]} lines - statement text, one visual line per entry
 * @returns {{ rows: Array<{date: string, description: string, amount: number, type: "INCOME"|"EXPENSE", balance: number|null}>, openingBalance: number|null }}
 */
export function parseStatementLines(lines) {
  const raw = [];
  let openingBalance = null;

  for (const line of lines) {
    const text = line.replace(/ /g, " ").trim();
    if (!text) continue;

    if (OPENING.test(text)) {
      // The first amount after the label (other columns on the same line may hold other figures)
      const a = amountsIn(text.slice(text.search(OPENING)));
      if (a.length) openingBalance = a[0].value;
      continue;
    }

    const dm = text.match(LEADING_DATE);
    let date = dm ? parseDate(dm) : null;
    let short = null;
    if (!date) {
      const sm = text.match(LEADING_SHORT_DATE);
      if (sm) short = [+sm[1], +sm[2]];
    }

    if (date || short) {
      raw.push({ date, short, text, amounts: amountsIn(text) });
    } else if (raw.length && !HEADER_WORDS.test(text)) {
      // Wrapped narration (or amounts printed on the next line)
      const prev = raw[raw.length - 1];
      if (prev.amounts.length === 0) prev.amounts = amountsIn(text);
      prev.text += " " + text;
    }
  }

  resolveShortDates(raw);

  let rows = raw
    .filter((r) => r.date && r.amounts.length > 0)
    .map((r) => {
      const a = r.amounts;
      const hasBalance = a.length >= 2;
      const balance = hasBalance ? a[a.length - 1].value : null;
      // Of the columns before the balance, the transaction amount is the non-zero one
      const before = hasBalance ? a.slice(0, -1) : a;
      const nonZero = before.filter((x) => x.value > 0);
      const pick = nonZero[nonZero.length - 1] || before[before.length - 1];
      // With separate Withdrawal | Deposit columns, position tells the side
      let positional = null;
      if (before.length >= 2 && nonZero.length === 1) {
        positional = before.indexOf(pick) === before.length - 2 ? "EXPENSE" : "INCOME";
      }
      return {
        date: r.date,
        description: cleanDescription(r.text) || "Bank transaction",
        amount: pick.value,
        balance,
        side: pick.side, // "cr" | "dr" | null
        positional,
        amountCount: a.length,
        text: r.text,
      };
    })
    .filter((r) => r.amount > 0);

  // Walk the statement oldest-first (some banks print newest-first)
  const balRows = rows.filter((r) => r.balance !== null);
  let ups = 0, downs = 0;
  for (let i = 1; i < balRows.length; i++) {
    if (balRows[i].date > balRows[i - 1].date) ups++;
    else if (balRows[i].date < balRows[i - 1].date) downs++;
  }
  const ordered = downs > ups ? [...rows].reverse() : rows;

  // Running-balance check: a row belongs to the main table if previous balance ± amount = its balance.
  // This drops look-alike lines (detail sections, cheque-image lists) and recovers OCR slips.
  const fits = (prev, r) =>
    prev !== null && r.balance !== null && Math.abs(Math.abs(+(r.balance - prev).toFixed(2)) - r.amount) < 0.01;
  let prev = openingBalance;
  let chained = 0;
  ordered.forEach((r, i) => {
    // OCR sometimes drops the decimal point of a small amount (".26" → "26"), leaving the balance as
    // the only amount. Recover the amount from the change in balance if a bare number agrees.
    if (r.amountCount === 1 && prev !== null) {
      const delta = +(r.amount - prev).toFixed(2);
      const ints = (r.text.replace(/^\s*\S+/, "").match(/(?<![\d.,\/])\d{1,6}(?![\d.,\/])/g) || []).map(Number);
      if (delta !== 0 && ints.some((n) => n === Math.round(Math.abs(delta) * 100) || n === Math.abs(delta))) {
        r.balance = r.amount;
        r.amount = Math.abs(delta);
      }
    }
    if (r.balance === null) return;
    if (fits(prev, r)) {
      r.verified = true;
      r.deltaType = r.balance > prev ? "INCOME" : "EXPENSE";
      prev = r.balance;
      chained++;
      return;
    }
    // Re-anchor (first row without an opening balance, or after one misread balance):
    // accept this row if the next balance row fits against it
    const next = ordered.slice(i + 1).find((x) => x.balance !== null);
    if (next && fits(r.balance, next)) {
      r.verified = true;
      prev = r.balance;
    }
  });

  if (chained >= 2) {
    // Unverified rows are detail/summary look-alikes: lend their richer text to the matching
    // main row (same day + amount), then drop them so nothing is counted twice
    const main = ordered.filter((r) => r.verified);
    for (const d of ordered.filter((r) => !r.verified)) {
      const match = main.find((m) => !m.enriched && +m.date === +d.date && Math.abs(m.amount - d.amount) < 0.01);
      if (match) {
        match.enriched = true;
        if (d.description.length > match.description.length) match.description = d.description;
        match.text += " " + d.text;
      }
    }
    rows = rows.filter((r) => r.verified);
  }

  for (const r of rows) {
    r.type =
      (r.side && (r.side === "cr" ? "INCOME" : "EXPENSE")) ||
      r.deltaType ||
      r.positional ||
      (CREDIT_HINTS.test(r.text) ? "INCOME" : "EXPENSE");
  }

  return {
    openingBalance,
    rows: rows.map(({ date, description, amount, type, balance }) => ({
      date: date.toISOString(),
      description,
      amount,
      type,
      balance,
    })),
  };
}
