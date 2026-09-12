"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ShieldCheck, ReceiptText, AlertCircle, BarChart2, ArrowRight, BarChart3 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
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
          .select("*, seller:companies!seller_id(name), buyer:companies!buyer_id(name)")
          .order("created_at", { ascending: false })
          .limit(10);

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

  const chartData = useMemo(() => {
    if (recentTransactions.length === 0) {
      return [{ contract: "Audit #1", volume: 0, value: 0 }];
    }
    return recentTransactions.slice(0, 6).map((tx) => ({
      contract: `${tx.seller?.name?.split(" ")[0] || "Seller"} ? ${tx.buyer?.name?.split(" ")[0] || "Buyer"}`,
      volume: Number(tx.quantity) || 0,
      value: Math.round(((Number(tx.quantity) || 0) * (Number(tx.unit_price) || 0)) / 100000), // In Lakhs
    }));
  }, [recentTransactions]);

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
    { label: "CO? Mass Tracked", value: `${stats.co2Tracked.toLocaleString()} tons`, icon: BarChart2 },
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

      {/* Interactive Regulatory Oversight Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Statutory Transaction Volume (MT) & Value (? Lakhs)
              </CardTitle>
              <CardDescription>
                Audited bilateral contracts logged under statutory National Carbon Authority oversight
              </CardDescription>
            </div>
            <Badge variant="outline">Verified Ledger</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="contract" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(152, 60%, 42%)" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(217, 91%, 60%)" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === "Volume (MT)" ? `${Number(val).toLocaleString()} MT` : `?${Number(val).toLocaleString()} Lakhs`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar yAxisId="left" dataKey="volume" name="Volume (MT)" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="value" name="Value (? Lakhs)" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
                        {tx.seller?.name || "Seller"} ? {tx.buyer?.name || "Buyer"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {tx.quantity} tons @ ?{Number(tx.unit_price || 0).toLocaleString()}/ton ? Value: ?{(Number(tx.quantity || 0) * Number(tx.unit_price || 0)).toLocaleString()}
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
