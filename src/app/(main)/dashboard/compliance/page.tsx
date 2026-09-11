"use client";

import { ShieldCheck, CheckCircle2, AlertTriangle, FileCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Statutory Regulatory Compliance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          National carbon credit eligibility benchmarks, safety standards, and ESG framework alignment.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Marketplace Compliance Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-green-600">99.4%</div>
            <Progress value={99.4} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">Across 340 registered corporate entities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Non-Compliance Flags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-amber-500">0 Critical</div>
            <p className="text-xs text-muted-foreground mt-1">2 minor documentation renewals pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Verified Recycled CO₂</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl text-foreground">48,200 tons</div>
            <p className="text-xs text-muted-foreground mt-1">Directly displaced fossil emissions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
