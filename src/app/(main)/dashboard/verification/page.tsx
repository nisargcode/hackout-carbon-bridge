"use client";

import { useState } from "react";
import { ShieldCheck, Award, FileCheck, UploadCloud, CheckCircle, AlertTriangle, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const mockCerts = [
  {
    id: "CERT-ISO-8901",
    type: "ISO 14064 Carbon Verification",
    issuer: "Bureau Veritas India",
    date: "Aug 15, 2026",
    expires: "Aug 14, 2027",
    status: "VERIFIED",
    purityAudited: "98.5% CO2",
    hash: "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
  },
  {
    id: "CERT-LAB-4412",
    type: "Spectrometric Purity Analysis",
    issuer: "Vimta Analytical Labs",
    date: "Sep 01, 2026",
    expires: "Dec 01, 2026",
    status: "VERIFIED",
    purityAudited: "99.1% (Trace Hydrocarbons < 5ppm)",
    hash: "0x3e18a729e88b2f913d80a1c5d4f107f9035e4088a5c3176f1837d97bfa9c3391",
  },
  {
    id: "CERT-AUD-1082",
    type: "Point-Source Flue Gas Capture Audit",
    issuer: "National Clean Energy Registry",
    date: "Jul 20, 2026",
    expires: "Jul 19, 2027",
    status: "VERIFIED",
    purityAudited: "Continuous CEMS Monitored",
    hash: "0x9816da658097b3d168532f74112e4fbc871092a14e9f5509741a3cd43118bfa9",
  },
];

export default function VerificationPage() {
  const uploadDoc = () => {
    toast.success("Document uploaded successfully! Regulator audit scheduled.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Verification, Certificates & Reputation</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Independently verified laboratory test results, emission audits, and marketplace reputation scores.
          </p>
        </div>
        <Button onClick={uploadDoc}>
          <UploadCloud className="h-4 w-4 mr-1.5" /> Upload Lab Certificate
        </Button>
      </div>

      {/* Corporate Reputation Score Card */}
      <Card className="border-primary/30 bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Corporate Marketplace Reputation
              </CardTitle>
              <CardDescription className="text-xs">
                Audited operational trust metrics calculated from verifiable completed transactions.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
              <span className="text-xs font-semibold text-muted-foreground">Overall Score:</span>
              <span className="text-2xl font-black text-primary">96/100</span>
              <Badge className="bg-green-600 text-white ml-1">Tier-1 Verified</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {[
              { label: "Reliability", score: 96, desc: "On-schedule delivery commitments" },
              { label: "Purity Quality", score: 98, desc: "Lab-confirmed gas specification" },
              { label: "Logistics Delivery", score: 94, desc: "Safe cryogenic transit index" },
              { label: "Documentation", score: 100, desc: "CEMS audit & invoice compliance" },
            ].map((metric) => (
              <div key={metric.label} className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>{metric.label}</span>
                  <span className="text-primary font-bold">{metric.score}%</span>
                </div>
                <Progress value={metric.score} className="h-2" />
                <p className="text-[11px] text-muted-foreground">{metric.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certificates list */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Verified Certificates & Lab Reports</h2>
        {mockCerts.map((cert) => (
          <Card key={cert.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="py-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{cert.type}</span>
                    <Badge variant="outline" className="text-xs">{cert.id}</Badge>
                    <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs">
                      <ShieldCheck className="h-3 w-3" /> {cert.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                    <span>Issued By: <strong className="text-foreground">{cert.issuer}</strong></span>
                    <span>Issued: {cert.date}</span>
                    <span>Valid Until: {cert.expires}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Specification: <span className="font-medium text-green-600">{cert.purityAudited}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xl">
                    Blockchain Hash: {cert.hash}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success("Certificate authenticity verified on chain!")}>
                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Verify
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
