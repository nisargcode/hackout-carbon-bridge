"use client";

import { Leaf, Download, FileSpreadsheet, Calendar, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReportsPage() {
  const downloadReport = (title: string) => {
    toast.success(`Generating ${title} report...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Carbon Abatement & ESG Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Downloadable audit packages, BRSR sustainability filings, and net-emissions abatement reports.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Q3 2026 BRSR Environmental Disclosure",
            period: "Jul 1 – Sep 30, 2026",
            metrics: "3,700 tons captured & recycled",
            type: "Statutory PDF",
          },
          {
            title: "CO₂ Mass-Balance & Purity Ledger",
            period: "Current Year-to-Date",
            metrics: "4,500 tons gross / 800 tons buffer",
            type: "Excel Audit Sheet",
          },
          {
            title: "Circular Carbon Tax Credit Certificate",
            period: "FY 2026-27 Approved",
            metrics: "₹42.5L eligible rebate",
            type: "Certified PDF",
          },
        ].map((report) => (
          <Card key={report.title} className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600 text-xs font-semibold mb-1">
                <Leaf className="h-4 w-4" /> {report.type}
              </div>
              <CardTitle className="text-base">{report.title}</CardTitle>
              <CardDescription className="text-xs">{report.period}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-muted/40 p-2.5 rounded text-xs font-medium text-foreground">
                Key Metric: {report.metrics}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => downloadReport(report.title)}
              >
                <Download className="h-3.5 w-3.5 mr-1.5" /> Download Report
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
