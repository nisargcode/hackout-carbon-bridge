"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SettingsPage() {
  const { company, user, companyType, switchRole } = useAuth();

  const handleRoleChange = async (newRole: "EMITTER" | "CO2_BUYER") => {
    const res = await switchRole(newRole);
    if (res.error) {
      toast.error(`Failed to update mode: ${res.error}`);
    } else {
      toast.success(`Active mode switched to ${newRole === "EMITTER" ? "Seller (CO₂ Emitter)" : "Buyer (CO₂ Offtaker)"}!`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Settings updated successfully!");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Organization Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your company profile, API keys, notifications, and security settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Operational Marketplace Mode</CardTitle>
            <CardDescription>Switch between selling captured CO₂ and procuring CO₂ supplies anytime</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleRoleChange("EMITTER")}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  companyType === "EMITTER"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <p className="font-semibold text-sm flex items-center justify-between">
                  Seller (CO₂ Emitter)
                  {companyType === "EMITTER" && <span className="text-xs text-primary font-bold">Active</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  List captured CO₂, manage inventory, receive buyer bids, and track revenue.
                </p>
              </div>

              <div
                onClick={() => handleRoleChange("CO2_BUYER")}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${
                  companyType === "CO2_BUYER"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <p className="font-semibold text-sm flex items-center justify-between">
                  Buyer (CO₂ Offtaker)
                  {companyType === "CO2_BUYER" && <span className="text-xs text-primary font-bold">Active</span>}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Post demand requests, browse verified supplies, get AI matches, and track deliveries.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
            <CardDescription>Primary corporate profile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Company Name</label>
              <Input defaultValue={company?.name ?? "ABC Cement Works"} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Operating Industry</label>
              <Input defaultValue={company?.industry ?? "Cement Manufacturing"} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Registered Facility Location</label>
              <Input defaultValue={company?.location ?? "Mumbai, Maharashtra"} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact & Dispatch Alerts</CardTitle>
            <CardDescription>Email notifications for incoming bids and shipment tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Notification Email</label>
              <Input defaultValue={user?.email ?? "contact@abccement.com"} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit">Save Changes</Button>
      </form>
    </div>
  );
}
