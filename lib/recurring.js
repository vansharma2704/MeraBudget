// Date math for recurring transactions (UTC, so results don't depend on the server's time zone).
// Occurrences are always counted from the original date, so month-ends don't drift:
// Jan 31 → Feb 28 → Mar 31 (not Mar 28).

const DAY = 86_400_000;
const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

/** The n-th occurrence (n = 1 is the first repeat) of a series starting at `start`. */
export function nthOccurrence(start, interval, n) {
  const s = new Date(start);
  const time = s.getTime() - Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()); // time of day
  switch (interval) {
    case "DAILY":
      return new Date(s.getTime() + n * DAY);
    case "WEEKLY":
      return new Date(s.getTime() + n * 7 * DAY);
    case "MONTHLY":
    case "YEARLY": {
      const months = interval === "MONTHLY" ? n : n * 12;
      const total = s.getUTCMonth() + months;
      const y = s.getUTCFullYear() + Math.floor(total / 12);
      const m = ((total % 12) + 12) % 12;
      const d = Math.min(s.getUTCDate(), daysInMonth(y, m)); // clamp 31st → 30th/28th
      return new Date(Date.UTC(y, m, d) + time);
    }
    default:
      throw new Error(`Unknown interval: ${interval}`);
  }
}

/** First repeat after the transaction's own date. */
export const firstRecurrence = (start, interval) => nthOccurrence(start, interval, 1);

/** First occurrence strictly after `after`; used when an existing series is edited. */
export function nextOccurrenceAfter(start, interval, after = new Date()) {
  const afterTime = new Date(after).getTime();
  let n = 1;
  let candidate = nthOccurrence(start, interval, n);
  while (candidate.getTime() <= afterTime && n < 100_000) {
    candidate = nthOccurrence(start, interval, ++n);
  }
  return candidate;
}

/**
 * Every occurrence that is due (≤ now), starting with the stored `next` date, plus the following one.
 * @returns {{ due: Date[], next: Date }}
 */
export function dueOccurrences(start, interval, next, now, max = 60) {
  const due = [];
  const nextTime = new Date(next).getTime();
  const nowTime = new Date(now).getTime();
  if (nextTime > nowTime) return { due, next: new Date(next) };

  due.push(new Date(next));
  // Find the occurrence index just after `next`, then walk forward while still due
  let n = 1;
  while (nthOccurrence(start, interval, n).getTime() <= nextTime && n < 100_000) n++;
  let candidate = nthOccurrence(start, interval, n);
  while (candidate.getTime() <= nowTime && due.length < max) {
    due.push(candidate);
    candidate = nthOccurrence(start, interval, ++n);
  }
  return { due, next: candidate };
}
