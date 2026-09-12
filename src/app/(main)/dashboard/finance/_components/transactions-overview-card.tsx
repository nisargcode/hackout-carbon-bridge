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

export function TransactionsOverviewCard() {
  const { company } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!company) return;
      const supabase = createClient();
      
      // Fetch all contracts where the company is either buyer (expense) or seller (income)
      const { data } = await supabase
        .from("contracts")
        .select("total_value, seller_id, buyer_id, created_at")
        .or(`seller_id.eq.${company.company_id},buyer_id.eq.${company.company_id}`)
        .order("created_at", { ascending: true });

      if (data) {
        // Group by Date (YYYY-MM-DD)
        const grouped: Record<string, { income: number; expense: number }> = {};
        
        // Generate last 7 days of dates to ensure we have a full week even if no data
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];
          grouped[dateStr] = { income: 0, expense: 0 };
        }

        data.forEach((contract) => {
          const dateStr = new Date(contract.created_at).toISOString().split("T")[0];
          if (!grouped[dateStr]) grouped[dateStr] = { income: 0, expense: 0 };
          
          if (contract.seller_id === company.company_id) {
            grouped[dateStr].income += Number(contract.total_value);
          } else if (contract.buyer_id === company.company_id) {
            grouped[dateStr].expense += Number(contract.total_value);
          }
        });

        // Convert grouped object to array format for Recharts
        const formattedData = Object.keys(grouped).sort().map(date => {
          return {
            date,
            timestamp: Date.parse(date),
            income: grouped[date].income,
            expense: grouped[date].expense,
            label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
          };
        });

        setChartData(formattedData);
      }
      setLoading(false);
    }
    fetchData();
  }, [company]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Spending Overview</CardTitle>
        <CardAction>
          <Select defaultValue="weekly">
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
