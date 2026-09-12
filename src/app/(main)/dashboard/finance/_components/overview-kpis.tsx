"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export function OverviewKpis() {
  const { company } = useAuth();
  const [data, setData] = useState({ revenue: 0, spent: 0, activeCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!company) return;
      const supabase = createClient();
      
      const { data: contracts } = await supabase
        .from("contracts")
        .select("total_value, seller_id, buyer_id, status")
        .or(`seller_id.eq.${company.company_id},buyer_id.eq.${company.company_id}`);

      if (contracts) {
        let revenue = 0;
        let spent = 0;
        let activeCount = 0;

        contracts.forEach(c => {
          if (c.status === "ACTIVE") activeCount++;
          if (c.seller_id === company.company_id) {
            revenue += Number(c.total_value);
          } else if (c.buyer_id === company.company_id) {
            spent += Number(c.total_value);
          }
        });

        setData({ revenue, spent, activeCount });
      }
      setLoading(false);
    }
    fetchData();
  }, [company]);

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  const netBalance = data.revenue - data.spent;

  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <div className="grid grid-cols-1 xl:grid-cols-8">
        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-3xl leading-none tracking-tight">₹{data.revenue.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Income from CO₂ sales</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700">Earnings</Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 border-b ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Total Spent</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">₹{data.spent.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Expenses from CO₂ purchases</p>
            </div>
            <Badge className="bg-rose-500/10 text-rose-700">Expenses</Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 border-foreground/10 ring-0 xl:col-span-4 xl:border-r">
          <CardHeader>
            <CardTitle className="font-normal">Net Balance</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">₹{netBalance.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Overall financial position</p>
            </div>
            <Badge className={netBalance >= 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}>
              {netBalance >= 0 ? "Positive" : "Negative"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="gap-5 overflow-hidden rounded-none border-0 ring-0 xl:col-span-4">
          <CardHeader>
            <CardTitle className="font-normal">Active Contracts</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <div className="text-3xl leading-none tracking-tight">{data.activeCount}</div>
              <p className="text-muted-foreground text-xs">Currently ongoing agreements</p>
            </div>
            <Badge className="bg-blue-500/10 text-blue-700">Active</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
