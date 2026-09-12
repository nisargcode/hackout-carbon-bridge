"use client";

import { useState, useRef } from "react";
import {
  Camera,
  Upload,
  Sparkles,
  Trash2,
  Check,
  Loader2,
  Image as ImageIcon,
  Building2,
  Factory,
  Leaf,
  FlaskConical,
  Truck,
  ShieldCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface ProfileAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string;
  displayName: string;
  onAvatarUpdated?: (newUrl: string) => void;
}

// Enterprise presets generated as clean high-contrast SVG Data URIs
const ENTERPRISE_PRESETS = [
  {
    id: "eco-leaf",
    name: "Eco Carbon Capture",
    icon: Leaf,
    gradient: "from-emerald-500 to-teal-700",
    url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=256&h=256&q=80",
  },
  {
    id: "industrial-steel",
    name: "Industrial Steel & Cement",
    icon: Factory,
    gradient: "from-slate-700 to-zinc-900",
    url: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=256&h=256&q=80",
  },
  {
    id: "synfuel-lab",
    name: "Synthetic Fuels & Chem",
    icon: FlaskConical,
    gradient: "from-indigo-600 to-purple-800",
    url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=256&h=256&q=80",
  },
  {
    id: "cryo-logistics",
    name: "Cryogenic Logistics",
    icon: Truck,
    gradient: "from-cyan-600 to-blue-800",
    url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=256&h=256&q=80",
  },
  {
    id: "audit-authority",
    name: "Carbon Audit Authority",
    icon: ShieldCheck,
    gradient: "from-amber-600 to-orange-800",
    url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=256&h=256&q=80",
  },
  {
    id: "green-future",
    name: "Clean Energy Grid",
    icon: Building2,
    gradient: "from-emerald-600 to-green-900",
    url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=256&h=256&q=80",
  },
];

export function ProfileAvatarDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  displayName,
  onAvatarUpdated,
}: ProfileAvatarDialogProps) {
  const { user, company, refreshCompany } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(currentAvatarUrl || null);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, WebP, SVG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const avatarUrl = selectedImage || "";

      // 1. Update company contact_details.avatar_url
      if (company?.company_id) {
        const updatedContact = {
          ...(company.contact_details || {}),
          avatar_url: avatarUrl,
        };
        const { error: compError } = await supabase
          .from("companies")
          .update({ contact_details: updatedContact })
          .eq("company_id", company.company_id);

        if (compError) {
          console.error("Failed to update company avatar:", compError);
        }
      }

      // 2. Update Supabase Auth user metadata
      if (user?.id) {
        await supabase.auth.updateUser({
          data: { avatar_url: avatarUrl },
        });
      }

      // 3. Refresh context and trigger app-wide reactivity
      await refreshCompany();
      if (onAvatarUpdated) {
        onAvatarUpdated(avatarUrl);
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("carbon_bridge_profile_updated"));
      }

      toast.success(
        avatarUrl ? "Profile picture updated successfully!" : "Profile picture removed"
      );
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile picture");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Set Profile Picture
          </DialogTitle>
          <DialogDescription>
            Personalize your enterprise identity with a company logo or verified avatar.
          </DialogDescription>
        </DialogHeader>

        {/* Live Circular Preview */}
        <div className="flex flex-col items-center justify-center py-4 bg-muted/20 rounded-xl border">
          <div className="relative group">
            <Avatar className="h-28 w-28 rounded-full border-4 border-background shadow-md">
              <AvatarImage src={selectedImage || undefined} alt={displayName} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {selectedImage && (
              <Button
                size="icon"
                variant="destructive"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow-md"
                onClick={() => setSelectedImage(null)}
                title="Remove photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">{displayName}</p>
        </div>

        {/* Upload Options Tabs */}
        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload" className="text-xs">
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              Upload Image
            </TabsTrigger>
            <TabsTrigger value="presets" className="text-xs">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Corporate Presets
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Upload File */}
          <TabsContent value="upload" className="pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />

            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  SVG, PNG, JPG or WebP (max. 5MB)
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Corporate Presets */}
          <TabsContent value="presets" className="pt-2">
            <div className="grid grid-cols-3 gap-3">
              {ENTERPRISE_PRESETS.map((preset) => {
                const isSelected = selectedImage === preset.url;
                const Icon = preset.icon;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedImage(preset.url)}
                    className={`relative p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <Avatar className="h-12 w-12 rounded-lg">
                      <AvatarImage src={preset.url} alt={preset.name} className="object-cover" />
                      <AvatarFallback>
                        <Icon className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-medium leading-tight truncate w-full text-foreground">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile Picture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
