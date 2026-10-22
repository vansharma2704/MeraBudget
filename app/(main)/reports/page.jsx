"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Table } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { format } from "date-fns";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const data = await getDashboardData();
      setTransactions(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("MeraBudget - Financial Report", 20, 10);
    doc.text(`Generated on: ${format(new Date(), "PP")}`, 20, 20);

    const tableData = transactions.map((t) => [
      format(new Date(t.date), "dd/MM/yyyy"),
      t.description || "Untitled",
      t.category,
      t.type,
      `INR ${Number(t.amount).toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [["Date", "Description", "Category", "Type", "Amount"]],
      body: tableData,
      startY: 30,
    });

    doc.save(`MeraBudget_Report_${format(new Date(), "yyyy-MM")}.pdf`);
    toast.success("PDF exported successfully!");
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      transactions.map((t) => ({
        Date: format(new Date(t.date), "yyyy-MM-dd"),
        Description: t.description,
        Category: t.category,
        Type: t.type,
        Amount: Number(t.amount),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `MeraBudget_Report_${format(new Date(), "yyyy-MM")}.xlsx`);
    toast.success("Excel exported successfully!");
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-16 space-y-8">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <h1 className="text-4xl font-bold gradient-title">Financial Reports</h1>
        <p className="text-muted-foreground">Download detailed analysis of your spending and income.</p>
      </div>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        <Card className="glassmorphism glow-border hover:bg-gold-500/5 transition-all text-center">
          <CardHeader>
            <div className="mx-auto h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-400 mb-2">
              <FileDown size={32} />
            </div>
            <CardTitle>PDF Report</CardTitle>
            <CardDescription>Visual summary of your monthly finances.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportPDF} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 glow-button">
              <FileText className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="glassmorphism glow-border hover:bg-gold-500/5 transition-all text-center">
          <CardHeader>
            <div className="mx-auto h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-2">
              <Table size={32} />
            </div>
            <CardTitle>Excel Data</CardTitle>
            <CardDescription>Raw transaction data for spreadsheets.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={exportExcel} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 glow-button">
              <FileText className="mr-2 h-4 w-4" /> Export XLSX
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glassmorphism border-gold-500/20">
        <CardHeader>
          <CardTitle>Data Preview</CardTitle>
          <CardDescription>Last {transactions.length} transactions included in report.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 text-center py-10 italic">
            All your financial data is processed securely and encrypted.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
