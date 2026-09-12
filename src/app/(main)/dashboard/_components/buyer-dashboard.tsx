"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ShoppingBag, TrendingDown, Users, Truck, PlusCircle, ArrowRight, Package, BarChart3 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export function BuyerDashboard() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequired: 0,
    currentSuppliers: 0,
    avgPrice: 0,
    activeContracts: 0,
    upcomingDeliveries: 0,
    totalUtilized: 0,
  });
  const [demands, setDemands] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!company?.company_id) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();

        // 1. Fetch buyer's demand requests
        const { data: demandData } = await supabase
          .from("demand_requests")
          .select("*")
          .eq("buyer_id", company.company_id);

        const currentDemands = demandData || [];
        setDemands(currentDemands);

        // 2. Fetch contracts
        const { data: contractData } = await supabase
          .from("contracts")
          .select("*, companies:seller_id(name)")
          .eq("buyer_id", company.company_id);

        const currentContracts = contractData || [];
        setContracts(currentContracts);

        // 3. Fetch shipments
        const { data: shipmentData } = await supabase
          .from("shipments")
          .select("*, companies:supplier_id(name)")
          .eq("buyer_id", company.company_id)
          .order("created_at", { ascending: false });

        const currentShipments = shipmentData || [];
        setShipments(currentShipments);

        const totalReq = currentDemands.reduce(
          (sum, d) => sum + (parseFloat(d.required_quantity) || 0),
          0
        );
        const totalUtil = currentContracts.reduce(
          (sum, c) => sum + (parseFloat(c.quantity) || 0),
          0
        );
        const uniqueSuppliers = new Set(currentContracts.map((c) => c.seller_id)).size;
        const activeCtr = currentContracts.filter((c) => c.status === "ACTIVE").length;
        const upcoming = currentShipments.filter(
          (s) => s.status !== "DELIVERED" && s.status !== "VERIFIED"
        ).length;

        const avgPrice =
          currentContracts.length > 0
            ? Math.round(
                currentContracts.reduce(
                  (acc, c) => acc + (parseFloat(c.unit_price) || 0),
                  0
                ) / currentContracts.length
              )
            : currentDemands.length > 0
            ? Math.round(
                currentDemands.reduce(
                  (acc, d) => acc + (parseFloat(d.max_price) || 0),
                  0
                ) / currentDemands.length
              )
            : 0;

        setStats({
          totalRequired: totalReq,
          currentSuppliers: uniqueSuppliers,
          avgPrice: avgPrice,
          activeContracts: activeCtr,
          upcomingDeliveries: upcoming,
          totalUtilized: totalUtil,
        });
      } catch (err) {
        console.error("Failed to load buyer stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [company?.company_id]);

  const chartData = useMemo(() => {
    if (demands.length === 0) {
      return [{ name: "Demand #1", required: 0, maxPrice: 0 }];
    }
    return demands.map((d, idx) => ({
      name: `${d.application || "General"} (${d.required_purity || 95}%)`,
      required: Number(d.required_quantity) || 0,
      maxPrice: Number(d.max_price) || 0,
    }));
  }, [demands]);

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

  const metrics = [
    {
      label: "Total CO? Required",
      value: `${stats.totalRequired.toLocaleString()} tons`,
      icon: ShoppingBag,
      change: `${demands.length} active demand request${demands.length === 1 ? "" : "s"}`,
    },
    {
      label: "Contracted Offtake",
      value: `${stats.totalUtilized.toLocaleString()} tons`,
      icon: TrendingDown,
      change: `${stats.activeContracts} active contract${stats.activeContracts === 1 ? "" : "s"}`,
    },
    {
      label: "Average Price",
      value: stats.avgPrice > 0 ? `?${stats.avgPrice.toLocaleString()}/t` : "?0/t",
      icon: TrendingDown,
      change: "Procurement average",
    },
    {
      label: "Active Suppliers",
      value: stats.currentSuppliers.toString(),
      icon: Users,
      change: "Contracted partners",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Welcome back, {company?.name ?? "CO? Buyer"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track your industrial CO? requisitions, supplier matches, and shipment deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/marketplace">Browse Marketplace</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/demands">
              <PlusCircle className="h-4 w-4 mr-1.5" />
              Post New Demand
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-muted-foreground text-xs mt-1">{m.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.activeContracts}</div>
            <p className="text-muted-foreground text-xs mt-1">
              Legally binding bilateral agreements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Pending Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.upcomingDeliveries}</div>
            <p className="text-muted-foreground text-xs mt-1">
              In-transit or scheduled shipments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Demand Fulfillment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {stats.totalRequired > 0
                ? `${Math.min(
                    100,
                    Math.round((stats.totalUtilized / stats.totalRequired) * 100)
                  )}%`
                : "0%"}
            </div>
            <Progress
              value={
                stats.totalRequired > 0
                  ? Math.min(
                      100,
                      Math.round((stats.totalUtilized / stats.totalRequired) * 100)
                    )
                  : 0
              }
              className="mt-2 h-2"
            />
            <p className="text-muted-foreground text-xs mt-1">
              {stats.totalUtilized.toLocaleString()} of {stats.totalRequired.toLocaleString()}{" "}
              tons covered
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Demand Requirements & Price Ceiling Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Demand Specifications: Volume & Price Ceilings
              </CardTitle>
              <CardDescription>
                Visual comparison of your posted industrial requisitions and budget allocations
              </CardDescription>
            </div>
            <Badge variant="outline">Live Database</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            {demands.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm space-y-2">
                <ShoppingBag className="h-8 w-8 stroke-1" />
                <p>No active demand requests to graph yet.</p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/demands">Post First Demand</Link>
                </Button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" orientation="left" stroke="hsl(217, 91%, 60%)" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(152, 60%, 42%)" tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === "Required Volume (MT)" ? `${Number(val).toLocaleString()} MT` : `?${Number(val).toLocaleString()}/MT`,
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
                  <Bar yAxisId="left" dataKey="required" name="Required Volume (MT)" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="maxPrice" name="Max Price Budget (?/MT)" fill="hsl(152, 60%, 42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Demand Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Your Active Demand Requests</CardTitle>
              <CardDescription>Specifications posted to the marketplace</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/demands">
                Post Demand
                <PlusCircle className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {demands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-3">
                <ShoppingBag className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No active demand requests created yet.</p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/demands">Post Your First Demand</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {demands.slice(0, 4).map((d) => (
                  <div
                    key={d.request_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {d.required_quantity} tons ? Min {d.required_purity}% Purity
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {d.application || "Industrial Use"} ? {d.required_location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">Max ?{d.max_price}/t</div>
                      <Badge variant="outline" className="text-[10px]">
                        {d.status || "OPEN"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deliveries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Shipments & Tracking</CardTitle>
              <CardDescription>Real-time delivery progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/shipments">
                View All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <Truck className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No shipments currently scheduled.</p>
                <p className="text-xs">
                  When contracts are accepted, transport dispatches will track here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {shipments.slice(0, 4).map((s) => (
                  <div
                    key={s.shipment_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {s.companies?.name || "CO? Supplier"}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {s.quantity} tons ? {s.pickup_location} ? {s.destination}
                      </p>
                    </div>
                    <Badge variant="outline">{s.status?.replace("_", " ")}</Badge>
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
