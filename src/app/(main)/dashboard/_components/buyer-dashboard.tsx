"use client";

import { ShoppingBag, TrendingDown, Users, Truck, BarChart2, Leaf } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";

const chartData = [
  { month: "Apr", utilized: 310, required: 400 },
  { month: "May", utilized: 350, required: 420 },
  { month: "Jun", utilized: 400, required: 430 },
  { month: "Jul", utilized: 370, required: 440 },
  { month: "Aug", utilized: 420, required: 450 },
  { month: "Sep", utilized: 460, required: 480 },
];

const chartConfig = {
  utilized: { label: "Utilized", color: "var(--chart-1)" },
  required: { label: "Required", color: "var(--chart-3)" },
};

const metrics = [
  { label: "CO₂ Required", value: "2,400 tons", icon: ShoppingBag, change: "+5%" },
  { label: "Current Suppliers", value: "8", icon: Users, change: "+1" },
  { label: "Avg Price", value: "₹4,100/ton", icon: TrendingDown, change: "-3%" },
  { label: "Cost Savings", value: "₹12.4L", icon: Leaf, change: "+18%" },
];

const upcomingDeliveries = [
  { supplier: "Steel Corp", quantity: "300 tons", eta: "Sep 15", status: "IN_TRANSIT" },
  { supplier: "PowerGen Ltd.", quantity: "200 tons", eta: "Sep 18", status: "BOOKED" },
  { supplier: "CementCo", quantity: "150 tons", eta: "Sep 22", status: "MATCHED" },
];

const supplierRatings = [
  { name: "Steel Corp", reliability: 96, quality: 98, delivery: 94 },
  { name: "PowerGen Ltd.", reliability: 92, quality: 95, delivery: 90 },
  { name: "CementCo", reliability: 88, quality: 91, delivery: 86 },
];

export function BuyerDashboard() {
  const { company } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">
          Welcome back, {company?.name ?? "Buyer"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track your CO₂ procurement and upcoming deliveries.
        </p>
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
                <p className="text-muted-foreground text-xs mt-1">
                  <span className="text-green-600 font-medium">{m.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">6</div>
            <p className="text-muted-foreground text-xs mt-1">3 long-term, 3 spot</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Upcoming Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">3</div>
            <p className="text-muted-foreground text-xs mt-1">Next: Sep 15</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">2,110 tons</div>
            <Progress value={88} className="mt-2 h-2" />
            <p className="text-muted-foreground text-xs mt-1">88% of requirement</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Utilization</CardTitle>
            <CardDescription>Required vs Utilized (tons)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="utilized" fill="var(--chart-1)" radius={4} />
                <Bar dataKey="required" fill="var(--chart-3)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingDeliveries.map((d) => (
                  <div
                    key={d.supplier}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{d.supplier}</p>
                      <p className="text-muted-foreground text-xs">
                        {d.quantity} · ETA {d.eta}
                      </p>
                    </div>
                    <Badge variant="outline">{d.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supplier Ratings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supplierRatings.map((s) => (
                  <div key={s.name} className="space-y-1">
                    <p className="font-medium text-sm">{s.name}</p>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <p>Reliability</p>
                        <Progress value={s.reliability} className="h-1 mt-1" />
                        <p className="mt-0.5">{s.reliability}%</p>
                      </div>
                      <div>
                        <p>Quality</p>
                        <Progress value={s.quality} className="h-1 mt-1" />
                        <p className="mt-0.5">{s.quality}%</p>
                      </div>
                      <div>
                        <p>Delivery</p>
                        <Progress value={s.delivery} className="h-1 mt-1" />
                        <p className="mt-0.5">{s.delivery}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
