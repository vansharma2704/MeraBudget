"use server";

import { db } from "@/lib/prisma";
import { getDbUser } from "@/lib/getDbUser";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { defaultCategories } from "@/data/categories";
import { pdfToLines } from "@/lib/statement/pdf-lines";
import { parseStatementLines } from "@/lib/statement/parse";
import { categorize } from "@/lib/statement/categorize";

const CATEGORY_TYPES = Object.fromEntries(defaultCategories.map((c) => [c.id, c.type]));
// Vercel Functions reject requests above their platform body limit before the
// Server Action runs, so fail clearly in the UI below that ceiling.
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 2000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

/**
 * Reads a bank statement PDF and returns categorised rows for preview (nothing is saved).
 * formData: file (PDF), accountId, password (optional)
 */
export async function parseStatement(formData) {
  try {
    const user = await getDbUser();
    if (!user) throw new Error("Unauthorized");

    const file = formData.get("file");
    const accountId = String(formData.get("accountId") || "");
    const password = String(formData.get("password") || "") || undefined;
    if (!file || typeof file.arrayBuffer !== "function") throw new Error("Choose a PDF statement");
    if (file.size > MAX_BYTES) throw new Error("PDF is larger than 4 MB");
    if (file.type && file.type !== "application/pdf") throw new Error("Only PDF statements are supported");

    const [account, lines] = await Promise.all([
      db.account.findFirst({ where: { id: accountId, userId: user.id }, select: { id: true } }),
      file.arrayBuffer().then((buf) => pdfToLines(buf, password)),
    ]);
    if (!account) throw new Error("Account not found");

    // Image-only (scanned) PDF: tell the browser to OCR it on-device and call parseStatementText
    if (!lines.some((l) => /\S/.test(l))) {
      return { success: false, code: "NO_TEXT", error: "This PDF is a scanned image." };
    }

    return { success: true, data: await buildPreview(accountId, lines) };
  } catch (error) {
    if (error.message?.includes("Dynamic server usage")) throw error;
    console.error("parseStatement:", error.message);
    return { success: false, error: error.message, code: error.code };
  }
}

/**
 * Same as parseStatement, for text lines the browser read from a scanned PDF with OCR.
 */
export async function parseStatementText(accountId, lines) {
  try {
    const user = await getDbUser();
    if (!user) throw new Error("Unauthorized");
    if (!Array.isArray(lines) || lines.length > 20000 || lines.some((l) => typeof l !== "string")) {
      throw new Error("Invalid statement text");
    }
    const account = await db.account.findFirst({ where: { id: accountId, userId: user.id }, select: { id: true } });
    if (!account) throw new Error("Account not found");
    return { success: true, data: await buildPreview(accountId, lines.map((l) => l.slice(0, 1000))) };
  } catch (error) {
    if (error.message?.includes("Dynamic server usage")) throw error;
    console.error("parseStatementText:", error.message);
    return { success: false, error: error.message };
  }
}

// Parse lines → categorised preview rows, flagging ones already in the account
async function buildPreview(accountId, lines) {
  const { rows } = parseStatementLines(lines);
  if (rows.length === 0) {
    throw new Error("No transactions found in this statement. Try downloading it again from net banking.");
  }
  if (rows.length > MAX_ROWS) throw new Error(`Statement has ${rows.length} rows; import at most ${MAX_ROWS} at a time`);

  // Flag rows that already exist in this account (same day, amount and type)
  const dates = rows.map((r) => new Date(r.date).getTime());
  const existing = await db.transaction.findMany({
    where: {
      accountId,
      date: { gte: new Date(Math.min(...dates) - 86400000), lte: new Date(Math.max(...dates) + 86400000) },
    },
    select: { date: true, amount: true, type: true },
  });
  const seen = new Set(existing.map((t) => `${dayKey(t.date)}|${Number(t.amount).toFixed(2)}|${t.type}`));

  const data = rows.map((r, i) => {
    const c = categorize(r, CATEGORY_TYPES);
    return {
      key: i,
      date: r.date,
      description: c.description,
      narration: r.description,
      amount: r.amount,
      type: r.type,
      category: c.category,
      keywords: c.keywords,
      duplicate: seen.has(`${dayKey(r.date)}|${r.amount.toFixed(2)}|${r.type}`),
    };
  });

  return data;
}

/**
 * Saves the reviewed rows into the account in a single atomic statement.
 * adjustBalance: also move the account balance by (income − expenses).
 */
export async function importStatement(accountId, rows, adjustBalance = true) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    if (!Array.isArray(rows) || rows.length === 0) throw new Error("Select at least one transaction");
    if (rows.length > MAX_ROWS) throw new Error(`Import at most ${MAX_ROWS} rows at a time`);

    const clean = rows.map((r) => {
      const amount = Math.round(Number(r.amount) * 100) / 100;
      const date = new Date(r.date);
      if (!["INCOME", "EXPENSE"].includes(r.type)) throw new Error("Invalid type");
      if (!(amount > 0)) throw new Error("Amounts must be more than 0");
      if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
      if (!(r.category in CATEGORY_TYPES)) throw new Error("Invalid category");
      return {
        type: r.type,
        amount,
        date: date.toISOString(),
        category: r.category,
        description: String(r.description || "").slice(0, 200) || "Bank transaction",
        keywords: (Array.isArray(r.keywords) ? r.keywords : [])
          .map((k) => String(k).toLowerCase().trim().slice(0, 40))
          .filter(Boolean)
          .slice(0, 8),
      };
    });

    const net = adjustBalance
      ? clean.reduce((sum, r) => sum + (r.type === "INCOME" ? r.amount : -r.amount), 0)
      : 0;

    // One round trip: verify ownership, move the balance, bulk-insert every row
    const result = await db.$queryRaw`
      WITH acct AS (
        UPDATE accounts a
        SET balance = a.balance + ${net.toFixed(2)}::numeric, "updatedAt" = (now() AT TIME ZONE 'UTC')
        FROM users u
        WHERE a.id = ${accountId} AND a."userId" = u.id AND u."clerkUserid" = ${userId}
        RETURNING a.id, a."userId"
      ),
      ins AS (
        INSERT INTO transactions (id, type, amount, description, date, category, keywords, "userId", "accountId", "updatedAt")
        SELECT
          gen_random_uuid()::text,
          r.type::"TransactionType",
          r.amount,
          r.description,
          (r.date AT TIME ZONE 'UTC'),
          r.category,
          r.keywords,
          acct."userId",
          acct.id,
          (now() AT TIME ZONE 'UTC')
        FROM acct,
          jsonb_to_recordset(${JSON.stringify(clean)}::jsonb)
            AS r(type text, amount numeric, description text, date timestamptz, category text, keywords text[])
        RETURNING 1
      )
      SELECT (SELECT count(*) FROM acct)::int AS accounts, (SELECT count(*) FROM ins)::int AS inserted
    `;

    const { accounts, inserted } = result[0];
    if (!accounts) throw new Error("Account not found");

    revalidatePath(`/account/${accountId}`);
    revalidatePath("/dashboard");
    return { success: true, data: { inserted, net } };
  } catch (error) {
    if (error.message?.includes("Dynamic server usage")) throw error;
    console.error("importStatement:", error.message);
    return { success: false, error: error.message };
  }
}
