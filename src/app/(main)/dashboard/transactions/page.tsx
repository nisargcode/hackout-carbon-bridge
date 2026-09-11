"use client";

import { ReceiptText, CheckCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
  const txs = [
    { id: "TX-2026-9011", date: "Sep 11, 2026", seller: "ABC Cement Works", buyer: "CleanFuel Synthesis", volume: "200 tons", value: "₹8,40,000", state: "Delivered & Verified", tax: "Exempt" },
    { id: "TX-2026-9012", date: "Sep 10, 2026", seller: "ABC Cement Works", buyer: "GreenGrow AgriTech", volume: "150 tons", value: "₹6,30,000", state: "Delivered & Verified", tax: "Exempt" },
    { id: "TX-2026-9013", date: "Sep 09, 2026", seller: "Tata Steel Jamshedpur", buyer: "CarbonMat Materials", volume: "500 tons", value: "₹18,75,000", state: "In Transit", tax: "Pending" },
    { id: "TX-2026-9014", date: "Sep 07, 2026", seller: "PowerGen Hazira", buyer: "BioSynthetics", volume: "350 tons", value: "₹13,30,000", state: "Settled", tax: "Exempt" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Regulator Transaction Ledger</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full statutory visibility into all commercial CO₂ bilateral trades, pricing transparency, and mass balances.
        </p>
      </div>

      <div className="space-y-3">
        {txs.map((tx) => (
          <Card key={tx.id} className="hover:border-primary/40 transition-colors">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{tx.seller} ➔ {tx.buyer}</span>
                    <Badge variant="outline" className="text-xs">{tx.id}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>Volume: <strong className="text-foreground">{tx.volume}</strong></span>
                    <span>Value: <strong className="text-foreground">{tx.value}</strong></span>
                    <span>Date: {tx.date}</span>
                    <span>Tax Status: {tx.tax}</span>
                  </div>
                </div>
                <div>
                  <Badge className="bg-green-600 text-white text-xs">{tx.state}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
