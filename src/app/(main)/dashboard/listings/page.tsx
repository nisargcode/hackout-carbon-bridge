"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Package, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import type { CO2Supply } from "@/types";

export default function ListingsPage() {
  const [listings, setListings] = useState<CO2Supply[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingListing, setEditingListing] = useState<CO2Supply | null>(null);
  const [editOpen, setEditOpen] = useState(false);
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

  const { company } = useAuth();
  const supabase = createClient();

  const fetchListings = async () => {
    if (!company) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("co2_supplies")
      .select("*")
      .eq("emitter_id", company.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load listings");
    } else {
      setListings(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, [company]);

  const handleOpenEdit = (listing: CO2Supply) => {
    setEditingListing(listing);
    setFormState({
      available_quantity: String(listing.available_quantity ?? ""),
      quantity_unit: listing.quantity_unit || "tons",
      purity_percentage: String(listing.purity_percentage ?? ""),
      asking_price: String(listing.asking_price ?? ""),
      minimum_order: String(listing.minimum_order ?? ""),
      physical_state: listing.physical_state || "Liquid",
      capture_method: listing.capture_method || "Post-combustion",
      source_industry: listing.source_industry || "",
      location: listing.location || "",
      availability_start: listing.availability_start ? listing.availability_start.split("T")[0] : "",
      availability_end: listing.availability_end ? listing.availability_end.split("T")[0] : "",
      temperature: String(listing.temperature ?? "0"),
      pressure: String(listing.pressure ?? "0"),
      status: listing.status || "ACTIVE",
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;

    if (!formState.available_quantity || !formState.asking_price || !formState.purity_percentage) {
      toast.error("Please fill in required fields (Quantity, Purity, Price)");
      return;
    }

    setSaving(true);
    try {
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
          availability_end: formState.availability_end || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
          temperature: Number(formState.temperature || 0),
          pressure: Number(formState.pressure || 0),
          status: formState.status as any,
          updated_at: new Date().toISOString(),
        })
        .eq("supply_id", editingListing.supply_id);

      if (error) {
        toast.error(`Update failed: ${error.message}`);
      } else {
        toast.success("Listing updated successfully!");
        setEditOpen(false);
        setEditingListing(null);
        await fetchListings();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!editingListing) return;
    const confirm = window.confirm("Are you sure you want to delete this listing?");
    if (!confirm) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("co2_supplies")
        .delete()
        .eq("supply_id", editingListing.supply_id);

      if (error) {
        toast.error(`Failed to delete: ${error.message}`);
      } else {
        toast.success("Listing deleted successfully");
        setEditOpen(false);
        setEditingListing(null);
        setListings((prev) => prev.filter((l) => l.supply_id !== editingListing.supply_id));
      }
    } catch (err: any) {
      toast.error(err.message || "Could not delete listing");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">My Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your CO₂ supply listings on the marketplace.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Supply
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <CardTitle className="text-lg">No listings yet</CardTitle>
          <CardDescription className="mt-2 mb-6">
            Create your first CO₂ supply listing to start receiving bids from buyers.
          </CardDescription>
          <Button asChild>
            <Link href="/dashboard/listings/new">Create Listing</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((l) => (
            <Card key={l.supply_id} className="transition-all hover:border-primary/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{l.source_industry || "Industrial CO₂"}</CardTitle>
                    <CardDescription>{l.location}</CardDescription>
                  </div>
                  <div className="flex gap-2 items-center">
                    {(l.certification as any)?.verified && (
                      <Badge className="bg-blue-600 text-white">Verified</Badge>
                    )}
                    <Badge
                      variant={l.status === "ACTIVE" ? "default" : "outline"}
                      className={
                        l.status === "ACTIVE"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : ""
                      }
                    >
                      {l.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Quantity</p>
                    <p className="font-medium">
                      {l.available_quantity} {l.quantity_unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Purity</p>
                    <p className="font-medium">{l.purity_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Price</p>
                    <p className="font-medium">₹{Number(l.asking_price).toLocaleString()}/t</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>
                    {l.physical_state} · {l.capture_method}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenEdit(l)}
                    className="h-8 gap-1.5"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Listing Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit CO₂ Supply Listing</DialogTitle>
            <DialogDescription>
              Update your available supply parameters, pricing, and availability.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="available_quantity">Available Quantity</Label>
                <Input
                  id="available_quantity"
                  type="number"
                  step="any"
                  value={formState.available_quantity}
                  onChange={(e) => setFormState({ ...formState, available_quantity: e.target.value })}
                  placeholder="e.g. 500"
                  required
                />
              </div>

              {/* Unit */}
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

              {/* Purity */}
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
                  placeholder="e.g. 98.5"
                  required
                />
              </div>

              {/* Asking Price */}
              <div className="space-y-2">
                <Label htmlFor="asking_price">Asking Price (₹/ton)</Label>
                <Input
                  id="asking_price"
                  type="number"
                  step="any"
                  value={formState.asking_price}
                  onChange={(e) => setFormState({ ...formState, asking_price: e.target.value })}
                  placeholder="e.g. 4200"
                  required
                />
              </div>

              {/* Physical State */}
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

              {/* Capture Method */}
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

              {/* Source Industry */}
              <div className="space-y-2">
                <Label htmlFor="source_industry">Source Industry</Label>
                <Input
                  id="source_industry"
                  value={formState.source_industry}
                  onChange={(e) => setFormState({ ...formState, source_industry: e.target.value })}
                  placeholder="e.g. Steel Plant, Cement, Refinery"
                  required
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Facility Location</Label>
                <Input
                  id="location"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  placeholder="e.g. Mumbai, MH"
                  required
                />
              </div>

              {/* Min Order */}
              <div className="space-y-2">
                <Label htmlFor="minimum_order">Minimum Order ({formState.quantity_unit})</Label>
                <Input
                  id="minimum_order"
                  type="number"
                  step="any"
                  value={formState.minimum_order}
                  onChange={(e) => setFormState({ ...formState, minimum_order: e.target.value })}
                  placeholder="e.g. 50"
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Listing Status</Label>
                <Select
                  value={formState.status}
                  onValueChange={(val) => setFormState({ ...formState, status: val })}
                >
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

              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="availability_start">Available From</Label>
                <Input
                  id="availability_start"
                  type="date"
                  value={formState.availability_start}
                  onChange={(e) => setFormState({ ...formState, availability_start: e.target.value })}
                />
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="availability_end">Available Until</Label>
                <Input
                  id="availability_end"
                  type="date"
                  value={formState.availability_end}
                  onChange={(e) => setFormState({ ...formState, availability_end: e.target.value })}
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  value={formState.temperature}
                  onChange={(e) => setFormState({ ...formState, temperature: e.target.value })}
                />
              </div>

              {/* Pressure */}
              <div className="space-y-2">
                <Label htmlFor="pressure">Pressure (bar)</Label>
                <Input
                  id="pressure"
                  type="number"
                  value={formState.pressure}
                  onChange={(e) => setFormState({ ...formState, pressure: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-4 border-t">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleDeleteListing}
                disabled={deleting || saving}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Delete
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  disabled={saving || deleting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || deleting}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
