"use client";

import { useEffect, useMemo, useState } from "react";
import { getDashboardData } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Table as TableIcon } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { format, startOfYear, subDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const RANGES = {
  "7": "Last 7 days",
  "30": "Last 30 days",
  "90": "Last 90 days",
  year: "This year",
  all: "All time",
};

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("30");

  useEffect(() => {
    async function fetchData() {
      const data = await getDashboardData();
      setTransactions(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let start = null;
    if (range === "year") start = startOfYear(now);
    else if (range !== "all") start = subDays(now, Number(range));

    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);
      return !Number.isNaN(date.getTime()) && date <= now && (!start || date >= start);
    });
  }, [range, transactions]);

  const totals = useMemo(() => filteredTransactions.reduce(
    (result, transaction) => {
      const amount = Number(transaction.amount) || 0;
      if (transaction.type === "INCOME") result.income += amount;
      else if (transaction.type === "EXPENSE") result.expenses += amount;
      return result;
    },
    { income: 0, expenses: 0 }
  ), [filteredTransactions]);

  const periodLabel = RANGES[range];
  const previewTransactions = filteredTransactions.slice(0, 10);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("MeraBudget - Financial Report", 20, 10);
    doc.text(`Generated on: ${format(new Date(), "PP")}`, 20, 20);
    doc.text(`Period: ${periodLabel}`, 20, 28);
    doc.text(`Income: INR ${totals.income.toFixed(2)} | Expenses: INR ${totals.expenses.toFixed(2)} | Net: INR ${(totals.income - totals.expenses).toFixed(2)}`, 20, 36);

    const tableData = filteredTransactions.map((t) => [
      format(new Date(t.date), "dd/MM/yyyy"),
      t.description || "Untitled",
      t.category,
      t.type,
      `INR ${Number(t.amount).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [["Date", "Description", "Category", "Type", "Amount"]],
      body: tableData,
      startY: 44,
    });

    doc.save(`MeraBudget_Report_${format(new Date(), "yyyy-MM")}.pdf`);
    toast.success("PDF exported successfully!");
  };

  const exportSpreadsheet = () => {
    const escapeCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      ["Date", "Description", "Category", "Type", "Amount"],
      ...filteredTransactions.map((transaction) => [
        format(new Date(transaction.date), "yyyy-MM-dd"),
        transaction.description || "Untitled",
        transaction.category,
        transaction.type,
        Number(transaction.amount).toFixed(2),
      ]),
    ];
    // UTF-8 BOM keeps Indian text readable when the CSV is opened in Excel.
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map(escapeCell).join(",")).join("\r\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `MeraBudget_Report_${format(new Date(), "yyyy-MM")}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.success("Spreadsheet exported successfully!");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 text-center md:text-left">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-title">Financial Reports</h1>
          <p className="text-muted-foreground">Download detailed analysis of your spending and income.</p>
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-full md:w-[180px] bg-white/5 border-white/10 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#232a38] border-white/10">
            {Object.entries(RANGES).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <Card className="glassmorphism glow-border hover:bg-gold-500/5 transition-all text-center">
          <CardHeader>
            <div className="mx-auto h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-2">
              <FileDown size={32} />
            </div>
            <CardTitle>PDF Report</CardTitle>
            <CardDescription>Visual summary for {periodLabel.toLowerCase()}.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportPDF} disabled={loading || filteredTransactions.length === 0} className="w-full bg-red-600 hover:bg-red-700 glow-button">
              <FileText className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="glassmorphism glow-border hover:bg-gold-500/5 transition-all text-center">
          <CardHeader>
            <div className="mx-auto h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-2">
              <TableIcon size={32} />
            </div>
            <CardTitle>Spreadsheet Data</CardTitle>
            <CardDescription>Excel-compatible raw transaction data.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportSpreadsheet} disabled={loading || filteredTransactions.length === 0} className="w-full bg-green-600 hover:bg-green-700 glow-button">
              <FileText className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glassmorphism border-gold-500/20">
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>{filteredTransactions.length} transactions from {periodLabel.toLowerCase()} will be included.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-4"><p className="text-xs text-white/50">Income</p><p className="text-lg font-bold text-emerald-400">₹{totals.income.toLocaleString("en-IN")}</p></div>
            <div className="rounded-xl bg-rose-500/10 p-4"><p className="text-xs text-white/50">Expenses</p><p className="text-lg font-bold text-rose-400">₹{totals.expenses.toLocaleString("en-IN")}</p></div>
            <div className="rounded-xl bg-gold-500/10 p-4"><p className="text-xs text-white/50">Net cash flow</p><p className="text-lg font-bold text-gold-300">₹{(totals.income - totals.expenses).toLocaleString("en-IN")}</p></div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500 text-center py-10">Loading transactions…</div>
          ) : previewTransactions.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-10 italic">No transactions found for this period.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Category</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{transaction.description || "Untitled"}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className={transaction.type === "INCOME" ? "text-emerald-400" : "text-rose-400"}>{transaction.type}</TableCell>
                    <TableCell className="text-right">₹{Number(transaction.amount).toLocaleString("en-IN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filteredTransactions.length > previewTransactions.length && (
            <p className="text-center text-xs text-white/40">Showing the latest {previewTransactions.length}; all {filteredTransactions.length} will be exported.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
