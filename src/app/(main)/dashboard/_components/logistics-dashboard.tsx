"use client";

import { Forklift, MapPin, DollarSign, Package, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

const availableJobs = [
  {
    id: "J001",
    pickup: "Mumbai, MH",
    destination: "Pune, MH",
    quantity: "200 tons",
    deadline: "Sep 20",
    payment: "₹38,000",
    vehicle: "Cryogenic Tanker",
  },
  {
    id: "J002",
    pickup: "Surat, GJ",
    destination: "Ahmedabad, GJ",
    quantity: "350 tons",
    deadline: "Sep 23",
    payment: "₹55,000",
    vehicle: "Pressurized Tanker",
  },
  {
    id: "J003",
    pickup: "Chennai, TN",
    destination: "Bangalore, KA",
    quantity: "150 tons",
    deadline: "Sep 25",
    payment: "₹32,000",
    vehicle: "Cryogenic Tanker",
  },
];

const activeShipments = [
  { id: "S001", route: "Mumbai → Pune", status: "IN_TRANSIT", progress: 65 },
  { id: "S002", route: "Delhi → Noida", status: "PICKED_UP", progress: 20 },
];

export function LogisticsDashboard() {
  const { company } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">
          Welcome back, {company?.name ?? "Logistics Provider"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse shipment jobs and manage your active routes.
        </p>
      </div>

      {/* Overview metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active Routes", value: "2", icon: MapPin },
          { label: "Completed Jobs", value: "47", icon: CheckCircle },
          { label: "Monthly Revenue", value: "₹3.2L", icon: DollarSign },
          { label: "Available Jobs", value: "3", icon: Package },
        ].map((m) => {
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
          <CardHeader>
            <CardTitle>Available Jobs</CardTitle>
            <CardDescription>Bid on CO₂ transportation jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {availableJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {job.pickup} → {job.destination}
                      </p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {job.quantity} · {job.vehicle}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {job.payment}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground text-xs">
                      Deadline: {job.deadline}
                    </p>
                    <Button size="sm" variant="outline">
                      Place Bid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active shipments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Forklift className="h-4 w-4" />
              Active Shipments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeShipments.map((s) => (
                <div key={s.id} className="rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{s.route}</p>
                    <Badge>{s.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs">{s.progress}% complete</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
