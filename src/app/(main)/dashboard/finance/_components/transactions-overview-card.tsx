"use client";

import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

const formatTooltipCurrency = (value: number | string) => formatCurrency(Number(value), { noDecimals: true });

const chartConfig = {
  expense: {
    color: "var(--chart-4)",
    label: "Expense",
  },
  income: {
    color: "var(--chart-2)",
    label: "Income",
  },
} satisfies ChartConfig;

type TimeRange = "weekly" | "monthly" | "yearly";

function getDaysForRange(range: TimeRange): number {
  switch (range) {
    case "weekly": return 7;
    case "monthly": return 30;
    case "yearly": return 365;
  }
}

function formatLabel(date: string, range: TimeRange): string {
  const d = new Date(date);
  switch (range) {
    case "weekly":
      return d.toLocaleDateString("en-US", { weekday: "short" });
    case "monthly":
      return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    case "yearly":
      return d.toLocaleDateString("en-US", { month: "short" });
  }
}

function groupDataByRange(
  contracts: any[],
  companyId: string,
  range: TimeRange,
) {
  const days = getDaysForRange(range);
  const grouped: Record<string, { income: number; expense: number }> = {};

  if (range === "yearly") {
    // Group by month for yearly view
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      grouped[key] = { income: 0, expense: 0 };
    }

    contracts.forEach((contract) => {
      const d = new Date(contract.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };

      if (contract.seller_id === companyId) {
        grouped[key].income += Number(contract.total_value);
      } else if (contract.buyer_id === companyId) {
        grouped[key].expense += Number(contract.total_value);
      }
    });

    return Object.keys(grouped)
      .sort()
      .map((key) => ({
        date: key,
        timestamp: Date.parse(`${key}-01`),
        income: grouped[key].income,
        expense: grouped[key].expense,
        label: new Date(`${key}-01`).toLocaleDateString("en-US", { month: "short" }),
      }));
  }

  // Weekly or monthly — group by day
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    grouped[dateStr] = { income: 0, expense: 0 };
  }

  contracts.forEach((contract) => {
    const dateStr = new Date(contract.created_at).toISOString().split("T")[0];
    if (!grouped[dateStr]) return; // Outside range
    if (contract.seller_id === companyId) {
      grouped[dateStr].income += Number(contract.total_value);
    } else if (contract.buyer_id === companyId) {
      grouped[dateStr].expense += Number(contract.total_value);
    }
  });

  return Object.keys(grouped)
    .sort()
    .map((date) => ({
      date,
      timestamp: Date.parse(date),
      income: grouped[date].income,
      expense: grouped[date].expense,
      label: formatLabel(date, range),
    }));
}

export function TransactionsOverviewCard() {
  const { company } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");

  useEffect(() => {
    async function fetchData() {
      if (!company) return;
      setLoading(true);
      const supabase = createClient();

      // Determine date cutoff based on selected range
      const days = getDaysForRange(timeRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffStr = cutoffDate.toISOString();

      const { data } = await supabase
        .from("contracts")
        .select("total_value, seller_id, buyer_id, created_at")
        .or(`seller_id.eq.${company.company_id},buyer_id.eq.${company.company_id}`)
        .gte("created_at", cutoffStr)
        .order("created_at", { ascending: true });

      if (data) {
        const formatted = groupDataByRange(data, company.company_id, timeRange);
        setChartData(formatted);
      }
      setLoading(false);
    }
    fetchData();
  }, [company, timeRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Spending Overview</CardTitle>
        <CardAction>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-28" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>

      <CardContent>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
            No transaction data available
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-50 w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="label"
                tickLine={false}
                tickMargin={10}
                tick={{ fontSize: 12 }}
              />
              <YAxis hide axisLine={false} tickLine={false} tickMargin={10} tick={{ fontSize: 12 }} />
              <ChartTooltip
                cursor={false}
                content={({ active, payload, label }) => (
                  <ChartTooltipContent
                    active={active}
                    hideLabel
                    label={label}
                    payload={payload?.map((item) => ({
                      ...item,
                      value: typeof item.value === "number" ? formatTooltipCurrency(item.value) : item.value,
                    }))}
                  />
                )}
              />
              <Line
                dataKey="income"
                dot={true}
                stroke="var(--color-income)"
                strokeDasharray="5 5"
                strokeLinecap="round"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                dataKey="expense"
                dot={true}
                stroke="var(--color-expense)"
                strokeLinecap="round"
                strokeWidth={3}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
