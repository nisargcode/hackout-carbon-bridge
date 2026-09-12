"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Pencil,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  Award,
  Sparkles,
  Calendar,
  KeyRound,
  FileCheck2,
  Package,
  Layers,
  ArrowRightLeft,
  Loader2,
  CheckCircle2,
  Lock,
  ExternalLink,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { ProfileAvatarDialog } from "./_components/profile-avatar-dialog";
import { ProfileEditDialog } from "./_components/profile-edit-dialog";

export default function ProfilePage() {
  const { user, company, companyType, refreshCompany, switchRole } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Enterprise Stats
  const [stats, setStats] = useState({
    totalSupplies: 0,
    totalVolume: 0,
    totalContracts: 0,
    totalBids: 0,
    reputation: {
      reliability: 96,
      quality: 98,
      delivery: 94,
      documentation: 100,
      overall: 96,
    },
  });

  // Password reset state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const displayName = company?.name || user?.email?.split("@")[0] || "Enterprise Account";
  const avatarUrl =
    (company?.contact_details?.avatar_url as string) ||
    (user?.user_metadata?.avatar_url as string) ||
    (user?.user_metadata?.picture as string) ||
    "";

  const sustainabilityScore = Number(company?.sustainability_score || 88.5);

  const loadProfileMetrics = async () => {
    if (!company?.company_id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch supplies
      const { data: supplies } = await supabase
        .from("co2_supplies")
        .select("available_quantity")
        .eq("emitter_id", company.company_id);

      const supplyCount = supplies?.length || 0;
      const volume = (supplies || []).reduce(
        (acc, s) => acc + (Number(s.available_quantity) || 0),
        0
      );

      // 2. Fetch contracts
      const { data: contracts } = await supabase
        .from("contracts")
        .select("contract_id")
        .or(`seller_id.eq.${company.company_id},buyer_id.eq.${company.company_id}`);

      // 3. Fetch bids
      const { data: bids } = await supabase
        .from("bids")
        .select("bid_id")
        .eq("bidder_id", company.company_id);

      // 4. Fetch reputation scores if available
      const { data: rep } = await supabase
        .from("reputation_scores")
        .select("*")
        .eq("company_id", company.company_id)
        .maybeSingle();

      setStats({
        totalSupplies: supplyCount,
        totalVolume: volume,
        totalContracts: contracts?.length || 0,
        totalBids: bids?.length || 0,
        reputation: {
          reliability: Number(rep?.reliability || 95),
          quality: Number(rep?.quality || 96),
          delivery: Number(rep?.delivery || 93),
          documentation: Number(rep?.documentation || 98),
          overall: Number(rep?.overall_score || 95),
        },
      });
    } catch (err) {
      console.error("Failed to load profile metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileMetrics();
  }, [company?.company_id]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(`Password update failed: ${error.message}`);
      } else {
        toast.success("Account password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/dashboard">Dashboard</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Enterprise Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Profile Header Banner */}
      <Card className="overflow-hidden border-border bg-gradient-to-b from-card to-muted/20">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Avatar & Identity */}
            <div className="flex items-center gap-5">
              {/* Avatar with Circular Score & Camera Button */}
              <div className="relative group">
                <div className="relative grid size-24 place-items-center">
                  <svg
                    aria-hidden="true"
                    className="col-start-1 row-start-1 size-full -rotate-90 text-muted/30"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      className="fill-none stroke-current"
                      cx="50"
                      cy="50"
                      r="44"
                      strokeWidth="3.5"
                    />
                    <circle
                      className="fill-none stroke-emerald-600 dark:stroke-emerald-400 transition-all duration-700"
                      cx="50"
                      cy="50"
                      pathLength="100"
                      r="44"
                      strokeDasharray={`${sustainabilityScore} 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <Avatar className="col-start-1 row-start-1 size-20 rounded-full border-2 border-background shadow-xs">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Quick set profile pic button overlay */}
                <button
                  type="button"
                  onClick={() => setAvatarDialogOpen(true)}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md hover:scale-105 transition-transform"
                  title="Change Profile Picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Text Info */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading font-bold text-2xl text-foreground">
                    {displayName}
                  </h1>
                  {company?.verification_status ? (
                    <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                      <ShieldCheck className="h-3 w-3" />
                      Verified Enterprise
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                      Verification Pending
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {companyType || "EMITTER"}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {company?.industry || "Industrial Sector"}
                  </span>
                  {company?.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {company.location}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email || "No email"}
                  </span>
                </p>

                <div className="flex items-center gap-2 pt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Award className="h-4 w-4" />
                  <span>Sustainability & ESG Rating: {sustainabilityScore}/100</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <Camera className="h-4 w-4 text-muted-foreground" />
                Set Profile Pic
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit Profile
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  const targetRole = companyType === "EMITTER" ? "CO2_BUYER" : "EMITTER";
                  await switchRole(targetRole);
                  toast.success(
                    `Switched persona to ${targetRole === "EMITTER" ? "Seller (Emitter)" : "Buyer"}`
                  );
                }}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Switch to {companyType === "EMITTER" ? "Buyer" : "Seller"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Detail Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
          <TabsTrigger value="overview">Enterprise Overview</TabsTrigger>
          <TabsTrigger value="details">Company Details</TabsTrigger>
          <TabsTrigger value="co2">CO₂ Operations</TabsTrigger>
          <TabsTrigger value="security">Security & Auth</TabsTrigger>
        </TabsList>

        {/* Tab 1: Enterprise Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {companyType === "EMITTER" ? "Active Supplies" : "Active Demands"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{stats.totalSupplies}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Listed on Carbon Bridge</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {companyType === "EMITTER" ? "Total Captured Volume" : "Demanded Volume"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-emerald-600">
                  {stats.totalVolume.toLocaleString()} t
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Metric tons CO₂</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Executed Contracts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-primary">{stats.totalContracts}</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Spot & Long-term agreements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  ESG Reputation Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-amber-500">
                  {stats.reputation.overall}%
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">Verified MRV rating</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Enterprise Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  Registered Enterprise Details
                </CardTitle>
                <CardDescription>Verified information on the national carbon ledger</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Company Name</span>
                  <span className="font-semibold text-foreground">{displayName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Industry Sector</span>
                  <span className="font-medium">{company?.industry || "Industrial Manufacturing"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Trading Role</span>
                  <Badge variant="outline" className="text-xs font-medium">
                    {companyType || "EMITTER"}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Facility Location</span>
                  <span className="font-medium">{company?.location || "Not specified"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">GSTIN / Corporate CIN</span>
                  <span className="font-mono text-xs">
                    {(company?.contact_details?.gstin as string) || "27AAACT2727Q1ZW"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Company ID (UUID)</span>
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                    {company?.company_id || "Pending"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Reputation & ESG Breakdown Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Reputation & MRV Reliability
                </CardTitle>
                <CardDescription>
                  Autonomous performance scores based on delivery, purity, and audits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Supply Delivery Reliability</span>
                    <span className="font-medium">{stats.reputation.reliability}%</span>
                  </div>
                  <Progress value={stats.reputation.reliability} className="h-2" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">CO₂ Purity Consistency</span>
                    <span className="font-medium">{stats.reputation.quality}%</span>
                  </div>
                  <Progress value={stats.reputation.quality} className="h-2" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Logistics & Transit Timeliness</span>
                    <span className="font-medium">{stats.reputation.delivery}%</span>
                  </div>
                  <Progress value={stats.reputation.delivery} className="h-2" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">MRV Documentation & Verification</span>
                    <span className="font-medium">{stats.reputation.documentation}%</span>
                  </div>
                  <Progress value={stats.reputation.documentation} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Company Details */}
        <TabsContent value="details">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Organization & Contact Information</CardTitle>
                <CardDescription>
                  Maintain official coordinates for trade contracts and logistics dispatch.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setEditDialogOpen(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit Info
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" />
                    Business Inquiries Email
                  </span>
                  <p className="font-medium text-foreground">
                    {(company?.contact_details?.email as string) || user?.email || "Not specified"}
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    Dispatch Telephone
                  </span>
                  <p className="font-medium text-foreground">
                    {(company?.contact_details?.phone as string) || "+91-9876543210"}
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    Official Website
                  </span>
                  <p className="font-medium text-foreground">
                    {(company?.contact_details?.website as string) || "https://enterprise.carbonbridge.in"}
                  </p>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Registered Office & Facility
                  </span>
                  <p className="font-medium text-foreground">
                    {company?.location || "Maharashtra, India"}
                  </p>
                </div>

                <div className="md:col-span-2 p-4 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground">About & Decarbonization Scope</span>
                  <p className="text-foreground leading-relaxed">
                    {(company?.contact_details?.bio as string) ||
                      `${displayName} is registered on Carbon Bridge as a certified industrial participant dedicated to circular carbon utilization, transparent offtake agreements, and certified emission reductions.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: CO₂ Operations */}
        <TabsContent value="co2" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                CO₂ Technical Profile & Standards
              </CardTitle>
              <CardDescription>
                Physical handling parameters, capture methodology, and certification benchmarks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-xl border space-y-1">
                  <p className="text-xs text-muted-foreground">Handling Physical States</p>
                  <p className="font-semibold">Liquid (Cryogenic) & Compressed Gas</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    Operating pressure: 15 - 25 bar @ -20°C
                  </p>
                </div>
                <div className="p-4 rounded-xl border space-y-1">
                  <p className="text-xs text-muted-foreground">Typical Capture Method</p>
                  <p className="font-semibold">Post-combustion Amine Scrubbing</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    High recovery rate (&gt;90%)
                  </p>
                </div>
                <div className="p-4 rounded-xl border space-y-1">
                  <p className="text-xs text-muted-foreground">Certified Purity Rating</p>
                  <p className="font-semibold text-emerald-600">98.5% - 99.2% CO₂</p>
                  <p className="text-xs text-muted-foreground pt-1">
                    Food & Industrial Grade Compatible
                  </p>
                </div>
              </div>

              <div className="rounded-xl border p-4 bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Active MRV Verification Standards</h4>
                    <p className="text-xs text-muted-foreground">
                      Third-party audited emissions documentation
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/verification">
                      Verify Docs
                      <ExternalLink className="h-3 w-3 ml-1.5" />
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge className="bg-emerald-600 text-white">ISO 14064-1 Audited</Badge>
                  <Badge variant="outline">Bureau Veritas Lab Tested</Badge>
                  <Badge variant="outline">Vimta Labs Purity Certificate</Badge>
                  <Badge variant="outline">GHG Protocol Compliant</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Security & Auth */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Account Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Account Credentials
                </CardTitle>
                <CardDescription>Authentication parameters and linked identity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 text-sm">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Primary Login Email</span>
                  <span className="font-medium text-foreground">{user?.email || "No email"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Supabase User ID</span>
                  <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                    {user?.id || "Anonymous"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Authentication Provider</span>
                  <Badge variant="outline" className="capitalize text-xs">
                    {user?.app_metadata?.provider || "Email/Password"}
                  </Badge>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Account Created</span>
                  <span className="font-medium text-xs">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Active"}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Session Status</span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Authenticated & Verified
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  Update Password
                </CardTitle>
                <CardDescription>
                  Ensure your carbon trading account stays secure with a strong password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={updatingPassword}>
                    {updatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProfileAvatarDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentAvatarUrl={avatarUrl}
        displayName={displayName}
        onAvatarUpdated={async () => {
          await refreshCompany();
          await loadProfileMetrics();
        }}
      />

      <ProfileEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
        onUpdated={async () => {
          await refreshCompany();
          await loadProfileMetrics();
        }}
      />
    </div>
  );
}
