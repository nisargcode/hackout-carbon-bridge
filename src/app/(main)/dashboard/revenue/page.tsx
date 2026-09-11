"use client";

import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, BarChart3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Revenue & Financial Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monetization metrics, spot settlements, long-term contract cash flows, and carbon offset earnings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Gross Revenue", value: "₹1.57 Cr", change: "+15.2%", color: "text-foreground" },
          { label: "Escrow Secured", value: "₹38.4L", change: "In Escrow", color: "text-blue-500" },
          { label: "Net Settled Payouts", value: "₹1.18 Cr", change: "Disbursed", color: "text-green-600" },
          { label: "Avg Selling Price", value: "₹4,243/t", change: "+4.1%", color: "text-foreground" },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-bold text-2xl ${m.color}`}>{m.value}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{m.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Settlement Transactions</CardTitle>
          <CardDescription>Direct clearing for delivered & verified industrial CO₂</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: "SET-8812", counterparty: "CleanFuel Synthesis Ltd", amount: "₹8,40,000", tons: "200 tons", date: "Sep 10, 2026", status: "SETTLED" },
              { id: "SET-8813", counterparty: "GreenGrow AgriTech", amount: "₹6,30,000", tons: "150 tons", date: "Sep 08, 2026", status: "SETTLED" },
              { id: "SET-8814", counterparty: "CarbonMat Building Materials", amount: "₹22,50,000", tons: "500 tons", date: "Sep 02, 2026", status: "PROCESSING" },
            ].map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/20">
                <div>
                  <p className="font-semibold text-sm">{tx.counterparty}</p>
                  <p className="text-xs text-muted-foreground">{tx.id} · {tx.tons} · {tx.date}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="font-bold text-base text-foreground">{tx.amount}</span>
                  <Badge variant={tx.status === "SETTLED" ? "default" : "outline"} className={tx.status === "SETTLED" ? "bg-green-600 text-white" : ""}>
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
