"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export function IncomeBreakdown() {
  const { company } = useAuth();
  const [sources, setSources] = useState<{name: string, amount: number, percentage: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!company) return;
      const supabase = createClient();
      
      const { data } = await supabase
        .from("contracts")
        .select("total_value, buyer:companies!buyer_id(name)")
        .eq("seller_id", company.company_id);

      if (data) {
        let total = 0;
        const buyerMap: Record<string, number> = {};
        
        data.forEach(c => {
          const val = Number(c.total_value);
          const name = c.buyer?.name || "Unknown Buyer";
          buyerMap[name] = (buyerMap[name] || 0) + val;
          total += val;
        });

        const sorted = Object.entries(buyerMap)
          .map(([name, amount]) => ({
            name,
            amount,
            percentage: total > 0 ? Math.round((amount / total) * 100) : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 3); // top 3

        setSources(sorted);
      }
      setLoading(false);
    }
    fetchData();
  }, [company]);

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Top Income Sources</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-3">
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground col-span-3 py-4 text-center">No income data available yet.</p>
        ) : (
          sources.map((s, idx) => (
            <section key={s.name} className="isolate flex gap-[0.5px]">
              <Separator
                orientation="vertical"
                className="mb-1 h-auto self-auto border-muted-foreground/50 border-l border-dashed bg-transparent"
              />
              <div className="flex min-h-24 flex-1 flex-col justify-between">
                <div className="flex min-w-0 flex-col gap-1 px-1">
                  <p className="wrap-break-word text-muted-foreground text-xs leading-none truncate pr-2">
                    {s.name} · {s.percentage}%
                  </p>
                  <div className="text-lg leading-none tracking-tight">₹{s.amount.toLocaleString()}</div>
                </div>
                <div 
                  className="-ml-0.5 h-5 rounded-sm" 
                  style={{ backgroundColor: `hsl(var(--chart-${idx + 1}))`, opacity: 1 - (idx * 0.2) }}
                />
              </div>
            </section>
          ))
        )}
      </CardContent>
    </Card>
  );
}
