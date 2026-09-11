"use client";

import { useState } from "react";
import { Forklift, MapPin, DollarSign, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Job {
  id: string;
  route: string;
  distance: string;
  quantity: string;
  state: string;
  deadline: string;
  budget: number;
  currentBids: number;
  lowestBid: number;
}

const mockJobs: Job[] = [
  {
    id: "JOB-401",
    route: "Mumbai (ABC Cement) → Pune (CleanFuel)",
    distance: "148 km",
    quantity: "200 tons",
    state: "Cryogenic Liquid (-20°C)",
    deadline: "Sep 20, 2026",
    budget: 42000,
    currentBids: 3,
    lowestBid: 38000,
  },
  {
    id: "JOB-402",
    route: "Surat (PowerGen) → Ahmedabad (GreenTech)",
    distance: "260 km",
    quantity: "350 tons",
    state: "Pressurized Gas (20 bar)",
    deadline: "Sep 23, 2026",
    budget: 60000,
    currentBids: 2,
    lowestBid: 55000,
  },
  {
    id: "JOB-403",
    route: "Chennai (RefineryCo) → Bengaluru (BioSynthetics)",
    distance: "345 km",
    quantity: "150 tons",
    state: "Cryogenic Liquid",
    deadline: "Sep 25, 2026",
    budget: 48000,
    currentBids: 4,
    lowestBid: 41000,
  },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [bidAmount, setBidAmount] = useState("");

  const submitBid = () => {
    if (!selectedJob || !bidAmount) return;
    toast.success(`Transportation bid of ₹${bidAmount} submitted for ${selectedJob.id}!`);
    setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, currentBids: j.currentBids + 1, lowestBid: Math.min(j.lowestBid, Number(bidAmount)) } : j));
    setSelectedJob(null);
    setBidAmount("");
  };

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

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{job.route}</CardTitle>
                    <Badge variant="outline">{job.id}</Badge>
                    <Badge className="bg-blue-600 text-white text-xs">{job.state}</Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Distance: {job.distance} · Delivery by: {job.deadline}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Target Budget</div>
                  <div className="text-lg font-bold text-foreground">₹{job.budget.toLocaleString()}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm bg-muted/40 p-3 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <p className="font-semibold text-foreground">{job.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Competing Bids</p>
                  <p className="font-semibold text-foreground">{job.currentBids} Carriers</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lowest Bid So Far</p>
                  <p className="font-semibold text-green-600">₹{job.lowestBid.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4 text-green-600" /> Cryogenic Hazmat Insurance Required
                </span>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => { setSelectedJob(job); setBidAmount((job.lowestBid - 1000).toString()); }}>
                      Place Logistics Bid <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bid on Hauling Job {job.id}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-3">
                      <p className="text-sm text-muted-foreground">{job.route} ({job.distance})</p>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted-foreground">Your Freight Quote (INR)</label>
                        <Input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="Amount in ₹" />
                      </div>
                      <Button className="w-full" onClick={submitBid}>Submit Verified Quote</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
