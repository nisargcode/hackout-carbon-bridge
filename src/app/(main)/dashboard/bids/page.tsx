"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gavel, Check, X, ArrowRightLeft, Clock, Package, Building2, CheckCircle2 } from "lucide-react";
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
import { createNotification } from "@/lib/notifications";

export default function BidsPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bids, setBids] = useState<any[]>([]);
  const [counterPrice, setCounterPrice] = useState("");
  const [activeBid, setActiveBid] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBids = async () => {
    if (!company?.company_id) {
      setLoading(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bids")
        .select(
          "*, bidder:companies!bidder_id(company_id, name, location), supply:co2_supplies!supply_id(supply_id, source_industry, asking_price, emitter_id, physical_state, location, emitter:companies!emitter_id(name, location))",
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bids:", error);
      } else {
        // Filter bids that either:
        // 1. Were submitted to this company's supplies (Incoming)
        // 2. Were placed by this company (Outgoing)
        const relevant = (data || []).filter(
          (b) => b.bidder_id === company.company_id || b.supply?.emitter_id === company.company_id,
        );
        setBids(relevant);
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

  const handleAction = async (bid: any, action: "ACCEPTED" | "REJECTED") => {
    if (!company?.company_id) return;
    setActionLoading(true);
    try {
      const supabase = createClient();

      // 1. Update bid status in database
      const { error } = await supabase
        .from("bids")
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq("bid_id", bid.bid_id);

      if (error) {
        toast.error(`Failed to update bid: ${error.message}`);
        return;
      }

      // 2. If accepted, automatically create a binding contract
      if (action === "ACCEPTED") {
        const qty = Number(bid.quantity || 100);
        const price = Number(bid.amount || 4000);

        await supabase.from("contracts").insert({
          supply_id: bid.supply_id,
          buyer_id: bid.bidder_id,
          seller_id: company.company_id,
          quantity: qty,
          unit_price: price,
          total_value: qty * price,
          contract_type: bid.bid_type === "LONG_TERM_CONTRACT" ? "LONG_TERM" : "SPOT",
          start_date: new Date().toISOString().split("T")[0],
          end_date: new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
          status: "ACTIVE",
        });

        // 3. Notify Buyer of acceptance
        await createNotification({
          recipient_id: bid.bidder_id,
          sender_id: company.company_id,
          title: "Bid Approved! Contract Created",
          message: `${company.name} accepted your offer of ₹${price.toLocaleString()}/t for ${qty} tons of CO₂. The contract is now active!`,
          type: "BID_ACCEPTED",
          reference_id: bid.bid_id,
          reference_type: "bid",
        });

        toast.success("Bid accepted! Contract generated and buyer notified.");
      } else {
        // Notify Buyer of decline
        await createNotification({
          recipient_id: bid.bidder_id,
          sender_id: company.company_id,
          title: "Bid Declined",
          message: `${company.name} declined your offer of ₹${Number(bid.amount).toLocaleString()}/t for ${bid.quantity} tons.`,
          type: "BID_REJECTED",
          reference_id: bid.bid_id,
          reference_type: "bid",
        });

        toast.info("Bid declined and buyer notified.");
      }

      setBids((prev) => prev.map((b) => (b.bid_id === bid.bid_id ? { ...b, status: action } : b)));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCounter = async () => {
    if (!activeBid || !counterPrice || !company?.company_id) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("bids")
        .update({
          status: "COUNTER_OFFER",
          amount: Number(counterPrice),
          updated_at: new Date().toISOString(),
        })
        .eq("bid_id", activeBid.bid_id);

      if (error) {
        toast.error(error.message);
        return;
      }

      // Notify the bidder of counter-offer
      await createNotification({
        recipient_id: activeBid.bidder_id,
        sender_id: company.company_id,
        title: "Counter Offer Received",
        message: `${company.name} submitted a counter offer of ₹${Number(counterPrice).toLocaleString()}/t for your bid.`,
        type: "BID_COUNTERED",
        reference_id: activeBid.bid_id,
        reference_type: "bid",
      });

      setBids((prev) =>
        prev.map((b) =>
          b.bid_id === activeBid.bid_id ? { ...b, status: "COUNTER_OFFER", amount: Number(counterPrice) } : b,
        ),
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

  const incomingBids = bids.filter((b) => b.supply?.emitter_id === company?.company_id);
  const outgoingBids = bids.filter((b) => b.bidder_id === company?.company_id);

  const pendingCount = bids.filter((b) => b.status === "PENDING").length;
  const acceptedCount = bids.filter((b) => b.status === "ACCEPTED").length;
  const counteredCount = bids.filter((b) => b.status === "COUNTER_OFFER").length;

  const renderBidCard = (b: any) => {
    const isIncoming = b.supply?.emitter_id === company?.company_id;
    const partnerName = isIncoming
      ? b.bidder?.name || "Industrial Buyer"
      : b.supply?.emitter?.name || b.supply?.source_industry || "CO₂ Emitter";

    return (
      <Card key={b.bid_id} className="hover:border-primary/50 transition-colors">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-base">{partnerName}</span>
                <Badge variant="outline" className="text-xs">
                  {isIncoming ? "INCOMING FROM BUYER" : "OUTGOING OFFER"}
                </Badge>
                <Badge
                  className={
                    b.bid_type === "BUY_NOW"
                      ? "bg-purple-600 text-white"
                      : b.bid_type === "REQUEST_QUOTE"
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-white"
                  }
                >
                  {b.bid_type?.replace("_", " ") || "BID"}
                </Badge>
                <Badge
                  variant={b.status === "ACCEPTED" ? "default" : b.status === "REJECTED" ? "destructive" : "outline"}
                  className={b.status === "ACCEPTED" ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""}
                >
                  {b.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  Quantity: <strong className="text-foreground">{b.quantity} tons</strong>
                </span>
                <span>
                  Offered Price: <strong className="text-foreground">₹{Number(b.amount).toLocaleString()}/t</strong>
                </span>
                {b.supply?.asking_price && (
                  <span>
                    Asking: <span className="line-through">₹{Number(b.supply.asking_price).toLocaleString()}/t</span>
                  </span>
                )}
                <span>
                  Total:{" "}
                  <strong className="text-primary font-medium">
                    ₹{(Number(b.amount) * Number(b.quantity)).toLocaleString()}
                  </strong>
                </span>
                <span>Date: {new Date(b.created_at).toLocaleDateString()}</span>
              </div>

              {b.notes && <p className="text-xs text-muted-foreground italic">"{b.notes}"</p>}
            </div>

            {/* Action buttons */}
            {b.status === "PENDING" && isIncoming && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction(b, "ACCEPTED")}
                  disabled={actionLoading}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-rose-600 hover:text-rose-700"
                  onClick={() => handleAction(b, "REJECTED")}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveBid(b);
                        setCounterPrice(b.amount?.toString() || "");
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
                        Original bid was ₹{b.amount}/ton for {b.quantity} tons. Enter your revised price per ton:
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">₹</span>
                        <Input
                          type="number"
                          placeholder="e.g. 4300"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                        />
                        <span className="text-sm text-muted-foreground">/ton</span>
                      </div>
                      <Button onClick={handleCounter} className="w-full">
                        Submit Counter Offer
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {b.status === "ACCEPTED" && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/dashboard/contracts">View Contract</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Bids & Trade Negotiations</h1>
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
                When buyers place bids on marketplace supplies or request quotes, negotiations will appear here in real
                time.
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
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Bids ({bids.length})</TabsTrigger>
            <TabsTrigger value="incoming">Incoming ({incomingBids.length})</TabsTrigger>
            <TabsTrigger value="outgoing">Outgoing ({outgoingBids.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {bids.map(renderBidCard)}
          </TabsContent>

          <TabsContent value="incoming" className="space-y-4">
            {incomingBids.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No incoming bids from buyers yet.
                </CardContent>
              </Card>
            ) : (
              incomingBids.map(renderBidCard)
            )}
          </TabsContent>

          <TabsContent value="outgoing" className="space-y-4">
            {outgoingBids.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  You haven't placed any outgoing bids yet.
                </CardContent>
              </Card>
            ) : (
              outgoingBids.map(renderBidCard)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
