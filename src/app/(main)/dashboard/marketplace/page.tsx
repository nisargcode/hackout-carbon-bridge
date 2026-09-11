"use client";

import { useState } from "react";
import { Search, Filter, MapPin, Leaf, Shield } from "lucide-react";
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

const supplies = [
  {
    id: "S001",
    company: "Steel Corp India",
    location: "Mumbai, MH",
    quantity: "500 tons",
    purity: 98.5,
    price: 4200,
    captureMethod: "Post-combustion",
    physicalState: "Liquid",
    certification: true,
    matchScore: 94,
    availableUntil: "Oct 15, 2026",
  },
  {
    id: "S002",
    company: "PowerGen Ltd.",
    location: "Surat, GJ",
    quantity: "800 tons",
    purity: 96.2,
    price: 3800,
    captureMethod: "Pre-combustion",
    physicalState: "Gas",
    certification: true,
    matchScore: 87,
    availableUntil: "Nov 1, 2026",
  },
  {
    id: "S003",
    company: "CementCo",
    location: "Jaipur, RJ",
    quantity: "300 tons",
    purity: 99.1,
    price: 4800,
    captureMethod: "Direct air capture",
    physicalState: "Liquid",
    certification: true,
    matchScore: 91,
    availableUntil: "Sep 30, 2026",
  },
  {
    id: "S004",
    company: "RefineryCo",
    location: "Chennai, TN",
    quantity: "1200 tons",
    purity: 95.0,
    price: 3500,
    captureMethod: "Post-combustion",
    physicalState: "Gas",
    certification: false,
    matchScore: 72,
    availableUntil: "Dec 1, 2026",
  },
];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState([6000]);
  const [minPurity, setMinPurity] = useState([90]);

  const filtered = supplies.filter(
    (s) =>
      s.company.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Browse Supplies</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Discover and bid on verified CO₂ supplies matched to your requirements.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Physical state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All states</SelectItem>
            <SelectItem value="liquid">Liquid</SelectItem>
            <SelectItem value="gas">Gas</SelectItem>
            <SelectItem value="solid">Solid</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Capture method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            <SelectItem value="post">Post-combustion</SelectItem>
            <SelectItem value="pre">Pre-combustion</SelectItem>
            <SelectItem value="dac">Direct air capture</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-3 min-w-48">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Max ₹{maxPrice[0]}/t</span>
          <Slider
            value={maxPrice}
            onValueChange={setMaxPrice}
            min={1000}
            max={10000}
            step={100}
            className="w-32"
          />
        </div>
      </div>

      {/* Results */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((supply) => (
          <Card key={supply.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{supply.company}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {supply.location}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    className="text-xs"
                    style={{
                      background:
                        supply.matchScore >= 90
                          ? "oklch(0.532 0.157 131.589)"
                          : supply.matchScore >= 80
                            ? "oklch(0.705 0.157 51.544)"
                            : "oklch(0.577 0.245 27.325)",
                      color: "white",
                    }}
                  >
                    {supply.matchScore}% match
                  </Badge>
                  {supply.certification && (
                    <div className="flex items-center gap-1 text-green-600 text-xs">
                      <Shield className="h-3 w-3" />
                      Certified
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Quantity</p>
                  <p className="font-medium">{supply.quantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Purity</p>
                  <p className="font-medium">{supply.purity}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Price</p>
                  <p className="font-medium">₹{supply.price.toLocaleString()}/t</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Purity</span>
                  <span>{supply.purity}%</span>
                </div>
                <Progress value={supply.purity} className="h-1.5" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Leaf className="h-3 w-3" />
                  {supply.captureMethod} · {supply.physicalState}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">Request Quote</Button>
                  <Button size="sm">Bid Now</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
