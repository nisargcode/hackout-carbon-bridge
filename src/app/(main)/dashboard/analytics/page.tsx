"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, Package, ShieldCheck, RefreshCw, IndianRupee } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

const OKLCH_COLORS = [
  "hsl(152, 60%, 42%)", // emerald green
  "hsl(217, 91%, 60%)", // royal blue
  "hsl(38, 92%, 50%)", // amber gold
  "hsl(271, 81%, 56%)", // purple
  "hsl(330, 81%, 60%)", // rose pink
  "hsl(187, 85%, 43%)", // cyan teal
];

interface RawSupply {
  supply_id: string;
  available_quantity: number;
  asking_price: number;
  physical_state: string;
  source_industry: string;
  purity_percentage: number;
  location: string;
  status: string;
}

interface RawDemand {
  request_id: string;
  required_quantity: number;
  max_price: number;
  required_purity: number;
  application: string;
  required_location: string;
  status: string;
}

interface RawContract {
  contract_id: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  contract_type: string;
  status: string;
  created_at: string;
}

interface RawShipment {
  shipment_id: string;
  quantity: number;
  status: string;
  estimated_distance_km: number;
  transportation_cost: number;
}

export default function CarbonAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw data collections
  const [supplies, setSupplies] = useState<RawSupply[]>([]);
  const [demands, setDemands] = useState<RawDemand[]>([]);
  const [contracts, setContracts] = useState<RawContract[]>([]);
  const [shipments, setShipments] = useState<RawShipment[]>([]);

  // Time filter state
  const [activeTab, setActiveTab] = useState("overview");

  async function loadMarketData() {
    try {
      const supabase = createClient();

      const [{ data: supplyData }, { data: demandData }, { data: contractData }, { data: shipmentData }] =
        await Promise.all([
          supabase.from("co2_supplies").select("*"),
          supabase.from("demand_requests").select("*"),
          supabase.from("contracts").select("*"),
          supabase.from("shipments").select("*"),
        ]);

      setSupplies(supplyData || []);
      setDemands(demandData || []);
      setContracts(contractData || []);
      setShipments(shipmentData || []);
    } catch (err) {
      console.error("Failed to load carbon market analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadMarketData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadMarketData();
  };

  // Strictly professional computed calculations
  const kpis = useMemo(() => {
    const totalAvailableSupply = supplies.reduce((sum, s) => sum + (Number(s.available_quantity) || 0), 0);

    const totalOpenDemand = demands.reduce((sum, d) => sum + (Number(d.required_quantity) || 0), 0);

    const totalContractedVolume = contracts.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);

    const totalContractValue = contracts.reduce(
      (sum, c) => sum + (Number(c.total_value) || Number(c.quantity) * Number(c.unit_price) || 0),
      0,
    );

    // Weighted average asking price per ton
    const totalSupplyValue = supplies.reduce(
      (sum, s) => sum + (Number(s.available_quantity) || 0) * (Number(s.asking_price) || 0),
      0,
    );
    const avgAskingPrice = totalAvailableSupply > 0 ? Math.round(totalSupplyValue / totalAvailableSupply) : 0;

    // Weighted average contracted realization price
    const avgContractPrice = totalContractedVolume > 0 ? Math.round(totalContractValue / totalContractedVolume) : 0;

    // Verified abatement tonnage from completed shipments
    const verifiedAbatementTons = shipments
      .filter((s) => s.status === "VERIFIED" || s.status === "DELIVERED")
      .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

    // Active in-transit tonnage
    const inTransitTons = shipments
      .filter((s) => s.status === "IN_TRANSIT")
      .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

    // Market liquidity ratio
    const liquidityRatio =
      totalAvailableSupply > 0 ? ((totalContractedVolume / totalAvailableSupply) * 100).toFixed(1) : "0.0";

    return {
      totalAvailableSupply,
      totalOpenDemand,
      totalContractedVolume,
      totalContractValue,
      avgAskingPrice,
      avgContractPrice,
      verifiedAbatementTons,
      inTransitTons,
      liquidityRatio,
    };
  }, [supplies, demands, contracts, shipments]);

  // Industry Sector Breakdown: Supply vs Demand
  const industryChartData = useMemo(() => {
    const map: Record<string, { industry: string; supply: number; demand: number }> = {};

    supplies.forEach((s) => {
      const ind = s.source_industry || "Other";
      if (!map[ind]) map[ind] = { industry: ind, supply: 0, demand: 0 };
      map[ind].supply += Number(s.available_quantity) || 0;
    });

    demands.forEach((d) => {
      const ind = d.application || "General Offtake";
      if (!map[ind]) map[ind] = { industry: ind, supply: 0, demand: 0 };
      map[ind].demand += Number(d.required_quantity) || 0;
    });

    return Object.values(map);
  }, [supplies, demands]);

  // Physical State Distribution (Liquid, Gas, Supercritical)
  const stateChartData = useMemo(() => {
    const map: Record<string, { state: string; volume: number; avgPrice: number; count: number; totalVal: number }> =
      {};

    supplies.forEach((s) => {
      const st = s.physical_state || "Liquid";
      if (!map[st]) map[st] = { state: st, volume: 0, avgPrice: 0, count: 0, totalVal: 0 };
      const qty = Number(s.available_quantity) || 0;
      const price = Number(s.asking_price) || 0;
      map[st].volume += qty;
      map[st].totalVal += qty * price;
      map[st].count += 1;
    });

    return Object.values(map).map((item) => ({
      state: item.state,
      volume: item.volume,
      avgPrice: item.volume > 0 ? Math.round(item.totalVal / item.volume) : 0,
      count: item.count,
    }));
  }, [supplies]);

  // Purity Distribution
  const purityChartData = useMemo(() => {
    let ultraHigh = 0; // > 99.5%
    let beverage = 0; // 99.0% - 99.49%
    let technical = 0; // 95.0% - 98.99%
    let industrial = 0; // < 95.0%

    supplies.forEach((s) => {
      const p = Number(s.purity_percentage) || 0;
      const q = Number(s.available_quantity) || 0;
      if (p >= 99.5) ultraHigh += q;
      else if (p >= 99.0) beverage += q;
      else if (p >= 95.0) technical += q;
      else industrial += q;
    });

    return [
      { name: "Ultra-High (>99.5%)", value: ultraHigh },
      { name: "Food/Pharma (99.0-99.5%)", value: beverage },
      { name: "Technical (95.0-98.9%)", value: technical },
      { name: "Industrial (<95.0%)", value: industrial },
    ].filter((item) => item.value > 0);
  }, [supplies]);

  // Shipment Lifecycle Pipeline
  const shipmentPipelineData = useMemo(() => {
    const statuses = [
      { key: "MATCHED", label: "Matched" },
      { key: "BOOKED", label: "Booked" },
      { key: "PICKED_UP", label: "Picked Up" },
      { key: "IN_TRANSIT", label: "In Transit" },
      { key: "DELIVERED", label: "Delivered" },
      { key: "VERIFIED", label: "Verified" },
    ];

    return statuses.map((st) => {
      const matches = shipments.filter((s) => s.status === st.key);
      const volume = matches.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
      return {
        stage: st.label,
        count: matches.length,
        volume: volume,
      };
    });
  }, [shipments]);

  // Contracts Volume & Value by Month/Batch
  const contractTrendData = useMemo(() => {
    if (contracts.length === 0) {
      return [
        {
          period: "Current Period",
          volume: kpis.totalContractedVolume,
          value: Math.round(kpis.totalContractValue / 100000),
        },
      ];
    }

    const map: Record<string, { period: string; volume: number; value: number }> = {};
    contracts.forEach((c) => {
      const date = c.created_at ? new Date(c.created_at) : new Date();
      const key = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!map[key]) map[key] = { period: key, volume: 0, value: 0 };
      map[key].volume += Number(c.quantity) || 0;
      map[key].value += Math.round((Number(c.total_value) || Number(c.quantity) * Number(c.unit_price) || 0) / 100000); // In Lakhs
    });

    return Object.values(map);
  }, [contracts, kpis]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-foreground">
            Carbon Marketplace & Industrial Analytics
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time trade telemetry, physical state pricing, supply-demand liquidity, and verified abatement metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Syncing DB..." : "Refresh Live Data"}
          </Button>
        </div>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Marketplace Supply Available</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-foreground">{kpis.totalAvailableSupply.toLocaleString()} MT</div>
            <p className="text-muted-foreground text-xs mt-1">Across {supplies.length} active producer batches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contracted Trading Volume</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-foreground">{kpis.totalContractedVolume.toLocaleString()} MT</div>
            <p className="text-muted-foreground text-xs mt-1">{kpis.liquidityRatio}% market absorption rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weighted Avg CO Price</CardTitle>
            <IndianRupee className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-foreground">{kpis.avgAskingPrice.toLocaleString()}/MT</div>
            <p className="text-muted-foreground text-xs mt-1">
              Realized Contract: ?
              {kpis.avgContractPrice ? kpis.avgContractPrice.toLocaleString() : kpis.avgAskingPrice.toLocaleString()}/MT
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Abatement Displaced</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-emerald-600">{kpis.verifiedAbatementTons.toLocaleString()} MT</div>
            <p className="text-muted-foreground text-xs mt-1">
              {kpis.inTransitTons > 0
                ? `+${kpis.inTransitTons.toLocaleString()} MT in transit`
                : "Statutory verified offtake"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto">
          <TabsTrigger value="overview">Marketplace Overview</TabsTrigger>
          <TabsTrigger value="states">Physical States & Pricing</TabsTrigger>
          <TabsTrigger value="industries">Sector Supply vs Demand</TabsTrigger>
          <TabsTrigger value="logistics">Logistics Pipeline</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contract Volume & Value Trend */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Executed Offtake Value & Volume</CardTitle>
                    <CardDescription>Actual settled and active legally-binding contracts from Supabase</CardDescription>
                  </div>
                  <Badge variant="outline">Live DB</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contractTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="left" orientation="left" stroke="hsl(152, 60%, 42%)" tick={{ fontSize: 12 }} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(217, 91%, 60%)" tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        yAxisId="left"
                        dataKey="volume"
                        name="Volume (MT)"
                        fill="hsl(152, 60%, 42%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="value"
                        name="Value (Lakhs)"
                        fill="hsl(217, 91%, 60%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Purity Distribution */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Purity Distribution of Available CO?</CardTitle>
                    <CardDescription>
                      Categorized by assay purity percentage from registered emitter listings
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Assay Grades</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full flex items-center justify-center">
                  {purityChartData.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm">No certified supplies listed yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={purityChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={95}
                          innerRadius={55}
                          paddingAngle={3}
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {purityChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={OKLCH_COLORS[index % OKLCH_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [`${Number(value).toLocaleString()} MT`, "Volume"]}
                          contentStyle={{
                            backgroundColor: "var(--background)",
                            borderColor: "var(--border)",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: PHYSICAL STATES & PRICING */}
        <TabsContent value="states" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Price by Physical State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Asking Price by State</CardTitle>
                <CardDescription>
                  Comparison of Gas, Cryogenic Liquid, and Supercritical fluid rates (?/MT)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="state" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(val: any) => [`?${Number(val).toLocaleString()}/MT`, "Avg Price"]}
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="avgPrice" name="Avg Price (?/MT)" fill="hsl(38, 92%, 50%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Volume by Physical State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Available Volume by Physical State</CardTitle>
                <CardDescription>Gross inventory distribution across state phases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateChartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="state" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} MT`, "Available Volume"]}
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="volume" name="Volume (MT)" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 3: INDUSTRY SECTORS */}
        <TabsContent value="industries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Sector Supply vs. Offtake Demand (MT)</CardTitle>
                  <CardDescription>
                    Direct comparison of captured industrial supply versus buyer demand across sectors
                  </CardDescription>
                </div>
                <Badge variant="outline">Liquidity Balance</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {industryChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    No sector data available.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={industryChartData} margin={{ top: 10, right: 30, left: 10, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="industry" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(val: any) => [`${Number(val).toLocaleString()} MT`]}
                        contentStyle={{
                          backgroundColor: "var(--background)",
                          borderColor: "var(--border)",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend verticalAlign="top" height={36} />
                      <Bar
                        dataKey="supply"
                        name="Captured Supply (MT)"
                        fill="hsl(152, 60%, 42%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="demand"
                        name="Requested Demand (MT)"
                        fill="hsl(271, 81%, 56%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: LOGISTICS PIPELINE */}
        <TabsContent value="logistics" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Shipment & Hazmat Lifecycle Pipeline</CardTitle>
                  <CardDescription>Tracking tons through the 6 statutory custody-transfer stages</CardDescription>
                </div>
                <Badge className="bg-blue-600 text-white">Cryogenic Fleet</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shipmentPipelineData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === "volume" ? `${Number(val).toLocaleString()} MT` : `${val} consignments`,
                        name === "volume" ? "Tonnage" : "Consignments",
                      ]}
                      contentStyle={{
                        backgroundColor: "var(--background)",
                        borderColor: "var(--border)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="volume" name="Tonnage (MT)" fill="hsl(187, 85%, 43%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
