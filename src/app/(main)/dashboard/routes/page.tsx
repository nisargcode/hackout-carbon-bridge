"use client";

import { useEffect, useState } from "react";
import { MapPin, Navigation, Fuel, Clock, ArrowRight, RefreshCw, Truck, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

interface ShipmentRouteItem {
  shipment_id: string;
  quantity: number;
  pickup_location: string;
  destination: string;
  route: any;
  estimated_distance_km: number;
  transportation_cost: number;
  status: string;
  supplier?: { name: string };
  buyer?: { name: string };
  carrier?: { name: string };
}

export default function RoutesPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shipments, setShipments] = useState<ShipmentRouteItem[]>([]);

  async function loadRoutes() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shipments")
        .select(
          "*, supplier:companies!supplier_id(name), buyer:companies!buyer_id(name), carrier:companies!logistics_provider_id(name)",
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shipment routes:", error);
      } else {
        setShipments(data || []);
      }
    } catch (err) {
      console.error("Failed to load shipment routes:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRoutes();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Route Optimization & Hazmat Telemetry</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live corridor tracking for cryogenic and pressurized CO? transport adhering to CCOE and hazardous cargo
            standards.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Syncing..." : "Refresh Corridors"}
        </Button>
      </div>

      {shipments.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl space-y-3 bg-muted/10">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground stroke-1" />
          <h3 className="font-semibold text-base">No active shipment corridors</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            When contracts are executed and transport orders are generated, cryogenic route telemetry and hazmat
            waypoints will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {shipments.map((s) => {
            const waypoints = Array.isArray(s.route?.waypoints)
              ? s.route.waypoints.join(" ? ")
              : "Direct Industrial Corridor";
            const isDelivered = s.status === "DELIVERED" || s.status === "VERIFIED";

            return (
              <Card key={s.shipment_id} className="border border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold">
                      {s.pickup_location} ? {s.destination}
                    </CardTitle>
                    <Badge
                      variant={isDelivered ? "default" : "outline"}
                      className={
                        s.status === "IN_TRANSIT"
                          ? "bg-blue-600 text-white"
                          : isDelivered
                            ? "bg-emerald-600 text-white"
                            : ""
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Distance: {s.estimated_distance_km ? `${s.estimated_distance_km} km` : "150 km"} ? Cargo:{" "}
                    {s.quantity} MT CO?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>
                        <strong>Origin:</strong> {s.supplier?.name || "Supplier Terminal"} ({s.pickup_location})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Navigation className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>
                        <strong>Transit Path:</strong> {waypoints}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Destination:</strong> {s.buyer?.name || "Offtake Facility"} ({s.destination})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 border rounded bg-background">
                      <span className="text-muted-foreground block text-[10px]">Carrier Assigned</span>
                      <strong className="text-foreground">{s.carrier?.name || "CryoTrans Fleet"}</strong>
                    </div>
                    <div className="p-2 border rounded bg-background">
                      <span className="text-muted-foreground block text-[10px]">Logistics Tariff</span>
                      <strong className="text-foreground">
                        ?{Number(s.transportation_cost || 0).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
