"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Truck, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

const statusSteps = ["MATCHED", "BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "VERIFIED"];

export default function ShipmentsPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<any[]>([]);

  const fetchShipments = async () => {
    try {
      const supabase = createClient();
      let query = supabase
        .from("shipments")
        .select("*, supplier:supplier_id(name), buyer:buyer_id(name), carrier:logistics_provider(name)")
        .order("created_at", { ascending: false });

      if (company?.company_id) {
        query = query.or(
          `supplier_id.eq.${company.company_id},buyer_id.eq.${company.company_id},logistics_provider.eq.${company.company_id}`
        );
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error loading shipments:", error);
      } else {
        setShipments(data || []);
      }
    } catch (err) {
      console.error("Failed to load shipments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [company?.company_id]);

  const advanceStatus = async (shipmentId: string, currentStatus: string) => {
    const currentStep = Math.max(0, statusSteps.indexOf(currentStatus));
    if (currentStep >= statusSteps.length - 1) return;

    const nextStatus = statusSteps[currentStep + 1];

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("shipments")
        .update({ status: nextStatus })
        .eq("shipment_id", shipmentId);

      if (error) {
        toast.error(`Update failed: ${error.message}`);
        return;
      }

      setShipments((prev) =>
        prev.map((s) =>
          s.shipment_id === shipmentId ? { ...s, status: nextStatus } : s
        )
      );
      toast.success(`Shipment advanced to ${nextStatus.replace("_", " ")}!`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">CO₂ Logistics & Shipment Tracking</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time multi-modal tracking through every stage: MATCHED → BOOKED → PICKED UP → IN TRANSIT → DELIVERED → VERIFIED.
          </p>
        </div>
      </div>

      {shipments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <Truck className="h-10 w-10 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-base">No Shipments Active</p>
              <p className="text-sm">
                When supply contracts are executed, transport shipments are automatically generated and tracked through verified custody handover.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button asChild>
                <Link href="/dashboard/contracts">View Contracts</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {shipments.map((s) => {
            const stepIdx = Math.max(0, statusSteps.indexOf(s.status));

            return (
              <Card key={s.shipment_id} className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {s.pickup_location} → {s.destination}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">{s.shipment_id.slice(0, 8)}</Badge>
                        <Badge
                          className={
                            s.status === "VERIFIED"
                              ? "bg-green-600 text-white"
                              : s.status === "IN_TRANSIT"
                              ? "bg-blue-600 text-white"
                              : "bg-amber-600 text-white"
                          }
                        >
                          {s.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Carrier: <strong>{s.carrier?.name || "Unassigned"}</strong> · Distance: {s.estimated_distance || 150} km · Freight: ₹{Number(s.transportation_cost || 0).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground">
                      ETA: <span className="text-foreground">{s.estimated_delivery ? new Date(s.estimated_delivery).toLocaleDateString() : "Pending"}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stepper visualization */}
                  <div className="py-2">
                    <div className="grid grid-cols-6 gap-1 relative">
                      {statusSteps.map((stepName, idx) => {
                        const isDone = idx <= stepIdx;
                        const isCurrent = idx === stepIdx;
                        return (
                          <div key={stepName} className="flex flex-col items-center text-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                isCurrent
                                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                                  : isDone
                                  ? "bg-green-600 text-white"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {isDone && !isCurrent ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                            </div>
                            <span
                              className={`text-[10px] mt-1.5 font-medium leading-tight ${
                                isCurrent ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {stepName.replace("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-xs text-muted-foreground">
                      Payload: <span className="font-medium text-foreground">{s.quantity} tons</span>
                    </div>
                    {stepIdx < statusSteps.length - 1 && (
                      <Button size="sm" onClick={() => advanceStatus(s.shipment_id, s.status)}>
                        Advance Status: {statusSteps[stepIdx + 1].replace("_", " ")}
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </Button>
                    )}
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
