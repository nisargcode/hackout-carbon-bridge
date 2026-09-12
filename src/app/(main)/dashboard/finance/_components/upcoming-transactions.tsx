"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ChevronRight, FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export function UpcomingTransactions() {
  const { company } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!company) return;
      const supabase = createClient();
      
      const { data } = await supabase
        .from("contracts")
        .select("*, buyer:companies!buyer_id(name), seller:companies!seller_id(name)")
        .or(`seller_id.eq.${company.company_id},buyer_id.eq.${company.company_id}`)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(3);

      if (data) setContracts(data);
      setLoading(false);
    }
    fetchData();
  }, [company]);

  if (loading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  const totalActiveValue = contracts.reduce((sum, c) => sum + Number(c.total_value), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal">Active Contracts & Deliveries</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-baseline text-3xl leading-none tracking-tight">
              <span className="font-normal">Rs. {totalActiveValue.toLocaleString()}</span>
            </h2>
            <p className="text-muted-foreground text-sm leading-none">
              Value of <span className="font-medium text-foreground">{contracts.length}</span> recently active contracts
            </p>
          </div>
        </div>

        <ItemGroup>
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No active contracts right now.</p>
          ) : (
            contracts.map((c) => {
              const buyer: any = c.buyer;
              const seller: any = c.seller;
              const buyerName = (Array.isArray(buyer) ? buyer[0]?.name : buyer?.name) || "Unknown Buyer";
              const sellerName = (Array.isArray(seller) ? seller[0]?.name : seller?.name) || "Unknown Seller";

              return (
              <Link href="/dashboard/contracts" key={c.contract_id}>
                <Item variant="outline" size="xs" className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <ItemMedia>
                    <div className="grid size-9 place-items-center rounded-md border bg-background">
                      <FileText className="size-4 text-muted-foreground" />
                    </div>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      {c.seller_id === company?.company_id 
                        ? `Delivery to ${buyerName}` 
                        : `Receipt from ${sellerName}`}
                    </ItemTitle>
                    <ItemDescription>
                      Rs. {Number(c.total_value).toLocaleString()} · {c.quantity} tons
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <ChevronRight className="size-5 text-muted-foreground" />
                  </ItemActions>
                </Item>
              </Link>
            )})
          )}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
