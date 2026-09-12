"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Package, DollarSign, Users, TrendingUp, Clock, PlusCircle, ArrowRight, BarChart3 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export function EmitterDashboard() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCaptured: 0,
    totalSold: 0,
    unusedCapacity: 0,
    revenue: 0,
    activeBuyers: 0,
    utilizationRate: 0,
    avgSellingPrice: 0,
  });
  const [recentBids, setRecentBids] = useState<any[]>([]);
  const [supplies, setSupplies] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!company?.company_id) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();

        // 1. Fetch emitter's CO2 supplies
        const { data: supplyData } = await supabase
          .from("co2_supplies")
          .select("*")
          .eq("emitter_id", company.company_id);

        const currentSupplies = supplyData || [];
        setSupplies(currentSupplies);

        // 2. Fetch contracts where this company is the supplier (seller)
        const { data: contractData } = await supabase
          .from("contracts")
          .select("*")
          .eq("seller_id", company.company_id);

        const currentContracts = contractData || [];
        setContracts(currentContracts);

        // 3. Fetch bids on this emitter's supplies
        const supplyIds = currentSupplies.map((s) => s.supply_id);
        let bids: any[] = [];
        if (supplyIds.length > 0) {
          const { data: bidData } = await supabase
            .from("bids")
            .select("*, companies:bidder_id(name)")
            .in("supply_id", supplyIds)
            .order("created_at", { ascending: false })
            .limit(5);
          bids = bidData || [];
        }
        setRecentBids(bids);

        // Calculate genuine metrics
        const totalCap = currentSupplies.reduce(
          (sum, s) => sum + (parseFloat(s.available_quantity) || 0),
          0
        );
        const totalSold = currentContracts.reduce(
          (sum, c) => sum + (parseFloat(c.quantity) || 0),
          0
        );
        const totalRev = currentContracts.reduce(
          (sum, c) =>
            sum +
            (parseFloat(c.quantity) || 0) * (parseFloat(c.unit_price) || 0),
          0
        );
        const uniqueBuyers = new Set(currentContracts.map((c) => c.buyer_id)).size;
        const avgPrice =
          currentContracts.length > 0
            ? Math.round(totalRev / (totalSold || 1))
            : currentSupplies.length > 0
            ? Math.round(
                currentSupplies.reduce(
                  (acc, s) => acc + (parseFloat(s.asking_price) || 0),
                  0
                ) / currentSupplies.length
              )
            : 0;

        const utilRate =
          totalCap > 0 ? Math.min(100, Math.round((totalSold / totalCap) * 100)) : 0;

        setStats({
          totalCaptured: totalCap,
          totalSold: totalSold,
          unusedCapacity: Math.max(0, totalCap - totalSold),
          revenue: totalRev,
          activeBuyers: uniqueBuyers,
          utilizationRate: utilRate,
          avgSellingPrice: avgPrice,
        });
      } catch (err) {
        console.error("Failed to load emitter stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [company?.company_id]);

  // Interactive chart data mapping live supplies and contracts
  const chartData = useMemo(() => {
    if (supplies.length === 0) {
      return [
        { name: "Batch #1", available: 0, price: 0 },
      ];
    }

    return supplies.map((s, idx) => ({
      name: `${s.physical_state || "Gas"} (${s.purity_percentage || 98}%)`,
      available: Number(s.available_quantity) || 0,
      price: Number(s.asking_price) || 0,
    }));
  }, [supplies]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const metricsCards = [
    {
      label: "CO? Captured Available",
      value: `${stats.totalCaptured.toLocaleString()} tons`,
      icon: Package,
      change: `${supplies.length} listing${supplies.length === 1 ? "" : "s"}`,
    },
    {
      label: "CO? Sold",
      value: `${stats.totalSold.toLocaleString()} tons`,
      icon: TrendingUp,
      change: `${stats.utilizationRate}% utilized`,
    },
    {
      label: "Gross Revenue",
      value:
        stats.revenue > 100000
          ? `?${(stats.revenue / 100000).toFixed(2)}L`
          : `?${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
      change: "Settled contracts",
    },
    {
      label: "Active Buyers",
      value: stats.activeBuyers.toString(),
      icon: Users,
      change: "Commercial partners",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Welcome back, {company?.name ?? "Industrial Emitter"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time status of your industrial carbon capture and commercial listings.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/listings/new">
            <PlusCircle className="h-4 w-4 mr-1.5" />
            List New CO? Supply
          </Link>
        </Button>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsCards.map((m) => {
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
                <p className="text-muted-foreground text-xs mt-1">{m.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Extra stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unused Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.unusedCapacity.toLocaleString()} tons
            </div>
            <Progress value={stats.utilizationRate} className="mt-2 h-2" />
            <p className="text-muted-foreground text-xs mt-1">
              {stats.utilizationRate}% utilization rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Selling Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.avgSellingPrice > 0
                ? `?${stats.avgSellingPrice.toLocaleString()}/ton`
                : "?0/ton"}
            </div>
            <p className="text-muted-foreground text-xs mt-1">
              Calculated from current listings & contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Incoming Bids
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{recentBids.length}</div>
            <p className="text-muted-foreground text-xs mt-1">
              {recentBids.filter((b) => b.status === "PENDING").length} awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Supply Inventory & Pricing Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
                Live CO? Supply Batches: Volume vs Asking Price
              </CardTitle>
              <CardDescription>
                Interactive visualization of your listed batches from live database records
              </CardDescription>
            </div>
            <Badge variant="outline">Live Database</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            {supplies.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
                <Package className="h-8 w-8 stroke-1" />
                <p>No active CO? supply listings to graph yet.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/listings/new">Add First Listing</Link>
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(152, 60%, 42%)" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(38, 92%, 50%)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === "Available Volume (MT)" ? `${Number(val).toLocaleString()} MT` : `?${Number(val).toLocaleString()}/MT`,
                      name,
                    ]}
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Bar yAxisId="left" dataKey="available" name="Available Volume (MT)" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="price" name="Asking Price (?/MT)" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Supplies and Bids */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Listings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Your Active CO? Supplies</CardTitle>
              <CardDescription>Live listings visible on the marketplace</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/listings">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {supplies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-3">
                <Package className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No active CO? supply listings yet.</p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/listings/new">Create First Listing</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {supplies.slice(0, 4).map((s) => (
                  <div
                    key={s.supply_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {s.available_quantity} tons ({s.physical_state || "Gas"})
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Purity: {s.purity_percentage}% ? {s.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">?{s.asking_price}/t</div>
                      <Badge variant="outline" className="text-[10px]">
                        {s.status || "AVAILABLE"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bids */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Recent Bids & Negotiations</CardTitle>
              <CardDescription>Purchase offers from verified buyers</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/bids">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentBids.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <Clock className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No incoming bids received yet.</p>
                <p className="text-xs">
                  Offers placed by buyers on your listings will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBids.map((bid) => (
                  <div
                    key={bid.bid_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {bid.companies?.name || "Industrial Buyer"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {bid.quantity} tons ? ?{Number(bid.amount).toLocaleString()}/ton
                      </p>
                    </div>
                    <Badge
                      variant={
                        bid.status === "ACCEPTED"
                          ? "default"
                          : bid.status === "REJECTED"
                          ? "destructive"
                          : "outline"
                      }
                      className={
                        bid.status === "ACCEPTED"
                          ? "bg-emerald-600 text-white hover:bg-emerald-600"
                          : ""
                      }
                    >
                      {bid.status}
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
