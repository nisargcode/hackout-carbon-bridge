"use client";

import { MapPin, Navigation, Fuel, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Route Optimization & Hazmat Navigation</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Automated corridor planning adhering to cryogenic transport safety parameters and green routing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Corridor: Mumbai ➔ Pune Express</CardTitle>
              <Badge className="bg-green-600 text-white">Optimal Route</Badge>
            </div>
            <CardDescription>Distance: 148 km · Est. Transit: 3h 15m</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Origin: ABC Cement Works, Kalamboli Terminal
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Navigation className="h-3.5 w-3.5 text-amber-500" /> Via: Mumbai-Pune Expressway (Hazmat Permit Approved)
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-green-600" /> Dest: CleanFuel Synthesis Ltd, Chakan MIDC
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 border rounded">Pressure Monitoring: Continuous Telemetry Active</div>
              <div className="p-2 border rounded">CO₂ Footprint: 0.08 kg CO₂/t-km (Euro-VI LNG Tanker)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Corridor: Surat ➔ Ahmedabad Freight Link</CardTitle>
              <Badge variant="outline">Secondary Corridor</Badge>
            </div>
            <CardDescription>Distance: 260 km · Est. Transit: 5h 30m</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-muted/30 p-3 rounded-lg text-sm space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Origin: PowerGen Ltd, Hazira Terminal
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Navigation className="h-3.5 w-3.5 text-amber-500" /> Via: NH 48 Commercial Freight Bypass
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-green-600" /> Dest: GreenTech Polychem, Sanand Industrial Area
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 border rounded">Pressure Monitoring: Certified CCOE Relief Valves</div>
              <div className="p-2 border rounded">CO₂ Footprint: 0.11 kg CO₂/t-km</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
