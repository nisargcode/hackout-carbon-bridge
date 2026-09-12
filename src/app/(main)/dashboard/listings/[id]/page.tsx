"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function EditListingPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { company } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formState, setFormState] = useState({
    available_quantity: "",
    quantity_unit: "tons",
    purity_percentage: "",
    asking_price: "",
    minimum_order: "",
    physical_state: "Liquid",
    capture_method: "Post-combustion",
    source_industry: "",
    location: "",
    availability_start: "",
    availability_end: "",
    temperature: "0",
    pressure: "0",
    status: "ACTIVE",
  });

  useEffect(() => {
    if (!id) return;
    const fetchSupply = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("co2_supplies").select("*").eq("supply_id", id).single();

      if (error || !data) {
        toast.error("Listing not found");
        router.push("/dashboard/listings");
        return;
      }

      setFormState({
        available_quantity: String(data.available_quantity ?? ""),
        quantity_unit: data.quantity_unit || "tons",
        purity_percentage: String(data.purity_percentage ?? ""),
        asking_price: String(data.asking_price ?? ""),
        minimum_order: String(data.minimum_order ?? ""),
        physical_state: data.physical_state || "Liquid",
        capture_method: data.capture_method || "Post-combustion",
        source_industry: data.source_industry || "",
        location: data.location || "",
        availability_start: data.availability_start ? data.availability_start.split("T")[0] : "",
        availability_end: data.availability_end ? data.availability_end.split("T")[0] : "",
        temperature: String(data.temperature ?? "0"),
        pressure: String(data.pressure ?? "0"),
        status: data.status || "ACTIVE",
      });
      setLoading(false);
    };

    fetchSupply();
  }, [id, supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.available_quantity || !formState.asking_price || !formState.purity_percentage) {
      toast.error("Please fill in required fields");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("co2_supplies")
      .update({
        available_quantity: Number(formState.available_quantity),
        quantity_unit: formState.quantity_unit,
        purity_percentage: Number(formState.purity_percentage),
        asking_price: Number(formState.asking_price),
        minimum_order: Number(formState.minimum_order || 10),
        physical_state: formState.physical_state,
        capture_method: formState.capture_method,
        source_industry: formState.source_industry,
        location: formState.location,
        availability_start: formState.availability_start || new Date().toISOString().split("T")[0],
        availability_end:
          formState.availability_end || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        temperature: Number(formState.temperature || 0),
        pressure: Number(formState.pressure || 0),
        status: formState.status as any,
        updated_at: new Date().toISOString(),
      })
      .eq("supply_id", id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Listing updated successfully!");
      router.push("/dashboard/listings");
    }
  };

  const handleDelete = async () => {
    const confirm = window.confirm("Are you sure you want to delete this listing?");
    if (!confirm) return;

    setDeleting(true);
    const { error } = await supabase.from("co2_supplies").delete().eq("supply_id", id);
    setDeleting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Listing deleted");
      router.push("/dashboard/listings");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/listings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Listings
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting || saving}>
          {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
          Delete Listing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit CO₂ Supply Listing</CardTitle>
          <CardDescription>Update your listing details and pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="available_quantity">Available Quantity</Label>
                <Input
                  id="available_quantity"
                  type="number"
                  step="any"
                  value={formState.available_quantity}
                  onChange={(e) => setFormState({ ...formState, available_quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity_unit">Quantity Unit</Label>
                <Select
                  value={formState.quantity_unit}
                  onValueChange={(val) => setFormState({ ...formState, quantity_unit: val })}
                >
                  <SelectTrigger id="quantity_unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tons">Metric Tons</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="m3">Cubic Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purity_percentage">Purity (%)</Label>
                <Input
                  id="purity_percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formState.purity_percentage}
                  onChange={(e) => setFormState({ ...formState, purity_percentage: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="asking_price">Asking Price (₹/ton)</Label>
                <Input
                  id="asking_price"
                  type="number"
                  step="any"
                  value={formState.asking_price}
                  onChange={(e) => setFormState({ ...formState, asking_price: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="physical_state">Physical State</Label>
                <Select
                  value={formState.physical_state}
                  onValueChange={(val) => setFormState({ ...formState, physical_state: val })}
                >
                  <SelectTrigger id="physical_state">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Liquid">Liquid (Cryogenic)</SelectItem>
                    <SelectItem value="Gas">Gas (Compressed)</SelectItem>
                    <SelectItem value="Solid">Solid (Dry Ice)</SelectItem>
                    <SelectItem value="Supercritical">Supercritical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capture_method">Capture Method</Label>
                <Select
                  value={formState.capture_method}
                  onValueChange={(val) => setFormState({ ...formState, capture_method: val })}
                >
                  <SelectTrigger id="capture_method">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Post-combustion">Post-combustion</SelectItem>
                    <SelectItem value="Pre-combustion">Pre-combustion</SelectItem>
                    <SelectItem value="Oxyfuel">Oxyfuel combustion</SelectItem>
                    <SelectItem value="Direct air capture">Direct air capture</SelectItem>
                    <SelectItem value="Industrial process">Industrial process</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_industry">Source Industry</Label>
                <Input
                  id="source_industry"
                  value={formState.source_industry}
                  onChange={(e) => setFormState({ ...formState, source_industry: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Facility Location</Label>
                <Input
                  id="location"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimum_order">Minimum Order ({formState.quantity_unit})</Label>
                <Input
                  id="minimum_order"
                  type="number"
                  step="any"
                  value={formState.minimum_order}
                  onChange={(e) => setFormState({ ...formState, minimum_order: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formState.status} onValueChange={(val) => setFormState({ ...formState, status: val })}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE (Visible on Marketplace)</SelectItem>
                    <SelectItem value="RESERVED">RESERVED</SelectItem>
                    <SelectItem value="DEPLETED">DEPLETED</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability_start">Available From</Label>
                <Input
                  id="availability_start"
                  type="date"
                  value={formState.availability_start}
                  onChange={(e) => setFormState({ ...formState, availability_start: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability_end">Available Until</Label>
                <Input
                  id="availability_end"
                  type="date"
                  value={formState.availability_end}
                  onChange={(e) => setFormState({ ...formState, availability_end: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={saving || deleting}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/dashboard/listings")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
