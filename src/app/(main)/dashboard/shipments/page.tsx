"use client";

import { useState } from "react";
import { Truck, MapPin, CheckCircle2, Clock, ShieldAlert, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShipmentItem {
  id: string;
  route: string;
  supplier: string;
  buyer: string;
  carrier: string;
  quantity: string;
  status: "MATCHED" | "BOOKED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "VERIFIED";
  eta: string;
  distance: string;
  cost: string;
  step: number; // 0 to 5
}

const statusSteps = ["MATCHED", "BOOKED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "VERIFIED"];

const initialShipments: ShipmentItem[] = [
  {
    id: "SHP-901",
    route: "ABC Cement (Mumbai) → CleanFuel (Pune)",
    supplier: "ABC Cement Works",
    buyer: "CleanFuel Synthesis Ltd",
    carrier: "CryoTrans Logistics",
    quantity: "200 tons (Cryogenic Liquid)",
    status: "IN_TRANSIT",
    eta: "Today, 6:30 PM",
    distance: "148 km",
    cost: "₹38,000",
    step: 3,
  },
  {
    id: "SHP-902",
    route: "Tata Steel (Jamshedpur) → CarbonMat (Ranchi)",
    supplier: "Tata Steel Jamshedpur",
    buyer: "CarbonMat Building Materials",
    carrier: "EastGate Freight",
    quantity: "150 tons (Gas, 25 bar)",
    status: "DELIVERED",
    eta: "Delivered (Pending Lab Verification)",
    distance: "128 km",
    cost: "₹29,500",
    step: 4,
  },
  {
    id: "SHP-903",
    route: "ABC Cement (Mumbai) → GreenGrow (Nashik)",
    supplier: "ABC Cement Works",
    buyer: "GreenGrow AgriTech",
    carrier: "CryoTrans Logistics",
    quantity: "100 tons (Liquid)",
    status: "VERIFIED",
    eta: "Verified & Closed",
    distance: "165 km",
    cost: "₹34,000",
    step: 5,
  },
];

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<ShipmentItem[]>(initialShipments);

  const advanceStatus = (id: string) => {
    setShipments((prev) =>
      prev.map((s) => {
        if (s.id === id && s.step < 5) {
          const nextStep = s.step + 1;
          const nextStatus = statusSteps[nextStep] as ShipmentItem["status"];
          toast.success(`Shipment ${id} updated to ${nextStatus}!`);
          return { ...s, step: nextStep, status: nextStatus };
        }
        return s;
      })
    );
  };

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

      <div className="space-y-6">
        {shipments.map((s) => (
          <Card key={s.id} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{s.route}</CardTitle>
                    <Badge variant="outline" className="text-xs">{s.id}</Badge>
                    <Badge
                      className={
                        s.status === "VERIFIED"
                          ? "bg-green-600 text-white"
                          : s.status === "IN_TRANSIT"
                          ? "bg-blue-600 text-white"
                          : "bg-amber-600 text-white"
                      }
                    >
                      {s.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Carrier: <strong>{s.carrier}</strong> · Distance: {s.distance} · Freight: {s.cost}
                  </CardDescription>
                </div>
                <div className="text-sm font-semibold text-muted-foreground">
                  ETA: <span className="text-foreground">{s.eta}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Stepper visualization */}
              <div className="py-2">
                <div className="grid grid-cols-6 gap-1 relative">
                  {statusSteps.map((stepName, idx) => {
                    const isDone = idx <= s.step;
                    const isCurrent = idx === s.step;
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
                  Payload: <span className="font-medium text-foreground">{s.quantity}</span>
                </div>
                {s.step < 5 && (
                  <Button size="sm" onClick={() => advanceStatus(s.id)}>
                    Simulate Next: {statusSteps[s.step + 1].replace("_", " ")}
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
