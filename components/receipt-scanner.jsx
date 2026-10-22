"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Camera, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { defaultCategories } from "@/data/categories";
import { readReceipt } from "@/lib/receipt/ocr";
import { parseReceiptText } from "@/lib/receipt/parse";

const CATEGORY_TYPES = Object.fromEntries(defaultCategories.map((c) => [c.id, c.type]));
const categoryName = (id) => defaultCategories.find((c) => c.id === id)?.name || id;

const STATUS_LABELS = {
  "loading tesseract core": "Loading scanner…",
  "initializing tesseract": "Starting scanner…",
  "loading language traineddata": "Loading language data (first time only)…",
  "initializing api": "Preparing…",
  "recognizing text": "Reading receipt…",
};

/**
 * Scans a receipt photo on-device and extracts amount, date, merchant and category.
 * - compact + onScanComplete: used inside the Add Transaction form to fill its fields
 * - default: dashboard card that links to Add Transaction with the details prefilled
 */
export default function ReceiptScanner({ onScanComplete, compact = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ value: 0, status: "" });
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same photo
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose a photo of the receipt");

    setBusy(true);
    setResult(null);
    try {
      const { text, confidence } = await readReceipt(file, (value, status) => setProgress({ value, status }));
      const parsed = parseReceiptText(text, CATEGORY_TYPES);
      if (!parsed.amount) {
        toast.error("Couldn't find a total on this receipt. Try a clearer, straight-on photo.");
        return;
      }
      const data = { ...parsed, lowConfidence: confidence < 60 };
      setResult(data);
      if (onScanComplete) {
        onScanComplete(data);
        toast.success(`Receipt read: ₹${parsed.amount.toLocaleString("en-IN")} — check the details below`);
      }
    } catch (err) {
      console.error("Receipt scan failed:", err);
      toast.error("Couldn't read the receipt. Check your connection the first time (the scanner downloads once).");
    } finally {
      setBusy(false);
      setProgress({ value: 0, status: "" });
    }
  };

  const picker = (
    <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={handleFile} disabled={busy} />
  );
  const statusText = STATUS_LABELS[progress.status] || "Reading receipt…";
  const pct = progress.status === "recognizing text" ? Math.round(progress.value * 100) : null;

  if (compact) {
    return (
      <div className="rounded-xl border border-dashed border-gold-400/30 bg-gold-500/[0.04] p-4">
        {picker}
        <div className="flex items-center gap-3">
          <Camera className="h-5 w-5 text-gold-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-medium">Scan a receipt</p>
            <p className="text-xs text-white/50">
              {busy ? `${statusText}${pct !== null ? ` ${pct}%` : ""}` : result ? `Filled from ${result.merchant || "receipt"}${result.lowConfidence ? " — photo was unclear, please double-check" : ""}` : "Photo is read on your device — never uploaded"}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="border-gold-400/30 text-gold-200 shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : result ? "Scan again" : "Scan"}
          </Button>
        </div>
      </div>
    );
  }

  const prefill = result
    ? `/transaction/create?${new URLSearchParams({
        amount: String(result.amount),
        ...(result.date && { date: result.date }),
        ...(result.merchant && { description: result.merchant }),
        category: result.category,
      })}`
    : null;

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="flex items-center gap-2 px-6 py-4 border-b border-white/5 uppercase tracking-widest text-xs font-bold text-primary space-y-0">
        <Camera size={16} />
        <span>Receipt Scanner</span>
      </CardHeader>
      <CardContent className="p-6 flex-1">
        {picker}
        {result ? (
          <div className="space-y-4">
            <div className={`flex items-center gap-2 text-xs font-semibold ${result.lowConfidence ? "text-orange-300" : "text-green-400"}`}>
              {result.lowConfidence ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              {result.lowConfidence ? "Photo was unclear — please double-check" : "Receipt read"}
            </div>
            <dl className="bg-white/5 border border-white/10 p-3 rounded-xl text-sm space-y-2">
              <div className="flex justify-between gap-3"><dt className="text-white/50">Merchant</dt><dd className="text-white font-medium text-right truncate">{result.merchant || "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/50">Total</dt><dd className="text-white font-bold">₹{result.amount.toLocaleString("en-IN")}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/50">Date</dt><dd className="text-white">{result.date ? format(new Date(result.date), "dd MMM yyyy") : "—"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-white/50">Category</dt><dd className="text-gold-300 font-medium">{categoryName(result.category)}</dd></div>
            </dl>
            <div className="flex gap-2">
              <Link href={prefill} className="flex-1">
                <Button className="w-full bg-gold-400 hover:bg-gold-300 text-[#1a1f2b] font-bold">Add as transaction</Button>
              </Link>
              <Button variant="outline" className="border-white/10" onClick={() => setResult(null)}>Clear</Button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            className="w-full border-2 border-dashed border-white/10 hover:border-primary/50 bg-white/5 hover:bg-white/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 transition-colors">
            {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Camera className="h-8 w-8 text-primary" />}
            <span className="text-sm text-white font-medium">{busy ? statusText : "Take or upload a receipt photo"}</span>
            <span className="text-xs text-white/45">
              {busy ? (pct !== null ? `${pct}%` : " ") : "Read on your device — the photo is never uploaded"}
            </span>
          </button>
        )}
      </CardContent>
    </Card>
  );
}
