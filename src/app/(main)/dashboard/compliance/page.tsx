"use client";

import { useEffect, useState, useMemo } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, FileCheck, RefreshCw, Building2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

interface CompanyItem {
  company_id: string;
  name: string;
  industry: string;
  verification_status: boolean;
  sustainability_score: number;
}

interface CertItem {
  certificate_id: string;
  company_id: string;
  certificate_type: string;
  certificate_number: string;
  purity_certified: number;
  verified_by: string;
  verification_status: boolean;
  expires_at: string;
  created_at: string;
  companies?: { name: string };
}

interface ShipmentItem {
  quantity: number;
  status: string;
}

export default function CompliancePage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [certificates, setCertificates] = useState<CertItem[]>([]);
  const [shipments, setShipments] = useState<ShipmentItem[]>([]);

  async function loadComplianceData() {
    try {
      const supabase = createClient();

      const [{ data: compData }, { data: certData }, { data: shipData }] = await Promise.all([
        supabase.from("companies").select("company_id, name, industry, verification_status, sustainability_score"),
        supabase.from("certificates").select("*, companies:company_id(name)"),
        supabase.from("shipments").select("quantity, status"),
      ]);

      setCompanies(compData || []);
      setCertificates(certData || []);
      setShipments(shipData || []);
    } catch (err) {
      console.error("Failed to load compliance data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadComplianceData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadComplianceData();
  };

  const metrics = useMemo(() => {
    const totalCompanies = companies.length;
    const verifiedCompanies = companies.filter((c) => c.verification_status).length;
    const complianceRate = totalCompanies > 0 ? Math.round((verifiedCompanies / totalCompanies) * 1000) / 10 : 100;

    const unverifiedCount = totalCompanies - verifiedCompanies;
    const pendingCerts = certificates.filter((c) => !c.verification_status).length;

    const totalVerifiedCO2 = shipments
      .filter((s) => s.status === "VERIFIED" || s.status === "DELIVERED")
      .reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

    const avgSustainabilityScore =
      totalCompanies > 0
        ? Math.round(companies.reduce((sum, c) => sum + (Number(c.sustainability_score) || 0), 0) / totalCompanies)
        : 0;

    return {
      totalCompanies,
      verifiedCompanies,
      complianceRate,
      unverifiedCount,
      pendingCerts,
      totalVerifiedCO2,
      avgSustainabilityScore,
    };
  }, [companies, certificates, shipments]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Statutory Regulatory Compliance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time verification benchmarks, statutory certification audits, and mandatory ESG standards tracking.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Syncing..." : "Refresh Audit Data"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Marketplace Compliance Index</span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-emerald-600">{metrics.complianceRate}%</div>
            <Progress value={metrics.complianceRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.verifiedCompanies} of {metrics.totalCompanies} registered entities accredited
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Active Compliance Inquiries</span>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-amber-500">
              {metrics.pendingCerts + metrics.unverifiedCount} Pending
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.unverifiedCount} identity verifications ? {metrics.pendingCerts} lab assay renewals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              <span>Total Verified Displaced CO?</span>
              <FileCheck className="h-4 w-4 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-foreground">{metrics.totalVerifiedCO2.toLocaleString()} MT</div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg enterprise ESG score: {metrics.avgSustainabilityScore}/100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Verified Entities & Certificates Ledger */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Registered Entities Compliance Roster</CardTitle>
              <CardDescription>Statutory accreditation records from the live regulatory database</CardDescription>
            </div>
            <Badge variant="outline">{companies.length} Corporations</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {companies.map((c) => (
              <div
                key={c.company_id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-border rounded-lg bg-muted/20 gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{c.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {c.industry}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sustainability Index: {c.sustainability_score || "N/A"}/100 ? UUID:{" "}
                    {c.company_id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={c.verification_status ? "default" : "secondary"}
                    className={c.verification_status ? "bg-emerald-600 text-white" : ""}
                  >
                    {c.verification_status ? "ACCREDITED" : "PENDING AUDIT"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
