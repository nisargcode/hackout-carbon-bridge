"use client";

import { useState } from "react";
import { FileText, Download, ShieldCheck, Calendar, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const mockContracts = [
  {
    id: "CTR-2026-089",
    title: "Annual High-Purity CO₂ Offtake Agreement",
    buyer: "CleanFuel Synthesis Ltd",
    seller: "ABC Cement Works",
    volume: "2,400 tons/yr",
    price: "₹4,150/ton",
    totalValue: "₹99,60,000",
    type: "LONG_TERM",
    status: "ACTIVE",
    duration: "Oct 2026 – Sep 2027",
    purity: "≥ 98.0%",
  },
  {
    id: "CTR-2026-092",
    title: "Spot Purchase Agreement #092",
    buyer: "GreenGrow AgriTech",
    seller: "ABC Cement Works",
    volume: "150 tons",
    price: "₹4,200/ton",
    totalValue: "₹6,30,000",
    type: "SPOT",
    status: "ACTIVE",
    duration: "Sep 2026",
    purity: "≥ 97.5%",
  },
  {
    id: "CTR-2026-045",
    title: "Bi-Monthly Gas Supply Framework",
    buyer: "CarbonMat Building Materials",
    seller: "Tata Steel Jamshedpur",
    volume: "600 tons",
    price: "₹3,750/ton",
    totalValue: "₹22,50,000",
    type: "LONG_TERM",
    status: "COMPLETED",
    duration: "Jan 2026 – Jun 2026",
    purity: "≥ 96.0%",
  },
];

export default function ContractsPage() {
  const downloadContract = (id: string) => {
    toast.success(`Exporting signed legally-binding contract: ${id}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">CO₂ Supply Contracts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Active long-term offtake agreements, spot supply contracts, and regulatory audit records.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracted Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">₹1.28 Cr</div>
            <p className="text-muted-foreground text-xs mt-1">Across active 2026-2027 contracts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Long-Term Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">2 Active</div>
            <p className="text-muted-foreground text-xs mt-1">Providing sustained revenue baseline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600 flex items-center gap-1.5">
              <ShieldCheck className="h-6 w-6" /> 100%
            </div>
            <p className="text-muted-foreground text-xs mt-1">All contracts validated by regulator</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {mockContracts.map((c) => (
          <Card key={c.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{c.title}</CardTitle>
                    <Badge variant={c.type === "LONG_TERM" ? "default" : "outline"}>
                      {c.type.replace("_", " ")}
                    </Badge>
                    <Badge
                      className={c.status === "ACTIVE" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}
                    >
                      {c.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Contract Reference: {c.id} · Valid: {c.duration}
                  </CardDescription>
                </div>
                <div className="font-bold text-lg text-foreground md:text-right">
                  {c.totalValue}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-muted/40 p-3 rounded-lg">
                <div>
                  <p className="text-muted-foreground text-xs">Buyer</p>
                  <p className="font-medium truncate">{c.buyer}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Seller</p>
                  <p className="font-medium truncate">{c.seller}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Volume & Price</p>
                  <p className="font-medium">{c.volume} @ {c.price}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Purity Standard</p>
                  <p className="font-medium text-green-600">{c.purity}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Auto-renew terms applicable
                </span>
                <Button size="sm" variant="outline" onClick={() => downloadContract(c.id)}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download Legal PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
