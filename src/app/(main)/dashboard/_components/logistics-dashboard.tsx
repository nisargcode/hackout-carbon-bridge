"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Forklift, MapPin, DollarSign, Package, CheckCircle, ArrowRight } from "lucide-react";
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
          .select("*, supplier:supplier_id(name), buyer:buyer_id(name)")
          .is("logistics_provider", null)
          .order("created_at", { ascending: false });

        const jobs = openJobs || [];
        setAvailableJobs(jobs);

        // 2. Active / assigned shipments for this carrier
        const { data: myShipments } = await supabase
          .from("shipments")
          .select("*, supplier:supplier_id(name), buyer:buyer_id(name)")
          .eq("logistics_provider", company.company_id)
          .order("created_at", { ascending: false });

        const assigned = myShipments || [];
        setActiveShipments(assigned);

        const activeCount = assigned.filter(
          (s) => s.status !== "DELIVERED" && s.status !== "VERIFIED"
        ).length;
        const completedCount = assigned.filter(
          (s) => s.status === "DELIVERED" || s.status === "VERIFIED"
        ).length;
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
      value:
        stats.revenue > 100000
          ? `₹${(stats.revenue / 100000).toFixed(2)}L`
          : `₹${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
    },
    { label: "Available Haul Jobs", value: stats.availableJobsCount.toString(), icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">
            Welcome back, {company?.name ?? "Logistics Provider"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse available CO₂ hauling jobs, dispatch cryogenic tankers, and manage routes.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs">
            View All Job Opportunities
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* Overview metrics */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job board */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Open Transportation Jobs</CardTitle>
              <CardDescription>Available industrial CO₂ loads needing carriers</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/jobs">
                Browse All
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {availableJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground space-y-2">
                <Package className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No open transportation jobs at the moment.</p>
                <p className="text-xs">
                  When new trades are executed, shipments requiring transport will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableJobs.slice(0, 4).map((job) => (
                  <div
                    key={job.shipment_id}
                    className="rounded-lg border border-border p-3.5 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {job.pickup_location} → {job.destination}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {job.quantity} tons · Estimated distance: {job.estimated_distance || 150} km
                        </p>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600 font-semibold">
                        ₹{job.transportation_cost ? Number(job.transportation_cost).toLocaleString() : "Quote"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">
                        ETA Target: {job.estimated_delivery ? new Date(job.estimated_delivery).toLocaleDateString() : "Flexible"}
                      </span>
                      <Button size="sm" asChild>
                        <Link href="/dashboard/jobs">Place Carrier Bid</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active shipments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Forklift className="h-4 w-4" />
                Your Assigned Shipments
              </CardTitle>
              <CardDescription>Active transport routes in your fleet</CardDescription>
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
                <Forklift className="h-8 w-8 mx-auto stroke-1" />
                <p className="text-sm">No active shipments currently assigned.</p>
                <p className="text-xs">
                  Bid on open jobs to win transportation routes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeShipments.slice(0, 4).map((s) => (
                  <div key={s.shipment_id} className="rounded-lg border border-border p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {s.pickup_location} → {s.destination}
                      </p>
                      <Badge>{s.status?.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {s.quantity} tons · Revenue: ₹{Number(s.transportation_cost || 0).toLocaleString()}
                    </p>
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
