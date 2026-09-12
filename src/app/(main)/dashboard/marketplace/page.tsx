"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Leaf,
  Shield,
  Loader2,
  Package,
  DollarSign,
  Send,
  Sparkles,
  Info,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { CO2Supply } from "@/types";

interface EnrichedSupply extends CO2Supply {
  companies?: {
    company_id?: string;
    name?: string;
    location?: string;
    industry?: string;
    sustainability_score?: number;
  };
}

export default function MarketplacePage() {
  const { company } = useAuth();
  const supabase = createClient();

  const [supplies, setSupplies] = useState<EnrichedSupply[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState<number[]>([15000]);
  const [minPurity, setMinPurity] = useState<number[]>([70]);

  // Bidding Modal State
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<EnrichedSupply | null>(null);
  const [bidType, setBidType] = useState<"BID" | "BUY_NOW" | "REQUEST_QUOTE">("BID");
  const [bidQuantity, setBidQuantity] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [bidNotes, setBidNotes] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);

  // Fetch real supplies from Supabase
  const fetchSupplies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("co2_supplies")
        .select("*, companies:emitter_id(company_id, name, location, industry, sustainability_score)")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching supplies:", error);
        toast.error("Failed to load supplies from database");
        setSupplies([]);
      } else {
        const all = (data as EnrichedSupply[]) || [];
        setTotalCount(all.length);

        // Filter: Hide user's own listing from their own buyer view
        // so they only browse other emitters' supplies!
        const visible = all.filter((s) => {
          if (company?.company_id && s.emitter_id === company.company_id) {
            return false;
          }
          return true;
        });

        setSupplies(visible);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Unexpected error loading marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplies();
  }, [company?.company_id]);

  // Filter supplies client-side
  const filteredSupplies = useMemo(() => {
    return supplies.filter((s) => {
      const companyName = s.companies?.name || s.source_industry || "";
      const loc = s.location || "";
      const method = s.capture_method || "";

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSearch =
          companyName.toLowerCase().includes(q) ||
          loc.toLowerCase().includes(q) ||
          method.toLowerCase().includes(q) ||
          (s.source_industry && s.source_industry.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Physical state filter
      if (stateFilter !== "all" && s.physical_state?.toLowerCase() !== stateFilter.toLowerCase()) {
        return false;
      }

      // Capture method filter
      if (methodFilter !== "all" && s.capture_method?.toLowerCase() !== methodFilter.toLowerCase()) {
        return false;
      }

      // Price filter
      const price = Number(s.asking_price) || 0;
      if (price > maxPrice[0]) {
        return false;
      }

      // Purity filter
      const purity = Number(s.purity_percentage) || 0;
      if (purity < minPurity[0]) {
        return false;
      }

      return true;
    });
  }, [supplies, search, stateFilter, methodFilter, maxPrice, minPurity]);

  // Open Bid Modal
  const handleOpenBid = (supply: EnrichedSupply, type: "BID" | "BUY_NOW" | "REQUEST_QUOTE") => {
    if (!company) {
      toast.error("Please log in with a company account to place bids or request quotes");
      return;
    }
    setSelectedSupply(supply);
    setBidType(type);
    setBidQuantity(String(supply.minimum_order || Math.min(100, Number(supply.available_quantity))));
    setBidPrice(type === "BUY_NOW" ? String(supply.asking_price) : String(supply.asking_price));
    setBidNotes("");
    setBidModalOpen(true);
  };

  // Submit Bid
  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupply) return;
    if (!company?.company_id) {
      toast.error("You must be registered as a buyer to submit a bid");
      return;
    }

    const qty = Number(bidQuantity);
    const price = Number(bidPrice);

    if (!qty || qty <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }
    if (!price || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    if (qty > Number(selectedSupply.available_quantity)) {
      toast.error(`Maximum available quantity is ${selectedSupply.available_quantity} ${selectedSupply.quantity_unit}`);
      return;
    }

    setSubmittingBid(true);
    try {
      const { error } = await supabase.from("bids").insert({
        supply_id: selectedSupply.supply_id,
        bidder_id: company.company_id,
        amount: price,
        quantity: qty,
        bid_type: bidType,
        status: "PENDING",
        notes: bidNotes.trim() || `Offer from ${company.name || "Buyer"}`,
      });

      if (error) {
        toast.error(`Bid submission failed: ${error.message}`);
      } else {
        toast.success(
          bidType === "BUY_NOW"
            ? "Buy-Now order request submitted successfully!"
            : bidType === "REQUEST_QUOTE"
              ? "Quote request submitted to seller!"
              : `Bid of ₹${price.toLocaleString()}/t submitted successfully!`
        );
        setBidModalOpen(false);
        setSelectedSupply(null);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit bid");
    } finally {
      setSubmittingBid(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Browse Supplies</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Discover and bid on verified CO₂ supplies listed by emitters across India.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/matches">
              <Sparkles className="h-4 w-4 mr-1.5 text-emerald-600" />
              AI Recommendations
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/demands/new">Post Demand Request</Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company, industry, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Physical State */}
        <div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Physical State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="Liquid">Liquid (Cryogenic)</SelectItem>
              <SelectItem value="Gas">Gas (Compressed)</SelectItem>
              <SelectItem value="Solid">Solid (Dry Ice)</SelectItem>
              <SelectItem value="Supercritical">Supercritical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Capture Method */}
        <div>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Capture Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Capture Methods</SelectItem>
              <SelectItem value="Post-combustion">Post-combustion</SelectItem>
              <SelectItem value="Pre-combustion">Pre-combustion</SelectItem>
              <SelectItem value="Oxyfuel">Oxyfuel combustion</SelectItem>
              <SelectItem value="Direct air capture">Direct air capture</SelectItem>
              <SelectItem value="Industrial process">Industrial process</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sliders */}
        <div className="md:col-span-2 flex items-center justify-between gap-4 p-2 rounded-lg border bg-muted/20">
          <div className="text-xs text-muted-foreground min-w-28">
            Max Price: <span className="font-semibold text-foreground">₹{maxPrice[0].toLocaleString()}/t</span>
          </div>
          <Slider
            value={maxPrice}
            onValueChange={setMaxPrice}
            min={1000}
            max={15000}
            step={100}
            className="flex-1"
          />
        </div>

        <div className="md:col-span-2 flex items-center justify-between gap-4 p-2 rounded-lg border bg-muted/20">
          <div className="text-xs text-muted-foreground min-w-28">
            Min Purity: <span className="font-semibold text-foreground">{minPurity[0]}%</span>
          </div>
          <Slider
            value={minPurity}
            onValueChange={setMinPurity}
            min={50}
            max={100}
            step={0.5}
            className="flex-1"
          />
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filteredSupplies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg">No matching supplies found</CardTitle>
          <CardDescription className="max-w-md mt-2 mb-6 text-sm">
            {totalCount > 0 && supplies.length === 0 ? (
              <>
                You currently have active listings as an emitter. In buyer view, your own listings
                are automatically hidden so you only see supplies from other companies.
              </>
            ) : (
              "Try adjusting your search terms, price limit, or purity threshold to find available supplies."
            )}
          </CardDescription>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setStateFilter("all");
                setMethodFilter("all");
                setMaxPrice([15000]);
                setMinPurity([70]);
              }}
            >
              Reset Filters
            </Button>
            <Button asChild>
              <Link href="/dashboard/demands/new">Post a Demand Request</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredSupplies.map((supply) => {
            const companyName = supply.companies?.name || supply.source_industry || "Industrial Emitter";
            const purity = Number(supply.purity_percentage) || 95;
            const price = Number(supply.asking_price) || 4000;
            const hasCert =
              supply.certification && Object.keys(supply.certification).length > 0;

            return (
              <Card
                key={supply.supply_id}
                className="group hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{companyName}</CardTitle>
                      </div>
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {supply.location}
                        {supply.source_industry && (
                          <span className="text-xs text-muted-foreground">
                            • {supply.source_industry}
                          </span>
                        )}
                      </CardDescription>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge variant="outline" className="text-xs bg-muted/40">
                        {supply.physical_state || "Liquid"}
                      </Badge>
                      {hasCert && (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <Shield className="h-3.5 w-3.5" />
                          Certified
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-sm bg-muted/20 p-2.5 rounded-lg">
                    <div>
                      <p className="text-muted-foreground text-xs">Available</p>
                      <p className="font-semibold mt-0.5">
                        {supply.available_quantity} {supply.quantity_unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Purity</p>
                      <p className="font-semibold mt-0.5">{purity}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Asking Price</p>
                      <p className="font-semibold mt-0.5 text-primary">
                        ₹{price.toLocaleString()}/t
                      </p>
                    </div>
                  </div>

                  {/* Purity Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Purity rating</span>
                      <span className="font-medium text-foreground">{purity}%</span>
                    </div>
                    <Progress value={Math.min(100, purity)} className="h-1.5" />
                  </div>

                  {/* Details row */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{supply.capture_method || "Industrial process"}</span>
                    </div>
                    {supply.minimum_order && (
                      <span>Min order: {supply.minimum_order} {supply.quantity_unit}</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenBid(supply, "REQUEST_QUOTE")}
                    >
                      Request Quote
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenBid(supply, "BID")}
                    >
                      Bid Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Place Bid / Quote Dialog */}
      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bidType === "BID"
                ? "Submit Bid on CO₂ Supply"
                : bidType === "BUY_NOW"
                  ? "Instant Purchase Order"
                  : "Request Official Quote"}
            </DialogTitle>
            <DialogDescription>
              {selectedSupply?.companies?.name || selectedSupply?.source_industry} •{" "}
              {selectedSupply?.location}
            </DialogDescription>
          </DialogHeader>

          {selectedSupply && (
            <form onSubmit={handleSubmitBid} className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Supply:</span>
                  <span className="font-medium">
                    {selectedSupply.available_quantity} {selectedSupply.quantity_unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seller's Asking Price:</span>
                  <span className="font-medium">
                    ₹{Number(selectedSupply.asking_price).toLocaleString()}/t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minimum Order:</span>
                  <span className="font-medium">
                    {selectedSupply.minimum_order || 10} {selectedSupply.quantity_unit}
                  </span>
                </div>
              </div>

              {/* Offered Quantity */}
              <div className="space-y-2">
                <Label htmlFor="bid_quantity">
                  Required Quantity ({selectedSupply.quantity_unit})
                </Label>
                <Input
                  id="bid_quantity"
                  type="number"
                  step="any"
                  max={Number(selectedSupply.available_quantity)}
                  min={Number(selectedSupply.minimum_order || 1)}
                  value={bidQuantity}
                  onChange={(e) => setBidQuantity(e.target.value)}
                  required
                />
              </div>

              {/* Offered Price */}
              <div className="space-y-2">
                <Label htmlFor="bid_price">
                  {bidType === "BUY_NOW" ? "Purchase Price (₹/ton)" : "Offered Price (₹/ton)"}
                </Label>
                <Input
                  id="bid_price"
                  type="number"
                  step="any"
                  value={bidPrice}
                  onChange={(e) => setBidPrice(e.target.value)}
                  disabled={bidType === "BUY_NOW"}
                  required
                />
              </div>

              {/* Total Calculation */}
              {bidQuantity && bidPrice && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border bg-primary/5 text-sm">
                  <span className="font-medium">Estimated Total Value:</span>
                  <span className="font-bold text-primary">
                    ₹{(Number(bidQuantity) * Number(bidPrice)).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="bid_notes">Notes / Delivery Instructions</Label>
                <Textarea
                  id="bid_notes"
                  rows={2}
                  placeholder="e.g. Need delivery by 25th of next month, cryogenic tanker required."
                  value={bidNotes}
                  onChange={(e) => setBidNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setBidModalOpen(false)}
                  disabled={submittingBid}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submittingBid}>
                  {submittingBid && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {bidType === "BID" ? "Submit Bid" : "Send Request"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
