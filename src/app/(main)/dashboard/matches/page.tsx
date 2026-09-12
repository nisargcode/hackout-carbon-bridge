"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, MapPin, Shield, CheckCircle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface ScoredMatch {
  supply_id: string;
  score: number;
  company: string;
  location: string;
  quantity: string;
  purity: number;
  price: number;
  certification: boolean;
  breakdown: {
    purity: number;
    quantity: number;
    price: number;
    distance: number;
    availability: number;
    cert: number;
  };
}

export default function MatchesPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<ScoredMatch[]>([]);

  useEffect(() => {
    async function calculateMatches() {
      try {
        const supabase = createClient();

        // 1. Fetch buyer's open demand (if any) to match against
        let targetDemand = {
          purity: 97.0,
          quantity: 200,
          max_price: 4500,
          location: company?.location || "Maharashtra",
        };

        if (company?.company_id) {
          const { data: userDemands } = await supabase
            .from("demand_requests")
            .select("*")
            .eq("buyer_id", company.company_id)
            .limit(1);

          if (userDemands && userDemands.length > 0) {
            targetDemand = {
              purity: parseFloat(userDemands[0].required_purity) || 97.0,
              quantity: parseFloat(userDemands[0].required_quantity) || 200,
              max_price: parseFloat(userDemands[0].max_price) || 4500,
              location: userDemands[0].required_location || company?.location || "Maharashtra",
            };
          }
        }

        // 2. Fetch available supplies from database
        const { data: supplies } = await supabase
          .from("co2_supplies")
          .select("*, companies:emitter_id(name, location)")
          .order("created_at", { ascending: false });

        const otherSupplies = (supplies || []).filter(
          (s) => !company?.company_id || s.emitter_id !== company.company_id,
        );

        if (otherSupplies.length === 0) {
          setMatches([]);
          return;
        }

        // 3. Score each supply against the demand parameters
        const scored: ScoredMatch[] = otherSupplies.map((s) => {
          const sPurity = parseFloat(s.purity_percentage) || 95;
          const sQty = parseFloat(s.available_quantity) || 100;
          const sPrice = parseFloat(s.asking_price) || 4000;
          const hasCert = !!s.certification && Object.keys(s.certification).length > 0;

          // Purity score (25 pts max)
          const purityPts =
            sPurity >= targetDemand.purity ? 25 : Math.max(10, Math.round(25 - (targetDemand.purity - sPurity) * 5));

          // Quantity score (20 pts max)
          const qtyRatio = sQty / targetDemand.quantity;
          const qtyPts = qtyRatio >= 1 ? 20 : Math.round(qtyRatio * 20);

          // Price score (20 pts max)
          const pricePts =
            sPrice <= targetDemand.max_price
              ? 20
              : Math.max(5, Math.round(20 - ((sPrice - targetDemand.max_price) / 100) * 2));

          // Distance / Location score (15 pts max)
          const sameLoc = s.location?.toLowerCase().includes(targetDemand.location.toLowerCase().split(",")[0]);
          const distancePts = sameLoc ? 15 : 9;

          // Availability score (10 pts max)
          const availPts = s.status === "AVAILABLE" ? 10 : 6;

          // Cert score (10 pts max)
          const certPts = hasCert ? 10 : 5;

          const totalScore = Math.min(
            100,
            Math.max(40, purityPts + qtyPts + pricePts + distancePts + availPts + certPts),
          );

          return {
            supply_id: s.supply_id,
            score: totalScore,
            company: s.companies?.name || "Industrial Emitter",
            location: s.location || "India",
            quantity: `${sQty.toLocaleString()} tons`,
            purity: sPurity,
            price: sPrice,
            certification: hasCert,
            breakdown: {
              purity: purityPts,
              quantity: qtyPts,
              price: pricePts,
              distance: distancePts,
              availability: availPts,
              cert: certPts,
            },
          };
        });

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        setMatches(scored);
      } catch (err) {
        console.error("Failed to run AI matching engine:", err);
      } finally {
        setLoading(false);
      }
    }

    calculateMatches();
  }, [company?.company_id, company?.location]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-bold text-2xl text-foreground">AI Matches Engine</h1>
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
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground space-y-3">
            <Package className="h-10 w-10 mx-auto stroke-1" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-base">No Matching Supplies Available</p>
              <p className="text-sm">
                When industrial emitters publish CO₂ supply listings, the AI matching engine will compute compatibility
                scores here.
              </p>
            </div>
            <Button asChild className="mt-2">
              <Link href="/dashboard/create-demand">Create Demand Specification</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {matches.map((m) => (
            <Card key={m.supply_id} className="hover:shadow-md transition-shadow">
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
                    <p className="text-muted-foreground text-xs">Available Volume</p>
                    <p className="font-medium">{m.quantity}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Purity</p>
                    <p className="font-medium">{m.purity}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Asking Price</p>
                    <p className="font-medium">Rs. {m.price.toLocaleString()}/t</p>
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
                  <p className="text-xs text-muted-foreground text-right">{m.score}% overall compatibility</p>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <Link href={`/dashboard/marketplace`}>View Full Specs</Link>
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      toast.success(`Trade proposal initiated with ${m.company}!`);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Place Purchase Bid
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
