"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { FileUp, Lock, X, Copy, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { defaultCategories } from "@/data/categories";
import { parseStatement, parseStatementText, importStatement } from "@/actions/statement";
import { ocrStatementPdf } from "@/lib/statement/pdf-ocr";

const inr = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const byType = {
  INCOME: defaultCategories.filter((c) => c.type === "INCOME"),
  EXPENSE: defaultCategories.filter((c) => c.type === "EXPENSE"),
};

export default function StatementImport({ accountId }) {
  const router = useRouter();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);
  const [reading, setReading] = useState(false);
  const [ocrStatus, setOcrStatus] = useState(""); // progress text while reading a scanned PDF
  const [rows, setRows] = useState(null); // preview rows (with `selected`)
  const [adjustBalance, setAdjustBalance] = useState(true);
  const [importing, setImporting] = useState(false);

  const reset = () => {
    setFile(null);
    setPassword("");
    setNeedsPassword(false);
    setRows(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const read = async () => {
    if (!file) return;
    setReading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("accountId", accountId);
    if (password) fd.append("password", password);
    let r = await parseStatement(fd);

    // Scanned (image-only) PDF: read it on this device with OCR, then parse the recognised text
    if (!r.success && r.code === "NO_TEXT") {
      try {
        setOcrStatus("Scanned PDF — preparing on-device reader…");
        const lines = await ocrStatementPdf(file, {
          password: password || undefined,
          onProgress: ({ page, pages, progress }) =>
            setOcrStatus(`Scanned PDF — reading page ${page} of ${pages}… ${Math.round(progress * 100)}%`),
        });
        setOcrStatus("Organising transactions…");
        r = await parseStatementText(accountId, lines);
      } catch (err) {
        console.error("Statement OCR failed:", err);
        r = { success: false, error: "Couldn't read this scanned PDF. Check your connection (the reader downloads once) and try again." };
      }
      setOcrStatus("");
    }

    setReading(false);
    if (!r.success) {
      if (r.code === "PDF_PASSWORD") setNeedsPassword(true);
      toast.error(r.error);
      return;
    }
    setRows(r.data.map((row) => ({ ...row, selected: !row.duplicate })));
  };

  const update = (key, patch) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const flipType = (row) => {
    const type = row.type === "INCOME" ? "EXPENSE" : "INCOME";
    // Keep the category valid for the new type
    const category = byType[type].some((c) => c.id === row.category) ? row.category : type === "INCOME" ? "other-income" : "other-expense";
    update(row.key, { type, category });
  };

  const summary = useMemo(() => {
    const picked = (rows || []).filter((r) => r.selected);
    return {
      count: picked.length,
      income: picked.filter((r) => r.type === "INCOME").reduce((a, r) => a + r.amount, 0),
      expense: picked.filter((r) => r.type === "EXPENSE").reduce((a, r) => a + r.amount, 0),
      duplicates: (rows || []).filter((r) => r.duplicate).length,
    };
  }, [rows]);

  const doImport = async () => {
    const picked = rows.filter((r) => r.selected);
    setImporting(true);
    const r = await importStatement(accountId, picked, adjustBalance);
    setImporting(false);
    if (!r.success) return toast.error(r.error);
    toast.success(`Imported ${r.data.inserted} transactions`);
    reset();
    setOpen(false);
    router.refresh();
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} variant="outline" className="border-gold-400/30 text-gold-200 hover:bg-gold-500/10">
        <FileUp size={16} className="mr-2" /> Import bank statement
      </Button>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-white font-semibold text-lg">Import bank statement</h2>
          <p className="text-white/50 text-sm mt-0.5">
            Upload the PDF from your net banking. Transactions are sorted into income and expenses, categorised and tagged with keywords — review before importing.
          </p>
        </div>
        <button type="button" aria-label="Close" onClick={() => { reset(); setOpen(false); }} className="text-white/40 hover:text-white p-1">
          <X size={18} />
        </button>
      </div>

      {!rows && (
        <div className="space-y-4">
          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/12 hover:border-gold-400/40 py-10 cursor-pointer text-center transition-colors">
            <FileUp className="h-8 w-8 text-gold-300" />
            <span className="text-white font-medium">{file ? file.name : "Choose a PDF statement"}</span>
            <span className="text-white/40 text-xs">{file ? `${(file.size / 1024).toFixed(0)} KB` : "PDFs up to 4 MB · scanned statements are read on your device"}</span>
            <input ref={fileRef} type="file" accept="application/pdf" className="sr-only"
              onChange={(e) => { setFile(e.target.files?.[0] || null); setNeedsPassword(false); }} />
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input type="password" placeholder={needsPassword ? "Enter the PDF password" : "PDF password (if the statement is locked)"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={`bg-white/5 text-white h-11 rounded-xl pl-9 ${needsPassword ? "border-orange-400/60" : "border-white/10"}`} />
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-white/40" />
            </div>
            <Button onClick={read} disabled={!file || reading}
              className="h-11 px-6 bg-gold-400 hover:bg-gold-300 text-[#1a1f2b] font-bold rounded-xl disabled:opacity-40">
              {reading ? "Reading…" : "Read statement"}
            </Button>
          </div>
          {ocrStatus && <p className="text-sm text-gold-200/90" role="status">{ocrStatus}</p>}
          {needsPassword && (
            <p className="text-xs text-orange-200/80">Banks usually lock statements with your date of birth (DDMMYYYY) or customer ID.</p>
          )}
        </div>
      )}

      {rows && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-white/45 text-xs">Selected</p><p className="text-white font-bold text-lg">{summary.count} of {rows.length}</p></div>
            <div className="rounded-xl bg-green-500/[0.07] p-3"><p className="text-white/45 text-xs">Income</p><p className="text-green-400 font-bold text-lg tabular-nums">{inr(summary.income)}</p></div>
            <div className="rounded-xl bg-orange-400/[0.07] p-3"><p className="text-white/45 text-xs">Expenses</p><p className="text-orange-300 font-bold text-lg tabular-nums">{inr(summary.expense)}</p></div>
            <div className="rounded-xl bg-white/[0.04] p-3"><p className="text-white/45 text-xs">Already in account</p><p className="text-white font-bold text-lg">{summary.duplicates}</p></div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <button type="button" className="text-gold-300 hover:underline" onClick={() => setRows(rows.map((r) => ({ ...r, selected: true })))}>Select all</button>
            <button type="button" className="text-gold-300 hover:underline" onClick={() => setRows(rows.map((r) => ({ ...r, selected: false })))}>Select none</button>
            {summary.duplicates > 0 && (
              <span className="text-white/45 flex items-center gap-1.5"><Copy size={13} /> Possible duplicates are unticked</span>
            )}
          </div>

          {/* Rows */}
          <div className="max-h-[28rem] overflow-y-auto rounded-xl border border-white/[0.06] divide-y divide-white/[0.05]">
            {rows.map((r) => (
              <div key={r.key} className={`flex flex-wrap sm:flex-nowrap items-center gap-3 px-3 py-3 ${r.selected ? "" : "opacity-45"}`}>
                <input type="checkbox" checked={r.selected} onChange={(e) => update(r.key, { selected: e.target.checked })}
                  aria-label={`Include ${r.description}`} className="w-4 h-4 accent-[#e9c46a] shrink-0" />
                <span className="w-16 shrink-0 text-xs text-white/50 tabular-nums">{format(new Date(r.date), "dd MMM yy")}</span>
                <div className="flex-1 min-w-[10rem]">
                  <p className="text-sm text-white flex items-center gap-2">
                    {r.description}
                    {r.duplicate && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">duplicate?</span>}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {r.keywords.map((k) => (
                      <span key={k} className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-500/10 text-gold-200/90">{k}</span>
                    ))}
                  </div>
                  <p className="text-[11px] text-white/30 truncate mt-0.5" title={r.narration}>{r.narration}</p>
                </div>
                <button type="button" onClick={() => flipType(r)} title="Switch income / expense"
                  className={`shrink-0 h-8 px-3 text-xs font-semibold inline-flex items-center gap-1 ${r.type === "INCOME" ? "bg-green-500/15 text-green-400" : "bg-orange-400/15 text-orange-300"}`}>
                  {r.type === "INCOME" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                  {r.type === "INCOME" ? "Income" : "Expense"}
                </button>
                <select value={r.category} onChange={(e) => update(r.key, { category: e.target.value })}
                  aria-label="Category"
                  className="shrink-0 h-8 rounded-lg bg-[#232a38] border border-white/10 text-white text-xs px-2">
                  {byType[r.type].map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <span className={`w-24 shrink-0 text-right text-sm font-semibold tabular-nums ${r.type === "INCOME" ? "text-green-400" : "text-white"}`}>
                  {r.type === "INCOME" ? "+" : "−"}{inr(r.amount)}
                </span>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-2.5 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={adjustBalance} onChange={(e) => setAdjustBalance(e.target.checked)} className="w-4 h-4 mt-0.5 accent-[#e9c46a]" />
            <span>
              Update the account balance by <strong className="text-white">{inr(summary.income - summary.expense)}</strong>
              <span className="block text-xs text-white/40">Untick if your balance in MeraBudget already includes these transactions.</span>
            </span>
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={reset} className="h-11 border-white/15">Choose another file</Button>
            <Button onClick={doImport} disabled={importing || summary.count === 0}
              className="flex-1 h-11 bg-gold-400 hover:bg-gold-300 text-[#1a1f2b] font-bold rounded-xl disabled:opacity-40">
              {importing ? "Importing…" : `Import ${summary.count} transaction${summary.count === 1 ? "" : "s"}`}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
