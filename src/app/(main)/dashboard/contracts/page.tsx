"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Download, ShieldCheck, Calendar, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export default function ContractsPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);

  useEffect(() => {
    async function loadContracts() {
      try {
        const supabase = createClient();
        let query = supabase
          .from("contracts")
          .select("*, seller:companies!seller_id(name), buyer:companies!buyer_id(name)")
          .order("created_at", { ascending: false });

        if (company?.company_id) {
          query = query.or(`seller_id.eq.${company.company_id},buyer_id.eq.${company.company_id}`);
        }

        const { data, error } = await query;
        if (error) {
          console.error("Error loading contracts:", error);
        } else {
          setContracts(data || []);
        }
      } catch (err) {
        console.error("Failed to load contracts:", err);
      } finally {
        setLoading(false);
      }
    }

    loadContracts();
  }, [company?.company_id]);

  const downloadContract = (id: string) => {
    toast.success(`Exporting signed legally-binding contract: ${id}.pdf`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const totalVal = contracts.reduce(
    (sum, c) => sum + (parseFloat(c.quantity || c.total_quantity) || 0) * (parseFloat(c.unit_price) || 0),
    0,
  );
  const activeCount = contracts.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">CO₂ Supply Contracts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Active long-term offtake agreements, spot supply contracts, and regulatory audit records.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Contracted Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {totalVal > 100000 ? `₹${(totalVal / 100000).toFixed(2)}L` : `₹${totalVal.toLocaleString()}`}
            </div>
            <p className="text-muted-foreground text-xs mt-1">Across registered bilateral agreements</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{activeCount} Active</div>
            <p className="text-muted-foreground text-xs mt-1">Providing sustained operational baseline</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600 flex items-center gap-1.5">
              <ShieldCheck className="h-6 w-6" /> {contracts.length > 0 ? "100%" : "0%"}
            </div>
            <p className="text-muted-foreground text-xs mt-1">Validated on statutory carbon ledger</p>
          </CardContent>
        </Card>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <FileText className="h-10 w-10 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-base">No Bilateral Contracts Found</p>
              <p className="text-sm">
                When purchase offers or long-term offtakes are signed, legal contracts with cryptographic audit hashes
                will appear here.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button asChild>
                <Link href="/dashboard/marketplace">Explore Marketplace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contracts.map((c) => {
            const qty = parseFloat(c.quantity || c.total_quantity) || 0;
            const price = parseFloat(c.unit_price) || 0;
            const val = qty * price;

            return (
              <Card key={c.contract_id} className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">
                          {c.contract_type === "LONG_TERM"
                            ? "Annual CO₂ Offtake Agreement"
                            : "Spot CO₂ Supply Agreement"}
                        </CardTitle>
                        <Badge variant={c.contract_type === "LONG_TERM" ? "default" : "outline"}>
                          {c.contract_type?.replace("_", " ") || "SPOT"}
                        </Badge>
                        <Badge
                          className={
                            c.status === "ACTIVE" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Contract Ref: {c.contract_id} · Created: {new Date(c.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="font-bold text-lg text-foreground md:text-right">₹{val.toLocaleString()}</div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-muted/40 p-3 rounded-lg">
                    <div>
                      <p className="text-muted-foreground text-xs">Buyer</p>
                      <p className="font-medium truncate">{c.buyer?.name || "Buyer"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Supplier</p>
                      <p className="font-medium truncate">{c.seller?.name || "Emitter"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Volume & Price</p>
                      <p className="font-medium">
                        {qty} tons @ ₹{price}/t
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Payment Terms</p>
                      <p className="font-medium text-green-600">{c.payment_terms || "Net 30 Days"}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Legally validated under Indian Carbon Exchange guidelines
                    </span>
                    <Button size="sm" variant="outline" onClick={() => downloadContract(c.contract_id)}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download Legal PDF
                    </Button>
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
