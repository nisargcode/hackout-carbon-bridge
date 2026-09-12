"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gavel, Check, X, ArrowRightLeft, Clock, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export default function BidsPage() {
  const { company, companyType } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);
  const [counterPrice, setCounterPrice] = useState("");
  const [activeBid, setActiveBid] = useState<any | null>(null);

  const fetchBids = async () => {
    if (!company?.company_id) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bids")
        .select("*, buyer:buyer_id(name), supply:supply_id(asking_price, emitter_id, physical_state, companies:emitter_id(name))")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bids:", error);
      } else {
        setBids(data || []);
      }
    } catch (err) {
      console.error("Failed to load bids:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, [company?.company_id]);

  const handleAction = async (bidId: string, action: "ACCEPTED" | "REJECTED") => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bids")
        .update({ bid_status: action })
        .eq("bid_id", bidId);

      if (error) {
        toast.error(`Failed to update bid: ${error.message}`);
        return;
      }

      setBids((prev) =>
        prev.map((b) => (b.bid_id === bidId ? { ...b, bid_status: action } : b))
      );
      toast.success(`Bid has been ${action.toLowerCase()}!`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCounter = async () => {
    if (!activeBid || !counterPrice) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bids")
        .update({
          bid_status: "COUNTERED",
          offered_price: Number(counterPrice),
        })
        .eq("bid_id", activeBid.bid_id);

      if (error) {
        toast.error(error.message);
        return;
      }

      setBids((prev) =>
        prev.map((b) =>
          b.bid_id === activeBid.bid_id
            ? { ...b, bid_status: "COUNTERED", offered_price: Number(counterPrice) }
            : b
        )
      );
      toast.success(`Counter offer of ₹${counterPrice}/t submitted!`);
      setActiveBid(null);
      setCounterPrice("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const pendingCount = bids.filter((b) => b.bid_status === "PENDING").length;
  const acceptedCount = bids.filter((b) => b.bid_status === "ACCEPTED").length;
  const counteredCount = bids.filter((b) => b.bid_status === "COUNTERED").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Bids & Dynamic Negotiations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage incoming purchase offers, counter-negotiations, and dynamic pricing agreements.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending Bids", value: pendingCount.toString(), color: "text-amber-500" },
          { label: "Accepted Deals", value: acceptedCount.toString(), color: "text-green-600" },
          { label: "Counter Offers", value: counteredCount.toString(), color: "text-blue-500" },
          { label: "Total Tracked", value: bids.length.toString(), color: "text-foreground" },
        ].map((m) => (
          <Card key={m.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`font-bold text-2xl ${m.color}`}>{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {bids.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <Gavel className="h-10 w-10 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-base">No Bids or Negotiations Found</p>
              <p className="text-sm">
                When buyers place bids on marketplace supplies or request quotes, negotiations will appear here in real time.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard/marketplace">Browse Marketplace</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bids.map((b) => {
            const isIncoming = b.supply?.emitter_id === company?.company_id;
            const partnerName = isIncoming
              ? b.buyer?.name || "Industrial Buyer"
              : b.supply?.companies?.name || "CO₂ Emitter";

            return (
              <Card key={b.bid_id} className="hover:border-primary/50 transition-colors">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{partnerName}</span>
                        <Badge variant="outline" className="text-xs">
                          {isIncoming ? "INCOMING" : "OUTGOING"}
                        </Badge>
                        <Badge
                          className={
                            b.bid_type === "BUY_NOW"
                              ? "bg-purple-600 text-white"
                              : b.bid_type === "NEGOTIATE"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-700 text-white"
                          }
                        >
                          {b.bid_type?.replace("_", " ") || "BID"}
                        </Badge>
                        <Badge
                          variant={
                            b.bid_status === "ACCEPTED"
                              ? "default"
                              : b.bid_status === "REJECTED"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {b.bid_status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Quantity: <strong className="text-foreground">{b.offered_quantity} tons</strong></span>
                        <span>Offered Price: <strong className="text-foreground">₹{Number(b.offered_price).toLocaleString()}/t</strong></span>
                        {b.supply?.asking_price && (
                          <span>Asking: <span className="line-through">₹{Number(b.supply.asking_price).toLocaleString()}/t</span></span>
                        )}
                        <span>Date: {new Date(b.created_at).toLocaleDateString()}</span>
                      </div>
                      {b.notes && (
                        <p className="text-xs text-muted-foreground italic">"{b.notes}"</p>
                      )}
                    </div>

                    {b.bid_status === "PENDING" && isIncoming && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleAction(b.bid_id, "ACCEPTED")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setActiveBid(b);
                                setCounterPrice(b.offered_price?.toString() || "");
                              }}
                            >
                              <ArrowRightLeft className="h-4 w-4 mr-1" />
                              Counter
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Counter Offer to {partnerName}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-3">
                              <p className="text-sm text-muted-foreground">
                                Current bid: ₹{b.offered_price}/t. Enter your counter-proposal:
                              </p>
                              <Input
                                type="number"
                                value={counterPrice}
                                onChange={(e) => setCounterPrice(e.target.value)}
                                placeholder="Price in INR/ton"
                              />
                              <Button className="w-full" onClick={handleCounter}>
                                Submit Counter Offer
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleAction(b.bid_id, "REJECTED")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
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
