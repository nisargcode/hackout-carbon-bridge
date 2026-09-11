"use client";

import { useState } from "react";
import { Gavel, Check, X, ArrowRightLeft, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface BidItem {
  id: string;
  partner: string;
  direction: "INCOMING" | "OUTGOING";
  quantity: string;
  amount: number;
  originalPrice: number;
  type: "BUY_NOW" | "BID" | "NEGOTIATE" | "QUOTE";
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "COUNTERED";
  date: string;
  notes: string;
}

const mockBids: BidItem[] = [
  {
    id: "BID-101",
    partner: "CleanFuel Synthesis Ltd",
    direction: "INCOMING",
    quantity: "200 tons",
    amount: 4100,
    originalPrice: 4200,
    type: "BID",
    status: "PENDING",
    date: "Sep 11, 2026",
    notes: "Requesting prompt dispatch by cryogenic tanker.",
  },
  {
    id: "BID-102",
    partner: "GreenGrow AgriTech",
    direction: "INCOMING",
    quantity: "150 tons",
    amount: 4200,
    originalPrice: 4200,
    type: "BUY_NOW",
    status: "ACCEPTED",
    date: "Sep 10, 2026",
    notes: "Instant purchase at list price.",
  },
  {
    id: "BID-103",
    partner: "Tata Steel Jamshedpur",
    direction: "OUTGOING",
    quantity: "300 tons",
    amount: 3700,
    originalPrice: 3800,
    type: "NEGOTIATE",
    status: "COUNTERED",
    date: "Sep 09, 2026",
    notes: "Offered ₹3,700/ton for 6-month continuous delivery.",
  },
];

export default function BidsPage() {
  const { companyType } = useAuth();
  const [bids, setBids] = useState<BidItem[]>(mockBids);
  const [counterPrice, setCounterPrice] = useState("");
  const [activeBid, setActiveBid] = useState<BidItem | null>(null);

  const handleAction = (id: string, action: "ACCEPTED" | "REJECTED") => {
    setBids((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: action } : b))
    );
    toast.success(`Bid ${id} has been ${action.toLowerCase()}!`);
  };

  const handleCounter = () => {
    if (!activeBid || !counterPrice) return;
    setBids((prev) =>
      prev.map((b) =>
        b.id === activeBid.id
          ? { ...b, status: "COUNTERED", amount: Number(counterPrice) }
          : b
      )
    );
    toast.success(`Counter offer of ₹${counterPrice}/t sent!`);
    setActiveBid(null);
    setCounterPrice("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Bids & Dynamic Negotiations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage incoming offers, counter-negotiations, and dynamic pricing agreements.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending Bids", value: "3", color: "text-amber-500" },
          { label: "Accepted Deals", value: "14", color: "text-green-600" },
          { label: "Counter Offers", value: "2", color: "text-blue-500" },
          { label: "Avg Discount", value: "2.4%", color: "text-foreground" },
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

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Bids</TabsTrigger>
          <TabsTrigger value="incoming">Incoming</TabsTrigger>
          <TabsTrigger value="outgoing">Outgoing</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {bids.map((b) => (
            <Card key={b.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{b.partner}</span>
                      <Badge variant="outline" className="text-xs">{b.direction}</Badge>
                      <Badge
                        className={
                          b.type === "BUY_NOW"
                            ? "bg-purple-600 text-white"
                            : b.type === "NEGOTIATE"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-white"
                        }
                      >
                        {b.type.replace("_", " ")}
                      </Badge>
                      <Badge
                        variant={
                          b.status === "ACCEPTED"
                            ? "default"
                            : b.status === "REJECTED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {b.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Quantity: <strong className="text-foreground">{b.quantity}</strong></span>
                      <span>Offered Price: <strong className="text-foreground">₹{b.amount.toLocaleString()}/t</strong></span>
                      <span>List: <span className="line-through">₹{b.originalPrice.toLocaleString()}/t</span></span>
                      <span>Date: {b.date}</span>
                    </div>
                    {b.notes && (
                      <p className="text-xs text-muted-foreground italic">"{b.notes}"</p>
                    )}
                  </div>

                  {b.status === "PENDING" && b.direction === "INCOMING" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleAction(b.id, "ACCEPTED")}
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
                              setCounterPrice(b.amount.toString());
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4 mr-1" />
                            Counter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Counter Offer to {b.partner}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-3">
                            <p className="text-sm text-muted-foreground">
                              Current bid: ₹{b.amount}/t. Enter your counter-proposal:
                            </p>
                            <Input
                              type="number"
                              value={counterPrice}
                              onChange={(e) => setCounterPrice(e.target.value)}
                              placeholder="Price in INR/ton"
                            />
                            <Button className="w-full" onClick={handleCounter}>
                              Send Counter Offer
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleAction(b.id, "REJECTED")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="incoming" className="mt-4">
          {/* Incoming filtered list */}
          <div className="space-y-3">
            {bids.filter(b => b.direction === "INCOMING").map(b => (
              <Card key={b.id}><CardContent className="py-3 font-medium">{b.partner} - ₹{b.amount}/t ({b.status})</CardContent></Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="outgoing" className="mt-4">
          {/* Outgoing filtered list */}
          <div className="space-y-3">
            {bids.filter(b => b.direction === "OUTGOING").map(b => (
              <Card key={b.id}><CardContent className="py-3 font-medium">{b.partner} - ₹{b.amount}/t ({b.status})</CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
