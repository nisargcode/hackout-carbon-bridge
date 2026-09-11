"use client";

import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SettingsPage() {
  const { company, user } = useAuth();

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
