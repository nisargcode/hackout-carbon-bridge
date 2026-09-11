"use client";

import { Lock, ShieldCheck, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AuditPage() {
  const logs = [
    { id: "AUD-991", action: "Purity Certification Stamped", target: "Supply #aaaaaaaa-aaaa", actor: "Vimta Labs Auditor", time: "2 hours ago", status: "VERIFIED" },
    { id: "AUD-992", action: "Cryogenic Haul Dispatched", target: "Shipment #SHP-901", actor: "CryoTrans Dispatcher", time: "5 hours ago", status: "LOGGED" },
    { id: "AUD-993", action: "Smart Contract Offtake Executed", target: "Contract #CTR-2026-089", actor: "CleanFuel System Agent", time: "1 day ago", status: "SEALED" },
    { id: "AUD-994", action: "CEMS Sensor Calibration Check", target: "ABC Cement Stack #4", actor: "Continuous Emission System", time: "2 days ago", status: "PASSED" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Immutable Audit Trails & Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cryptographically timestamped action logs ensuring absolute provenance and traceability.
        </p>
      </div>

      <div className="space-y-3">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardContent className="py-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{log.action}</span>
                    <Badge variant="outline" className="text-xs">{log.id}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: {log.target} · Actor: {log.actor} · {log.time}
                  </p>
                </div>
                <Badge className="bg-slate-800 text-white text-xs">{log.status}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
