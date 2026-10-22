"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Bot, Eye, FileDown, History, Lightbulb, LoaderCircle, RefreshCw, ShieldCheck, Sparkles, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { deleteSavedInsightReport, generateSavingsInsights, getSavedInsightReports } from "@/actions/ai-insights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AiSavingsCoach() {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState(null);
  const [reports, setReports] = useState([]);

  const loadHistory = useCallback(async () => {
    const result = await getSavedInsightReports();
    if (result.success) setReports(result.data);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const generate = async () => {
    setLoading(true);
    const result = await generateSavingsInsights();
    setLoading(false);
    if (!result.success) return toast.error(result.error);
    setInsight(result.data);
    await loadHistory();
  };

  const downloadReport = (report = insight) => {
    if (!report) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    let y = 18;

    const ensureSpace = (height = 24) => {
      if (y + height > 278) { doc.addPage(); y = 18; }
    };
    const heading = (text) => {
      ensureSpace(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(text, margin, y);
      y += 8;
    };
    const paragraph = (text) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(String(text), pageWidth - margin * 2);
      ensureSpace(lines.length * 5 + 4);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    };

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MeraBudget - AI Financial Guidance Report", margin, y);
    y += 9;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date(report.generatedAt || Date.now()).toLocaleDateString("en-IN")}  |  Analysis period: Last 6 months`, margin, y);
    y += 12;

    heading("Executive Summary");
    paragraph(`${report.headline}. ${report.summary}`);
    paragraph(`Financial health score: ${report.healthScore}/100 (${report.status})`);

    autoTable(doc, {
      startY: y,
      head: [["Monthly income", "Monthly expenses", "Monthly savings", "Savings rate", "Total balance"]],
      body: [[
        `INR ${report.snapshot.averageMonthlyIncome.toLocaleString("en-IN")}`,
        `INR ${report.snapshot.averageMonthlyExpenses.toLocaleString("en-IN")}`,
        `INR ${report.snapshot.averageMonthlySavings.toLocaleString("en-IN")}`,
        `${report.snapshot.savingsRate}%`,
        `INR ${report.snapshot.totalBalance.toLocaleString("en-IN")}`,
      ]],
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [35, 42, 56] },
    });
    y = doc.lastAutoTable.finalY + 12;

    heading("Detailed Findings");
    report.findings.forEach((finding, index) => paragraph(`${index + 1}. ${finding.title}: ${finding.detail}`));

    heading("Savings Opportunities");
    report.tips.forEach((tip, index) => {
      paragraph(`${index + 1}. ${tip.title}\nWhy: ${tip.reason}\nRecommended action: ${tip.action}${tip.estimatedMonthlySaving > 0 ? `\nEstimated potential: INR ${tip.estimatedMonthlySaving.toLocaleString("en-IN")} per month` : ""}`);
    });

    heading("30-Day Action Plan");
    [["Today", report.actionPlan.today], ["This week", report.actionPlan.thisWeek], ["This month", report.actionPlan.thisMonth]].forEach(([label, items]) => {
      paragraph(`${label}:\n${items.map((item) => `- ${item}`).join("\n")}`);
    });

    ensureSpace(18);
    doc.setFontSize(8);
    doc.setTextColor(100);
    paragraph("This report is educational guidance based on recorded data, not investment, tax, credit, or legal advice. Verify your records and consider your personal circumstances before acting.");
    doc.save(`MeraBudget_AI_Guidance_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("Detailed AI report downloaded");
  };

  const viewSavedReport = (saved) => {
    setInsight({ ...saved.report, reportId: saved.id, generatedAt: saved.createdAt });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeSavedReport = async (id) => {
    const result = await deleteSavedInsightReport(id);
    if (!result.success) return toast.error(result.error);
    setReports((current) => current.filter((report) => report.id !== id));
    if (insight?.reportId === id) setInsight(null);
    toast.success("Saved report deleted");
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="min-h-16 flex flex-col items-stretch justify-center gap-3 border-b border-white/5 px-4 py-4 !pb-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 sm:!pb-0">
        <div className="flex items-center gap-2 text-primary">
          <Bot size={17} />
          <span className="text-xs font-black uppercase tracking-widest">AI Savings Coach</span>
        </div>
        {insight && <div className="flex items-center gap-2"><span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 sm:inline-flex">{insight.source === "gemini" ? "Gemini AI" : "Smart fallback"}</span><Button size="sm" onClick={() => downloadReport()} className="w-full text-xs sm:w-auto"><FileDown /> Download detailed report</Button></div>}
      </CardHeader>

      <CardContent className="p-6">
        {!insight ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Sparkles size={25} /></div>
            <h3 className="text-xl font-black text-white">Get a personalised savings plan</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">The coach studies your last six months of income, expenses, categories and budget to suggest realistic next steps.</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-300/80"><ShieldCheck size={14} /> Merchant names and descriptions are not shared</div>
            <Button onClick={generate} disabled={loading} className="mt-6 min-w-52">
              {loading ? <><LoaderCircle className="animate-spin" /> Analysing…</> : <><Sparkles /> Generate guidance</>}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div><h3 className="text-xl font-black text-white">{insight.headline}</h3><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">{insight.summary}</p></div>
              <Button variant="outline" size="sm" onClick={generate} disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} Refresh</Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 text-center">
                <Activity className="mb-2 text-primary" size={22} />
                <p className="text-5xl font-black text-white">{insight.healthScore}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">Financial health / 100</p>
                <span className={`mt-3 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${insight.status === "Strong" ? "bg-emerald-400/10 text-emerald-400" : insight.status === "At risk" ? "bg-rose-400/10 text-rose-400" : "bg-amber-400/10 text-amber-300"}`}>{insight.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <Snapshot icon={<TrendingUp />} label="Avg. income" value={insight.snapshot.averageMonthlyIncome} tone="text-emerald-400" />
                <Snapshot icon={<TrendingDown />} label="Avg. expenses" value={insight.snapshot.averageMonthlyExpenses} tone="text-rose-400" />
                <Snapshot icon={<Wallet />} label="Avg. savings" value={insight.snapshot.averageMonthlySavings} tone={insight.snapshot.averageMonthlySavings >= 0 ? "text-emerald-400" : "text-rose-400"} />
                <Snapshot icon={<Activity />} label="Savings rate" value={`${insight.snapshot.savingsRate}%`} tone="text-sky-300" money={false} />
                <Snapshot icon={<Wallet />} label="Total balance" value={insight.snapshot.totalBalance} tone="text-primary" />
              </div>
            </div>

            <section>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h4 className="text-xs font-black uppercase tracking-widest text-primary">Your top priorities</h4><p className="mt-1 text-xs text-slate-500">A quick summary of the most useful actions from your full report.</p></div><button onClick={() => downloadReport()} className="text-left text-xs font-bold text-primary hover:text-white sm:text-right">View all findings in PDF →</button></div>
            <div className="grid gap-4 md:grid-cols-3">
              {insight.tips.slice(0, 3).map((tip, index) => (
                <div key={`${tip.title}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Lightbulb size={18} /></div>
                  <h4 className="font-black text-white">{tip.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">{tip.reason}</p>
                  <p className="mt-3 text-xs leading-relaxed text-white/80"><span className="font-bold text-primary">Try this:</span> {tip.action}</p>
                  {tip.estimatedMonthlySaving > 0 && <p className="mt-4 border-t border-white/5 pt-3 text-[10px] font-black uppercase tracking-widest text-emerald-400">Potential: ₹{tip.estimatedMonthlySaving.toLocaleString("en-IN")}/month</p>}
                </div>
              ))}
            </div>
            </section>
            <p className="text-[10px] leading-relaxed text-slate-600">Guidance is educational and based only on recorded data. Review suggestions against your real needs before acting.</p>
          </div>
        )}

        <div className="mt-8 border-t border-white/5 pt-6">
          <div className="mb-4 flex items-center gap-2 text-primary"><History size={16} /><h3 className="text-xs font-black uppercase tracking-widest">Report history</h3></div>
          {reports.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">Generated reports will be saved here automatically.</p> : (
            <div className="grid gap-3 md:grid-cols-2">
              {reports.map((saved) => (
                <div key={saved.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold text-white">{saved.report.headline}</p>{saved.outdated && <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-300">Outdated</span>}</div><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{new Date(saved.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} • Score {saved.report.healthScore}/100</p></div>
                  <div className="flex shrink-0 gap-1"><Button variant="ghost" size="icon" title="View report" onClick={() => viewSavedReport(saved)}><Eye /></Button><Button variant="ghost" size="icon" title="Download PDF" onClick={() => downloadReport({ ...saved.report, generatedAt: saved.createdAt })}><FileDown /></Button><Button variant="ghost" size="icon" title="Delete report" onClick={() => removeSavedReport(saved.id)} className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"><Trash2 /></Button></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Snapshot({ icon, label, value, tone, money = true }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"><div className={`mb-3 [&_svg]:h-4 [&_svg]:w-4 ${tone}`}>{icon}</div><p className={`text-lg font-black ${tone}`}>{money ? `₹${Number(value).toLocaleString("en-IN")}` : value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</p></div>;
}
