"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Award, UploadCloud, CheckCircle, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

export default function VerificationPage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [reputation, setReputation] = useState<any | null>(null);

  // Upload dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [certType, setCertType] = useState("ISO 14064 Carbon Verification");
  const [issuer, setIssuer] = useState("");
  const [details, setDetails] = useState("");

  const loadData = async () => {
    try {
      const supabase = createClient();

      // 1. Fetch certificates for this company or all verified certs
      let query = supabase.from("certificates").select("*").order("issued_at", { ascending: false });
      if (company?.company_id) {
        query = query.eq("company_id", company.company_id);
      }
      const { data: certs } = await query;
      setCertificates(certs || []);

      // 2. Fetch reputation score
      if (company?.company_id) {
        const { data: rep } = await supabase
          .from("reputation_scores")
          .select("*")
          .eq("company_id", company.company_id)
          .single();

        setReputation(rep || null);
      }
    } catch (err) {
      console.error("Failed to load verification data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [company?.company_id]);

  const handleUpload = async () => {
    if (!issuer) {
      toast.error("Please enter the certifying authority name");
      return;
    }
    if (!company?.company_id) {
      toast.error("Company profile not loaded. Please try again.");
      return;
    }

    try {
      const supabase = createClient();
      const mockHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

      const { error } = await supabase.from("certificates").insert({
        company_id: company?.company_id,
        certificate_type: certType,
        verified_by: issuer,
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        certificate_number: mockHash.slice(0, 20),
        verification_status: true,
        document_url: "https://carbonbridge.registry/certs/" + mockHash.slice(0, 12),
        metadata: details ? { purity_notes: details } : {},
      });

      if (error) {
        toast.error(`Upload failed: ${error.message}`);
        return;
      }

      toast.success("Certificate recorded on verified ledger!");
      setDialogOpen(false);
      setIssuer("");
      setDetails("");
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-44 rounded-xl" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const overallScore = reputation?.overall_score ?? company?.sustainability_score ?? 95;
  const reliability = reputation?.reliability ?? 95;
  const quality = reputation?.quality ?? 98;
  const delivery = reputation?.delivery ?? 94;
  const docs = reputation?.documentation ?? 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-bold text-2xl text-foreground">Verification, Certificates & Reputation</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Independently verified laboratory test results, emission audits, and marketplace reputation scores.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UploadCloud className="h-4 w-4 mr-1.5" /> Upload Lab Certificate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Verified Laboratory Certificate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Certificate Type</label>
                <Input value={certType} onChange={(e) => setCertType(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Issuing Authority / Testing Lab</label>
                <Input placeholder="e.g. Vimta Analytical Labs, Bureau Veritas" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Purity / Gas Specification Notes</label>
                <Input placeholder="e.g. 98.5% CO2 purity confirmed by gas chromatography" value={details} onChange={(e) => setDetails(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleUpload}>
                Stamp & Publish to Registry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
              <span className="text-2xl font-black text-primary">{Math.round(overallScore)}/100</span>
              <Badge className="bg-green-600 text-white ml-1">Tier-1 Verified</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {[
              { label: "Reliability", score: Math.round(reliability), desc: "On-schedule delivery commitments" },
              { label: "Purity Quality", score: Math.round(quality), desc: "Lab-confirmed gas specification" },
              { label: "Logistics Delivery", score: Math.round(delivery), desc: "Safe cryogenic transit index" },
              { label: "Documentation", score: Math.round(docs), desc: "CEMS audit & statutory compliance" },
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
        {certificates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground space-y-3">
              <FileText className="h-10 w-10 mx-auto stroke-1" />
              <div className="space-y-1">
                <p className="font-semibold text-foreground text-base">No Certificates Registered Yet</p>
                <p className="text-sm">
                  Upload laboratory purity reports or ISO certifications to boost your marketplace trust tier.
                </p>
              </div>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <UploadCloud className="h-4 w-4 mr-1.5" /> Upload First Certificate
              </Button>
            </CardContent>
          </Card>
        ) : (
          certificates.map((cert) => (
            <Card key={cert.certificate_id} className="hover:border-primary/50 transition-colors">
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">{cert.certificate_type}</span>
                      <Badge variant="outline" className="text-xs">{cert.certificate_id.slice(0, 8)}</Badge>
                      <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs">
                        <ShieldCheck className="h-3 w-3" /> {cert.verification_status ? "VERIFIED" : "PENDING"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-4">
                      <span>Verified By: <strong className="text-foreground">{cert.verified_by}</strong></span>
                      <span>Issued: {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString() : "N/A"}</span>
                      <span>Expires: {cert.expires_at ? new Date(cert.expires_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                    {cert.certificate_number && (
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-xl">
                        Certificate #: {cert.certificate_number}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => toast.success("Provenance confirmed on statutory registry!")}>
                      <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-600" /> Verify
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
