"use client";

import { useState, useEffect } from "react";
import { Loader2, Building2, MapPin, Phone, Mail, Globe, FileText, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { Company } from "@/types";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onUpdated?: () => void;
}

export function ProfileEditDialog({ open, onOpenChange, company, onUpdated }: ProfileEditDialogProps) {
  const { user, refreshCompany } = useAuth();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    phone: "",
    email: "",
    website: "",
    gstin: "",
    bio: "",
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name || "",
        industry: company.industry || "Cement",
        location: company.location || "",
        phone: (company.contact_details?.phone as string) || "",
        email: (company.contact_details?.email as string) || user?.email || "",
        website: (company.contact_details?.website as string) || "",
        gstin: (company.contact_details?.gstin as string) || "",
        bio: (company.contact_details?.bio as string) || "",
      });
    }
  }, [company, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.company_id) {
      toast.error("Company profile not initialized");
      return;
    }

    setSaving(true);
    try {
      const updatedContact = {
        ...(company.contact_details || {}),
        phone: form.phone.trim(),
        email: form.email.trim(),
        website: form.website.trim(),
        gstin: form.gstin.trim(),
        bio: form.bio.trim(),
      };

      const { error } = await supabase
        .from("companies")
        .update({
          name: form.name.trim(),
          industry: form.industry.trim(),
          location: form.location.trim(),
          contact_details: updatedContact,
        })
        .eq("company_id", company.company_id);

      if (error) {
        toast.error(`Update failed: ${error.message}`);
      } else {
        toast.success("Profile details updated successfully!");
        await refreshCompany();
        if (onUpdated) onUpdated();
        onOpenChange(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Edit Enterprise Profile
          </DialogTitle>
          <DialogDescription>
            Update your registered company information, industry focus, and contact details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="company_name">Company / Organization Name</Label>
              <Input
                id="company_name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Tata Steel Jamshedpur"
                required
              />
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry Sector</Label>
              <Select value={form.industry} onValueChange={(val) => setForm({ ...form, industry: val })}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cement">Cement Manufacturing</SelectItem>
                  <SelectItem value="Steel">Steel & Metallurgy</SelectItem>
                  <SelectItem value="Power">Power Generation</SelectItem>
                  <SelectItem value="Chemicals">Chemicals & Petrochemicals</SelectItem>
                  <SelectItem value="Fertilizers">Fertilizers & Urea</SelectItem>
                  <SelectItem value="Synthetic Fuels">Synthetic Fuels</SelectItem>
                  <SelectItem value="Greenhouse Agriculture">Greenhouse Agriculture</SelectItem>
                  <SelectItem value="Direct Air Capture">Direct Air Capture (DAC)</SelectItem>
                  <SelectItem value="Cryogenic Freight">Cryogenic Logistics</SelectItem>
                  <SelectItem value="Regulatory Body">Regulatory Oversight</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Facility Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Facility / Office Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Mumbai, Maharashtra"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91-9876543210"
              />
            </div>

            {/* Business Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Official Business Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contact@enterprise.com"
              />
            </div>

            {/* Website */}
            <div className="space-y-1.5">
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://company.com"
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-1.5">
              <Label htmlFor="gstin">GSTIN / Corporate CIN</Label>
              <Input
                id="gstin"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="27AAACT2727Q1ZW"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="bio">About Enterprise & Carbon Strategy</Label>
              <Textarea
                id="bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Brief summary of your CO₂ capture facility, utilization requirements, or decarbonization targets."
              />
            </div>
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
