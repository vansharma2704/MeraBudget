"use client";
// TEMPORARY browser test for scanned-PDF OCR — delete after use
import { useEffect, useState } from "react";
import { ocrStatementPdf } from "@/lib/statement/pdf-ocr";
import { parseStatementLines } from "@/lib/statement/parse";
export default function Page() {
  const [status, setStatus] = useState("starting");
  useEffect(() => {
    (async () => {
      try {
        const blob = await (await fetch("/zz-test-statement.pdf")).blob();
        const t0 = performance.now();
        const lines = await ocrStatementPdf(new File([blob], "s.pdf", { type: "application/pdf" }), { onProgress: (p) => setStatus(`page ${p.page}/${p.pages} ${Math.round(p.progress * 100)}%`) });
        const { rows, openingBalance } = parseStatementLines(lines);
        const inc = rows.filter((r) => r.type === "INCOME").reduce((a, r) => a + r.amount, 0), exp = rows.filter((r) => r.type === "EXPENSE").reduce((a, r) => a + r.amount, 0);
        window.__result = { seconds: Math.round((performance.now() - t0) / 1000), lines: lines.length, rows: rows.length, openingBalance, income: +inc.toFixed(2), expenses: +exp.toFixed(2), closing: +((openingBalance || 0) + inc - exp).toFixed(2), first: rows[0]?.description, last: rows.at(-1)?.description };
      } catch (e) { window.__result = { error: String(e?.stack || e).slice(0, 700) }; }
    })();
  }, []);
  return <p id="status" className="mt-24 p-6 text-white">{status}</p>;
}
