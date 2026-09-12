"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Forklift, MapPin, DollarSign, Package, CheckCircle, ArrowRight, Truck, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export function LogisticsDashboard() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [activeShipments, setActiveShipments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeRoutes: 0,
    completedJobs: 0,
    revenue: 0,
    availableJobsCount: 0,
  });

  useEffect(() => {
    async function loadData() {
      if (!company?.company_id) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();

        // 1. Available jobs (unassigned shipments)
        const { data: openJobs } = await supabase
          .from("shipments")
          .select("*, supplier:companies!supplier_id(name), buyer:companies!buyer_id(name)")
          .is("logistics_provider_id", null)
          .order("created_at", { ascending: false });

        const jobs = openJobs || [];
        setAvailableJobs(jobs);

        // 2. Active / assigned shipments for this carrier
        const { data: myShipments } = await supabase
          .from("shipments")
          .select("*, supplier:companies!supplier_id(name), buyer:companies!buyer_id(name)")
          .eq("logistics_provider_id", company.company_id)
          .order("created_at", { ascending: false });

        const assigned = myShipments || [];
        setActiveShipments(assigned);

        const activeCount = assigned.filter((s) => s.status !== "DELIVERED" && s.status !== "VERIFIED").length;
        const completedCount = assigned.filter((s) => s.status === "DELIVERED" || s.status === "VERIFIED").length;
        const totalRev = assigned
          .filter((s) => s.status === "DELIVERED" || s.status === "VERIFIED")
          .reduce((sum, s) => sum + (parseFloat(s.transportation_cost) || 0), 0);

        setStats({
          activeRoutes: activeCount,
          completedJobs: completedCount,
          revenue: totalRev,
          availableJobsCount: jobs.length,
        });
      } catch (err) {
        console.error("Failed to load logistics stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [company?.company_id]);

  const chartData = useMemo(() => {
    const list = activeShipments.length > 0 ? activeShipments : availableJobs;
    if (list.length === 0) {
      return [{ route: "Corridor #1", quantity: 0, cost: 0 }];
    }
    return list.slice(0, 5).map((s) => ({
      route: `${s.pickup_location?.split(",")[0] || "Origin"} ? ${s.destination?.split(",")[0] || "Dest"}`,
      quantity: Number(s.quantity) || 0,
      cost: Math.round((Number(s.transportation_cost) || 0) / 1000), // In thousands
    }));
  }, [activeShipments, availableJobs]);

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
    { label: "Active Routes", value: stats.activeRoutes.toString(), icon: MapPin },
    { label: "Completed Jobs", value: stats.completedJobs.toString(), icon: CheckCircle },
    {
      label: "Gross Freight Revenue",
      value: stats.revenue > 100000 ? `?${(stats.revenue / 100000).toFixed(2)}L` : `?${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
    },
    { label: "Open Transport Jobs", value: stats.availableJobsCount.toString(), icon: Forklift },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Welcome back, {company?.name ?? "Logistics Provider"}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Dispatch cryogenic fleet assets, bid on industrial transport tenders, and monitor hazmat compliance.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs">
            <Forklift className="h-4 w-4 mr-1.5" />
            Find CO? Transport Jobs
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{m.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Interactive Freight Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                Freight Volume (MT) & Tariff (? Thousands) by Corridor
              </CardTitle>
              <CardDescription>
                Live payload tonnage and billing breakdown from active shipment manifests
              </CardDescription>
            </div>
            <Badge variant="outline">Telemetry Active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="route" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" orientation="left" stroke="hsl(217, 91%, 60%)" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(152, 60%, 42%)" tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === "Payload (MT)"
                      ? `${Number(val).toLocaleString()} MT`
                      : `?${Number(val * 1000).toLocaleString()}`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar
                  yAxisId="left"
                  dataKey="quantity"
                  name="Payload (MT)"
                  fill="hsl(217, 91%, 60%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="cost"
                  name="Tariff (? Thousands)"
                  fill="hsl(152, 60%, 42%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Open Bidding Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Open Transport Jobs</CardTitle>
              <CardDescription>Industrial shipments requiring logistics assignment</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/jobs">
                Job Board
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {availableJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <Package className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No unassigned shipments currently waiting.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableJobs.slice(0, 4).map((j) => (
                  <div
                    key={j.shipment_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {j.pickup_location} ? {j.destination}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {j.quantity} tons ? Distance: {j.estimated_distance_km || 150} km
                      </p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/dashboard/jobs">Place Bid</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Fleet Dispatches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Assigned Missions</CardTitle>
              <CardDescription>Cryogenic assets currently on active routes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/shipments">
                Track
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activeShipments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <Truck className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No active dispatches currently assigned to your company.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeShipments.slice(0, 4).map((s) => (
                  <div
                    key={s.shipment_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {s.pickup_location} ? {s.destination}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {s.quantity} tons ? Cost: ?{Number(s.transportation_cost || 0).toLocaleString()}
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
