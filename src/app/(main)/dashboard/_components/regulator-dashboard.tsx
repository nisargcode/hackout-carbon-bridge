"use client";

import { ShieldCheck, ReceiptText, AlertCircle, BarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useAuth } from "@/contexts/auth-context";

const volumeData = [
  { month: "Apr", volume: 1200 },
  { month: "May", volume: 1800 },
  { month: "Jun", volume: 2200 },
  { month: "Jul", volume: 1900 },
  { month: "Aug", volume: 2600 },
  { month: "Sep", volume: 3100 },
];

const chartConfig = {
  volume: { label: "Volume (tons)", color: "var(--chart-1)" },
};

const recentTransactions = [
  { id: "TX-001", seller: "Steel Corp", buyer: "GreenFuel", qty: "200 tons", amount: "₹8.4L", verified: true },
  { id: "TX-002", seller: "PowerGen", buyer: "AlgaeTech", qty: "150 tons", amount: "₹5.7L", verified: true },
  { id: "TX-003", seller: "CementCo", buyer: "CarbonMat", qty: "500 tons", amount: "₹22.5L", verified: false },
];

export function RegulatorDashboard() {
  const { company } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">
          Regulatory Overview
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor all CO₂ transactions and compliance status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Transactions", value: "284", icon: ReceiptText },
          { label: "Verified Certs", value: "231", icon: ShieldCheck },
          { label: "Pending Review", value: "12", icon: AlertCircle },
          { label: "CO₂ Tracked", value: "48,200 tons", icon: BarChart2 },
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
        <Card>
          <CardHeader>
            <CardTitle>CO₂ Trade Volume</CardTitle>
            <CardDescription>Monthly volume in tons</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[220px] w-full">
              <LineChart data={volumeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="volume" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>All marketplace transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{tx.seller} → {tx.buyer}</p>
                    <p className="text-muted-foreground text-xs">
                      {tx.qty} · {tx.amount}
                    </p>
                  </div>
                  <Badge variant={tx.verified ? "default" : "outline"}>
                    {tx.verified ? "Verified" : "Pending"}
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
