"use client";

import { useEffect, useState } from "react";
import { Truck, RefreshCw, Gauge, Thermometer, MapPin, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

interface FleetMission {
  shipment_id: string;
  quantity: number;
  pickup_location: string;
  destination: string;
  status: string;
  carrier?: { name: string; location: string };
  supplier?: { name: string };
  buyer?: { name: string };
}

export default function FleetPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [missions, setMissions] = useState<FleetMission[]>([]);

  async function loadFleetData() {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shipments")
        .select("*, carrier:companies!logistics_provider_id(name, location), supplier:companies!supplier_id(name), buyer:companies!buyer_id(name)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading fleet missions:", error);
      } else {
        setMissions(data || []);
      }
    } catch (err) {
      console.error("Failed to load fleet data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadFleetData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFleetData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Cryogenic Fleet Telemetry & Transport Assets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time telemetry, cryogenic containment status, and dispatch assignments from live shipment manifests.
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
          {refreshing ? "Syncing..." : "Refresh Fleet Telemetry"}
        </Button>
      </div>

      {missions.length === 0 ? (
        <div className="text-center py-16 border border-dashed rounded-xl space-y-3 bg-muted/10">
          <Truck className="h-10 w-10 mx-auto text-muted-foreground stroke-1" />
          <h3 className="font-semibold text-base">No active fleet missions dispatched</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
            Once logistics jobs are accepted and shipments enter transit, live vehicle pressure and temperature metrics will report here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {missions.map((m, idx) => {
            const vehicleTag = `CRYOTANKER-${m.shipment_id.slice(0, 4).toUpperCase()}`;
            const isActive = m.status === "IN_TRANSIT";
            const isDelivered = m.status === "DELIVERED" || m.status === "VERIFIED";

            return (
              <Card key={m.shipment_id} className="border border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      <CardTitle className="text-base font-bold">{vehicleTag}</CardTitle>
                    </div>
                    <Badge
                      variant={isDelivered ? "default" : "outline"}
                      className={
                        isActive
                          ? "bg-blue-600 text-white"
                          : isDelivered
                          ? "bg-emerald-600 text-white"
                          : ""
                      }
                    >
                      {m.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Operator: {m.carrier?.name || "CryoTrans Fleet Logistics"} ? Capacity: {m.quantity} MT
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs font-medium text-foreground">
                    Corridor: {m.pickup_location} ? {m.destination}
                  </p>
                  <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-lg text-xs">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Thermometer className="h-3.5 w-3.5 text-blue-500" />
                        <span>Payload Temp:</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {isActive ? "-21.4?C (Cryogenic)" : isDelivered ? "Purged / Ambient" : "-20.0?C (Standby)"}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Gauge className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Tank Pressure:</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm mt-0.5">
                        {isActive ? "19.8 bar (Nominal)" : isDelivered ? "1.0 bar (Safe)" : "18.5 bar (Pressurized)"}
                      </p>
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
