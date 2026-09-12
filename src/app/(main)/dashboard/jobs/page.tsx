"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Forklift, MapPin, DollarSign, Clock, ShieldCheck, ArrowRight, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export default function JobsPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [bidAmount, setBidAmount] = useState("");

  const fetchJobs = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("shipments")
        .select("*, supplier:supplier_id(name), buyer:buyer_id(name)")
        .is("logistics_provider", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading jobs:", error);
      } else {
        setJobs(data || []);
      }
    } catch (err) {
      console.error("Failed to load open jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const submitBid = async () => {
    if (!selectedJob || !bidAmount) return;
    try {
      const supabase = createClient();
      // Record the carrier bid into logistics_bids table
      const { error } = await supabase.from("logistics_bids").insert({
        shipment_id: selectedJob.shipment_id,
        provider_id: company?.company_id,
        bid_amount: Number(bidAmount),
        estimated_hours: Math.round((selectedJob.estimated_distance || 150) / 40),
        bid_status: "SUBMITTED",
      });

      if (error) {
        toast.error(`Bid submission failed: ${error.message}`);
        return;
      }

      toast.success(`Transportation bid of ₹${Number(bidAmount).toLocaleString()} submitted!`);
      setSelectedJob(null);
      setBidAmount("");
      fetchJobs();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Logistics Job Board</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse verified industrial CO₂ transportation requests and submit competitive hauling bids.
          </p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <Forklift className="h-10 w-10 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-base">No Open Hauling Jobs Available</p>
              <p className="text-sm">
                When bilateral CO₂ trades are executed between emitters and buyers, loads requiring transport will appear here for carrier bids.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Return to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.shipment_id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {job.pickup_location} → {job.destination}
                      </CardTitle>
                      <Badge variant="outline">{job.shipment_id.slice(0, 8)}</Badge>
                      <Badge className="bg-blue-600 text-white text-xs">Cryogenic Liquid</Badge>
                    </div>
                    <CardDescription className="text-xs mt-1">
                      Shipper: {job.supplier?.name || "CO2 Supplier"} · Receiver: {job.buyer?.name || "Buyer"} · Distance: ~{job.estimated_distance || 150} km
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Target Freight</div>
                    <div className="text-lg font-bold text-foreground">
                      ₹{job.transportation_cost ? Number(job.transportation_cost).toLocaleString() : "Quote"}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm bg-muted/40 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="font-semibold text-foreground">{job.quantity} tons</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dispatch Window</p>
                    <p className="font-semibold text-foreground">
                      {job.estimated_delivery ? new Date(job.estimated_delivery).toLocaleDateString() : "Immediate"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Logistics Status</p>
                    <p className="font-semibold text-amber-600">Awaiting Carrier Bid</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-green-600" /> Cryogenic Hazmat Insurance Required
                  </span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job);
                          setBidAmount(job.transportation_cost?.toString() || "35000");
                        }}
                      >
                        Place Logistics Bid <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Bid on Hauling Job {job.shipment_id.slice(0, 8)}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-3">
                        <p className="text-sm text-muted-foreground">
                          {job.pickup_location} → {job.destination} ({job.quantity} tons)
                        </p>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted-foreground">Your Freight Quote (INR)</label>
                          <Input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder="Amount in ₹"
                          />
                        </div>
                        <Button className="w-full" onClick={submitBid}>
                          Submit Carrier Quote
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
