"use client";

import { Truck, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FleetPage() {
  const fleet = [
    { id: "MH-04-CT-1088", type: "Cryogenic Vacuum Tanker (30t)", status: "ACTIVE", route: "Mumbai ➔ Pune", temp: "-21.4°C", pressure: "19.8 bar" },
    { id: "MH-04-CT-1092", type: "Cryogenic Vacuum Tanker (30t)", status: "AVAILABLE", route: "Depot Standby (Navi Mumbai)", temp: "Ambient (Purged)", pressure: "1.0 bar" },
    { id: "GJ-05-PG-4401", type: "High-Pressure Tube Trailer (25t)", status: "ACTIVE", route: "Surat ➔ Ahmedabad", temp: "26.0°C", pressure: "24.5 bar" },
    { id: "TN-02-CT-8910", type: "Cryogenic ISO Tank Container", status: "MAINTENANCE", route: "Scheduled Valve Recertification", temp: "--", pressure: "--" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Fleet Telemetry & Status</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time pressure, temperature, and tracking telemetry for specialized CO₂ transport assets.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fleet.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{vehicle.id}</CardTitle>
                <Badge
                  className={
                    vehicle.status === "ACTIVE"
                      ? "bg-blue-600 text-white"
                      : vehicle.status === "AVAILABLE"
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {vehicle.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">{vehicle.type}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs font-medium text-foreground">Current Duty: {vehicle.route}</p>
              <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-lg text-xs">
                <div>
                  <span className="text-muted-foreground">Payload Temp:</span>
                  <p className="font-semibold text-foreground">{vehicle.temp}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Tank Pressure:</span>
                  <p className="font-semibold text-foreground">{vehicle.pressure}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
