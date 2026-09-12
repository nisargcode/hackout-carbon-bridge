"use client";

import { useEffect, useState } from "react";
import { ReceiptText, CheckCircle, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    async function loadTransactions() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("contracts")
          .select("*, seller:companies!seller_id(name), buyer:companies!buyer_id(name)")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error loading transactions:", error);
        } else {
          setTransactions(data || []);
        }
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Regulator Transaction Ledger</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Full statutory visibility into all commercial CO₂ bilateral trades, pricing transparency, and mass balances.
        </p>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-2">
            <ReceiptText className="h-10 w-10 mx-auto stroke-1" />
            <p className="font-semibold text-foreground text-base">No Bilateral Transactions Recorded</p>
            <p className="text-sm">
              All marketplace trades, contracts, and settled spot purchases are registered here for statutory audit.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => {
            const buyer: any = tx.buyer;
            const seller: any = tx.seller;
            const buyerName = (Array.isArray(buyer) ? buyer[0]?.name : buyer?.name) || "Buyer";
            const sellerName = (Array.isArray(seller) ? seller[0]?.name : seller?.name) || "Seller";
            const val = parseFloat(tx.total_value) || (parseFloat(tx.quantity) || 0) * (parseFloat(tx.unit_price) || 0);

            return (
              <Card key={tx.contract_id} className="hover:border-primary/40 transition-colors">
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {sellerName} ➔ {buyerName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {tx.contract_id.slice(0, 8)}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-4">
                        <span>
                          Volume: <strong className="text-foreground">{tx.quantity} tons</strong>
                        </span>
                        <span>
                          Value: <strong className="text-foreground">₹{val.toLocaleString()}</strong>
                        </span>
                        <span>Date: {new Date(tx.created_at).toLocaleDateString()}</span>
                        <span>Type: {tx.contract_type?.replace("_", " ")}</span>
                      </div>
                    </div>
                    <div>
                      <Badge className="bg-green-600 text-white text-xs">{tx.status || "ACTIVE"}</Badge>
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
