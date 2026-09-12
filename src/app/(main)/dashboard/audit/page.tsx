"use client";

import { useEffect, useState } from "react";
import { Lock, ShieldCheck, History } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

export default function AuditPage() {
  const [loading, setLoading] = useState(true);
  const [auditEntries, setAuditEntries] = useState<any[]>([]);

  useEffect(() => {
    async function loadAuditTrail() {
      try {
        const supabase = createClient();
        const logs: any[] = [];

        // Fetch recent certificates
        const { data: certs } = await supabase
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        certs?.forEach((c) => {
          logs.push({
            id: `AUD-CERT-${c.certificate_id.slice(0, 6)}`,
            action: `Purity Certification Issued: ${c.certificate_type}`,
            target: `Certificate #${c.certificate_id.slice(0, 8)}`,
            actor: c.issuing_authority || "Accredited Lab",
            time: new Date(c.created_at).toLocaleDateString(),
            status: "VERIFIED",
          });
        });

        // Fetch recent contracts
        const { data: contracts } = await supabase
          .from("contracts")
          .select("*, seller:supplier_id(name), buyer:buyer_id(name)")
          .order("created_at", { ascending: false })
          .limit(3);

        contracts?.forEach((ctr) => {
          logs.push({
            id: `AUD-CTR-${ctr.contract_id.slice(0, 6)}`,
            action: `Smart Contract Offtake Executed (${ctr.total_quantity} tons)`,
            target: `Contract #${ctr.contract_id.slice(0, 8)}`,
            actor: `${ctr.buyer?.name || "Buyer"} & ${ctr.seller?.name || "Seller"}`,
            time: new Date(ctr.created_at).toLocaleDateString(),
            status: "SEALED",
          });
        });

        // Fetch recent shipments
        const { data: shipments } = await supabase
          .from("shipments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        shipments?.forEach((s) => {
          logs.push({
            id: `AUD-SHP-${s.shipment_id.slice(0, 6)}`,
            action: `Cryogenic Transfer: ${s.status}`,
            target: `Shipment #${s.shipment_id.slice(0, 8)}`,
            actor: "Logistics Telemetry Dispatch",
            time: new Date(s.created_at).toLocaleDateString(),
            status: s.status === "VERIFIED" ? "VERIFIED" : "LOGGED",
          });
        });

        setAuditEntries(logs);
      } catch (err) {
        console.error("Failed to load audit trail:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAuditTrail();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Immutable Audit Trails & Logs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cryptographically timestamped action logs ensuring absolute provenance and traceability across the marketplace.
        </p>
      </div>

      {auditEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <History className="h-10 w-10 mx-auto stroke-1" />
            <p className="font-semibold text-foreground text-base">No Audit Events Logged Yet</p>
            <p className="text-sm">
              As certificates are stamped, supply contracts executed, and shipments delivered, cryptographic audit entries will populate here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {auditEntries.map((log) => (
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
      )}
    </div>
  );
}
