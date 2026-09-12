"use client";

import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

type ContractKey = "spot" | "long_term" | "other";

const chartConfig = {
  amount: {
    label: "Value",
  },
  spot: {
    color: "var(--chart-1)",
    label: "Spot Contracts",
  },
  long_term: {
    color: "var(--chart-2)",
    label: "Long-Term Contracts",
  },
  other: {
    color: "var(--chart-3)",
    label: "Other Agreements",
  },
} satisfies ChartConfig;

export function BalanceDistributionCard() {
  const { company } = useAuth();
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [totalValue, setTotalValue] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      if (!company) return;
      const supabase = createClient();
      
      const { data } = await supabase
        .from("contracts")
        .select("total_value, contract_type")
        .or(`seller_id.eq.${company.company_id},buyer_id.eq.${company.company_id}`);

      if (data) {
        let total = 0;
        let spot = 0;
        let longTerm = 0;
        let other = 0;

        data.forEach(c => {
          const val = Number(c.total_value);
          total += val;
          if (c.contract_type === "SPOT") spot += val;
          else if (c.contract_type === "LONG_TERM") longTerm += val;
          else other += val;
        });

        setTotalValue(total);

        const buildData = [];
        if (spot > 0) buildData.push({ account: "Spot Contracts", amount: spot, key: "spot", percentage: Math.round((spot / total) * 100), fill: "var(--chart-1)" });
        if (longTerm > 0) buildData.push({ account: "Long-Term Contracts", amount: longTerm, key: "long_term", percentage: Math.round((longTerm / total) * 100), fill: "var(--chart-2)" });
        if (other > 0) buildData.push({ account: "Other Agreements", amount: other, key: "other", percentage: Math.round((other / total) * 100), fill: "var(--chart-3)" });
        
        setChartData(buildData);
      }
      setLoading(false);
    }
    fetchData();
  }, [company]);

  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Contract Type Distribution</CardTitle>
      </CardHeader>

      <CardContent className="grid items-center gap-4 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 col-span-2 text-center">No contract data available.</p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-50">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel className="w-52" nameKey="account" />}
                />
                <Pie
                  cornerRadius={6}
                  data={chartData}
                  dataKey="amount"
                  innerRadius={65}
                  nameKey="account"
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (!(viewBox && "cx" in viewBox && "cy" in viewBox)) {
                        return null;
                      }

                      return (
                        <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                          <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={(viewBox.cy ?? 0) - 8}>
                            Total Value
                          </tspan>
                          <tspan
                            className="fill-foreground font-medium text-lg tabular-nums"
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 14}
                          >
                            Rs. {totalValue >= 1000000 ? (totalValue/1000000).toFixed(1) + 'M' : totalValue >= 1000 ? (totalValue/1000).toFixed(1) + 'k' : totalValue}
                          </tspan>
                        </text>
                      );
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>

            <div className="flex min-w-0 flex-col gap-3">
              {chartData.map((item) => (
                <div className="grid grid-cols-[1fr_auto] items-end gap-3" key={item.key}>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1">
                      <span aria-hidden="true" className="h-2 w-1 rounded-full" style={{ backgroundColor: item.fill }} />
                      <p className="truncate text-muted-foreground text-xs">{item.account}</p>
                    </div>
                    <p className="font-medium tabular-nums">
                      Rs. {item.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="font-medium tabular-nums">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
