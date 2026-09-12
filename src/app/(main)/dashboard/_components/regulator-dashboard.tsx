"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, ReceiptText, AlertCircle, BarChart2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

export function RegulatorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    verifiedCerts: 0,
    pendingReview: 0,
    co2Tracked: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient();

        // 1. Fetch counts
        const { count: txCount } = await supabase
          .from("contracts")
          .select("*", { count: "exact", head: true });
        const { count: certCount } = await supabase
          .from("certificates")
          .select("*", { count: "exact", head: true });

        // 2. Fetch shipments for mass balance tracking
        const { data: shipments } = await supabase
          .from("shipments")
          .select("quantity, status");
        const totalCO2 =
          shipments?.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0) || 0;
        const pending =
          shipments?.filter((s) => s.status !== "VERIFIED").length || 0;

        // 3. Fetch recent contracts
        const { data: contracts } = await supabase
          .from("contracts")
          .select("*, seller:supplier_id(name), buyer:buyer_id(name)")
          .order("created_at", { ascending: false })
          .limit(5);

        setStats({
          totalTransactions: txCount || 0,
          verifiedCerts: certCount || 0,
          pendingReview: pending,
          co2Tracked: totalCO2,
        });
        setRecentTransactions(contracts || []);
      } catch (err) {
        console.error("Failed to load regulator stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    { label: "Total Transactions", value: stats.totalTransactions.toString(), icon: ReceiptText },
    { label: "Verified Certificates", value: stats.verifiedCerts.toString(), icon: ShieldCheck },
    { label: "Pending Review", value: stats.pendingReview.toString(), icon: AlertCircle },
    { label: "CO₂ Mass Tracked", value: `${stats.co2Tracked.toLocaleString()} tons`, icon: BarChart2 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Regulatory Oversight & Statutory Audit
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time compliance monitoring, verified chain-of-custody, and carbon accounting.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/transactions">
            Full Transaction Ledger
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {m.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{m.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Marketplace Transactions</CardTitle>
              <CardDescription>Bilateral contracts registered under statutory oversight</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/transactions">
                View Ledger
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <ReceiptText className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No marketplace transactions recorded yet.</p>
                <p className="text-xs">
                  When emitters and buyers execute bilateral contracts, audits will track here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.contract_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3.5"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {tx.seller?.name || "Seller"} → {tx.buyer?.name || "Buyer"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {tx.total_quantity} tons @ ₹{Number(tx.unit_price || 0).toLocaleString()}/ton · Value: ₹{(Number(tx.total_quantity || 0) * Number(tx.unit_price || 0)).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={tx.status === "ACTIVE" ? "default" : "outline"}>
                      {tx.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
