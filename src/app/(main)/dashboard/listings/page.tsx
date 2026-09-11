"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { CO2Supply } from "@/types";

export default function ListingsPage() {
  const [listings, setListings] = useState<CO2Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const { company } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!company) return;
    supabase
      .from("co2_supplies")
      .select("*")
      .eq("emitter_id", company.company_id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setListings(data ?? []);
        setLoading(false);
      });
  }, [company]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">My Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your CO₂ supply listings on the marketplace.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Supply
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg">No listings yet</CardTitle>
          <CardDescription className="mt-2 mb-6">
            Create your first CO₂ supply listing to start receiving bids.
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/listings/new">Create Listing</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((l) => (
            <Card key={l.supply_id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{l.source_industry}</CardTitle>
                    <CardDescription>{l.location}</CardDescription>
                  </div>
                  <Badge
                    variant={l.status === "ACTIVE" ? "default" : "outline"}
                  >
                    {l.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="font-medium">{l.available_quantity} {l.quantity_unit}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Purity</p>
                    <p className="font-medium">{l.purity_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Price</p>
                    <p className="font-medium">₹{l.asking_price.toLocaleString()}/t</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{l.physical_state} · {l.capture_method}</span>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href={`/dashboard/listings/${l.supply_id}`}>
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
