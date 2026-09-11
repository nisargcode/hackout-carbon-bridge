"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, MapPin, Shield, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

// Static demo matches for UI completeness (real matches come from backend matching engine via API)
const demoMatches = [
  {
    match_id: "M001",
    score: 94,
    company: "Steel Corp India",
    location: "Mumbai, MH",
    quantity: "500 tons",
    purity: 98.5,
    price: 4200,
    certification: true,
    breakdown: { purity: 25, quantity: 20, price: 18, distance: 9, availability: 14, cert: 8 },
  },
  {
    match_id: "M002",
    score: 87,
    company: "PowerGen Ltd.",
    location: "Surat, GJ",
    quantity: "800 tons",
    purity: 96.2,
    price: 3800,
    certification: true,
    breakdown: { purity: 22, quantity: 20, price: 20, distance: 7, availability: 13, cert: 5 },
  },
  {
    match_id: "M003",
    score: 79,
    company: "RefineryCo",
    location: "Chennai, TN",
    quantity: "1200 tons",
    purity: 95.0,
    price: 3500,
    certification: false,
    breakdown: { purity: 20, quantity: 20, price: 20, distance: 5, availability: 10, cert: 4 },
  },
];

export default function MatchesPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-bold text-2xl text-foreground">AI Matches</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Intelligent matches scored across purity, quantity, distance, price, availability, and certification.
          </p>
        </div>
      </div>

      {/* Score legend */}
      <div className="flex gap-4 text-sm flex-wrap">
        {[
          { label: "Excellent (90-100%)", color: "bg-green-500" },
          { label: "Good (75-89%)", color: "bg-yellow-500" },
          { label: "Fair (< 75%)", color: "bg-orange-500" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
            <span className="text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Matches */}
      <div className="space-y-4">
        {demoMatches.map((m) => (
          <Card key={m.match_id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{m.company}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {m.location}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-2xl">{m.score}</span>
                    <span className="text-muted-foreground text-sm">/100</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {m.certification && (
                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Certified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main info */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Quantity</p>
                  <p className="font-medium">{m.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Purity</p>
                  <p className="font-medium">{m.purity}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Price</p>
                  <p className="font-medium">₹{m.price.toLocaleString()}/t</p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Score Breakdown</p>
                <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-xs">
                  {Object.entries(m.breakdown).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-muted-foreground capitalize">{key}</span>
                      <span className="font-medium">{val} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall progress */}
              <div className="space-y-1">
                <Progress value={m.score} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">{m.score}% overall match</p>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">Request Quote</Button>
                <Button size="sm" className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept & Bid
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
