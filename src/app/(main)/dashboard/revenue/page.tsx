"use client";

import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  ArrowUpRight,
  BarChart3,
  Download,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface ContractRecord {
  contract_id: string;
  supply_id: string;
  buyer_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  contract_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  buyer?: { company_id: string; name: string; location: string };
  seller?: { company_id: string; name: string; location: string };
}

export default function RevenuePage() {
  const { company, companyType } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contracts, setContracts] = useState<ContractRecord[]>([]);

  async function loadRevenueData() {
    try {
      const supabase = createClient();

      let query = supabase
        .from("contracts")
        .select(
          "*, buyer:companies!buyer_id(company_id, name, location), seller:companies!seller_id(company_id, name, location)",
        )
        .order("created_at", { ascending: false });

      if (company?.company_id && (companyType === "EMITTER" || companyType === "CO2_BUYER")) {
        if (companyType === "EMITTER") {
          query = query.eq("seller_id", company.company_id);
        } else {
          query = query.eq("buyer_id", company.company_id);
        }
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching contracts for revenue:", error);
      } else {
        setContracts(data || []);
      }
    } catch (err) {
      console.error("Failed to load revenue data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadRevenueData();
  }, [company?.company_id, companyType]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadRevenueData();
  };

  // Strictly accurate financial metrics
  const financialStats = useMemo(() => {
    let totalGross = 0;
    let escrowSecured = 0;
    let netSettled = 0;
    let totalVolume = 0;

    contracts.forEach((c) => {
      const val = Number(c.total_value) || Number(c.quantity) * Number(c.unit_price) || 0;
      const vol = Number(c.quantity) || 0;

      totalGross += val;
      totalVolume += vol;

      if (c.status === "COMPLETED") {
        netSettled += val;
      } else if (c.status === "ACTIVE" || c.status === "PENDING") {
        escrowSecured += val;
      }
    });

    const avgPrice = totalVolume > 0 ? Math.round(totalGross / totalVolume) : 0;

    return {
      totalGross,
      escrowSecured,
      netSettled,
      avgPrice,
      totalVolume,
      contractCount: contracts.length,
    };
  }, [contracts]);

  // Interactive Monthly Cashflow Chart Data
  const chartData = useMemo(() => {
    if (contracts.length === 0) {
      return [{ period: "Current Period", settled: 0, escrow: 0, total: 0 }];
    }

    const map: Record<string, { period: string; settled: number; escrow: number; total: number }> = {};

    contracts.forEach((c) => {
      const date = c.created_at ? new Date(c.created_at) : new Date();
      const period = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      if (!map[period]) {
        map[period] = { period, settled: 0, escrow: 0, total: 0 };
      }

      const val = Number(c.total_value) || Number(c.quantity) * Number(c.unit_price) || 0;
      map[period].total += val;
      if (c.status === "COMPLETED") {
        map[period].settled += val;
      } else {
        map[period].escrow += val;
      }
    });

    return Object.values(map);
  }, [contracts]);

  const exportSettlementStatement = () => {
    if (contracts.length === 0) {
      toast.error("No settlement records available to export.");
      return;
    }

    const headers = [
      "Contract ID",
      "Counterparty",
      "Quantity (MT)",
      "Unit Price (INR)",
      "Total Value (INR)",
      "Status",
      "Date",
    ];
    const rows = contracts.map((c) => [
      c.contract_id,
      companyType === "CO2_BUYER" ? c.seller?.name || "Supplier" : c.buyer?.name || "Offtaker",
      c.quantity,
      c.unit_price,
      c.total_value || c.quantity * c.unit_price,
      c.status,
      c.created_at ? new Date(c.created_at).toISOString().split("T")[0] : "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CarbonBridge_Settlements_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Settlement statement exported successfully.");
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `?${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `?${(amount / 100000).toFixed(2)}L`;
    }
    return `?${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl tracking-tight text-foreground">Revenue & Financial Settlements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Realized cash flows, escrow security balances, and off-take transaction settlements from executed contracts.
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
            {refreshing ? "Syncing..." : "Refresh"}
          </Button>
          <Button
            size="sm"
            onClick={exportSettlementStatement}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export Statement
          </Button>
        </div>
      </div>

      {/* Calculated Financial KPI Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>{companyType === "CO2_BUYER" ? "Total Procurement Value" : "Gross Contract Revenue"}</span>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-foreground">{formatCurrency(financialStats.totalGross)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {financialStats.contractCount} legally-binding contract{financialStats.contractCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Escrow Secured</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-blue-600">{formatCurrency(financialStats.escrowSecured)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Active custody & transit guarantees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Net Settled Disbursements</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-emerald-600">{formatCurrency(financialStats.netSettled)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Verified & completed consignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Realized Avg Price</span>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-foreground">
              {financialStats.avgPrice > 0 ? `?${financialStats.avgPrice.toLocaleString()}/MT` : "?0/MT"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Across {financialStats.totalVolume.toLocaleString()} MT traded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Financial Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Revenue & Escrow Cashflow Trends</CardTitle>
              <CardDescription>Real-time breakdown of settled funds versus in-flight escrow protection</CardDescription>
            </div>
            <Badge variant="outline">Live Ledger</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="settledGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(152, 60%, 42%)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="escrowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(val) => (val >= 100000 ? `?${val / 100000}L` : `?${val}`)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(val: any) => [`?${Number(val).toLocaleString()}`, "Amount"]}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area
                  type="monotone"
                  dataKey="settled"
                  name="Settled Payouts"
                  stroke="hsl(152, 60%, 42%)"
                  fillOpacity={1}
                  fill="url(#settledGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="escrow"
                  name="Secured Escrow"
                  stroke="hsl(217, 91%, 60%)"
                  fillOpacity={1}
                  fill="url(#escrowGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Settlement Transactions List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Executed Settlement Ledger</CardTitle>
              <CardDescription>
                Direct clearing for delivered, verified, and active industrial CO? agreements
              </CardDescription>
            </div>
            <Badge variant="outline">{contracts.length} Records</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-3">
              <FileSpreadsheet className="h-10 w-10 mx-auto stroke-1" />
              <p className="text-sm font-medium">No contract settlements found.</p>
              <p className="text-xs max-w-sm mx-auto">
                Once negotiations and bids are accepted, legally-binding contract records and settlements will populate
                automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((tx) => {
                const counterparty =
                  companyType === "CO2_BUYER"
                    ? tx.seller?.name || "Seller Facility"
                    : tx.buyer?.name || "Industrial Buyer";
                const amount = Number(tx.total_value) || Number(tx.quantity) * Number(tx.unit_price) || 0;
                const dateStr = tx.created_at
                  ? new Date(tx.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Recent";
                const isSettled = tx.status === "COMPLETED";

                return (
                  <div
                    key={tx.contract_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-border rounded-lg bg-muted/20 gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{counterparty}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {tx.contract_type || "SPOT"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ID: {tx.contract_id.slice(0, 8).toUpperCase()} ? {tx.quantity} MT @ ?
                        {Number(tx.unit_price).toLocaleString()}/MT ? {dateStr}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <span className="font-bold text-base text-foreground">?{amount.toLocaleString()}</span>
                      <Badge
                        variant={isSettled ? "default" : "outline"}
                        className={
                          isSettled
                            ? "bg-emerald-600 text-white hover:bg-emerald-600"
                            : tx.status === "ACTIVE"
                              ? "border-blue-500 text-blue-600 dark:text-blue-400"
                              : ""
                        }
                      >
                        {isSettled ? "SETTLED" : tx.status === "ACTIVE" ? "IN ESCROW" : tx.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
