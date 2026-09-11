"use client";

import { Package, DollarSign, Users, BarChart2, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "@/contexts/auth-context";

const chartData = [
  { month: "Apr", captured: 420, sold: 380 },
  { month: "May", captured: 480, sold: 420 },
  { month: "Jun", captured: 510, sold: 460 },
  { month: "Jul", captured: 490, sold: 450 },
  { month: "Aug", captured: 550, sold: 500 },
  { month: "Sep", captured: 600, sold: 540 },
];

const chartConfig = {
  captured: { label: "Captured", color: "var(--chart-1)" },
  sold: { label: "Sold", color: "var(--chart-2)" },
};

const metrics = [
  { label: "CO₂ Captured", value: "4,500 tons", icon: Package, change: "+12%" },
  { label: "CO₂ Sold", value: "3,700 tons", icon: TrendingUp, change: "+8%" },
  { label: "Revenue", value: "₹1.57 Cr", icon: DollarSign, change: "+15%" },
  { label: "Active Buyers", value: "12", icon: Users, change: "+2" },
];

const recentBids = [
  { company: "GreenFuel Inc.", quantity: "200 tons", price: "₹4,200/t", status: "PENDING" },
  { company: "AlgaeTech", quantity: "150 tons", price: "₹3,800/t", status: "ACCEPTED" },
  { company: "CarbonMat", quantity: "500 tons", price: "₹4,500/t", status: "PENDING" },
];

export function EmitterDashboard() {
  const { company } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="font-bold text-2xl text-foreground">
          Welcome back, {company?.name ?? "Company"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's an overview of your CO₂ supply performance.
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

      {/* Extra stats row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unused Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">800 tons</div>
            <Progress value={82} className="mt-2 h-2" />
            <p className="text-muted-foreground text-xs mt-1">82% utilization rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Selling Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">₹4,243/ton</div>
            <p className="text-muted-foreground text-xs mt-1">
              <span className="text-green-600 font-medium">+5%</span> vs market average
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">5</div>
            <p className="text-muted-foreground text-xs mt-1">3 high-priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart + Recent Bids */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Captured vs Sold</CardTitle>
            <CardDescription>Last 6 months (tons)</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="captured"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="sold"
                  stroke="var(--chart-2)"
                  fill="var(--chart-2)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Bids</CardTitle>
            <CardDescription>Incoming purchase requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentBids.map((bid) => (
                <div
                  key={bid.company}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{bid.company}</p>
                    <p className="text-muted-foreground text-xs">
                      {bid.quantity} · {bid.price}
                    </p>
                  </div>
                  <Badge
                    variant={bid.status === "ACCEPTED" ? "default" : "outline"}
                  >
                    {bid.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
