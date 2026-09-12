"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

const schema = z.object({
  available_quantity: z.coerce.number().positive("Must be positive"),
  quantity_unit: z.string().min(1),
  purity_percentage: z.coerce.number().min(0).max(100),
  physical_state: z.string().min(1),
  temperature: z.coerce.number(),
  pressure: z.coerce.number(),
  capture_method: z.string().min(1),
  source_industry: z.string().min(1),
  location: z.string().min(2),
  availability_start: z.string().min(1),
  availability_end: z.string().min(1),
  minimum_order: z.coerce.number().positive(),
  asking_price: z.coerce.number().positive(),
  is_verified: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export default function NewSupplyPage() {
  const router = useRouter();
  const { company } = useAuth();
  const supabase = createClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      quantity_unit: "tons",
      purity_percentage: 95,
      physical_state: "Liquid",
      temperature: -20,
      pressure: 20,
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (!company) {
      toast.error("Company profile not found. Please complete registration.");
      return;
    }

    const { is_verified, ...dbData } = data;
    const { error } = await supabase.from("co2_supplies").insert({
      ...dbData,
      emitter_id: company.company_id,
      status: "ACTIVE",
      certification: { verified: is_verified },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Supply listing created successfully!");
    router.push("/dashboard/listings");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-bold text-2xl text-foreground">Create CO₂ Supply Listing</h1>
        <p className="text-muted-foreground text-sm mt-1">
          List your captured CO₂ on the marketplace for buyers to discover.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Quantity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quantity & Unit</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="available_quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tons">Metric Tons</SelectItem>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="m3">Cubic Meters</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Quality */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">CO₂ Quality</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="purity_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purity: {field.value}%</FormLabel>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([v]) => field.onChange(v)}
                        min={50}
                        max={100}
                        step={0.1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="physical_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical State</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Gas">Gas</SelectItem>
                          <SelectItem value="Liquid">Liquid (Cryogenic)</SelectItem>
                          <SelectItem value="Solid">Solid (Dry Ice)</SelectItem>
                          <SelectItem value="Supercritical">Supercritical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capture_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capture Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Post-combustion">Post-combustion</SelectItem>
                          <SelectItem value="Pre-combustion">Pre-combustion</SelectItem>
                          <SelectItem value="Oxyfuel">Oxyfuel combustion</SelectItem>
                          <SelectItem value="Direct air capture">Direct air capture</SelectItem>
                          <SelectItem value="Industrial process">Industrial process</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°C)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="-20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pressure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pressure (bar)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location & Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="source_industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="Cement, Steel, Power…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Mumbai, MH" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="availability_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available From</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availability_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Until</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="asking_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asking Price (₹/ton)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="4200" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimum_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Order (tons)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="is_verified"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Publish as Verified Listing
                      </FormLabel>
                      <FormDescription>
                        This will attach a verified tag to your listing. Buyers trust verified listings more.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Listing
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
