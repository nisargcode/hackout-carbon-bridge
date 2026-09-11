"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";
import type { DemandRequest } from "@/types";

const schema = z.object({
  required_quantity: z.coerce.number().positive(),
  required_purity: z.coerce.number().min(0).max(100),
  application: z.string().min(2),
  max_price: z.coerce.number().positive(),
  required_location: z.string().min(2),
  delivery_deadline: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

function CreateDemandDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const { company } = useAuth();
  const supabase = createClient();

  const form = useForm<FormValues>({ resolver: zodResolver(schema) as any });

  const onSubmit = async (data: FormValues) => {
    if (!company) return;
    const { error } = await supabase.from("demand_requests").insert({
      ...data,
      buyer_id: company.company_id,
      status: "OPEN",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Demand request created!");
    setOpen(false);
    form.reset();
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />New Demand</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Demand Request</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="required_quantity" render={({ field }) => (
                <FormItem><FormLabel>Quantity (tons)</FormLabel><FormControl><Input type="number" placeholder="200" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="required_purity" render={({ field }) => (
                <FormItem><FormLabel>Min Purity (%)</FormLabel><FormControl><Input type="number" placeholder="95" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="application" render={({ field }) => (
              <FormItem><FormLabel>Application</FormLabel>
                <Select onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Select use case" /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Fuel synthesis">Fuel synthesis</SelectItem>
                    <SelectItem value="Building materials">Building materials</SelectItem>
                    <SelectItem value="Greenhouse agriculture">Greenhouse agriculture</SelectItem>
                    <SelectItem value="Algae farming">Algae farming</SelectItem>
                    <SelectItem value="Chemical production">Chemical production</SelectItem>
                    <SelectItem value="Enhanced oil recovery">Enhanced oil recovery</SelectItem>
                    <SelectItem value="Food & beverage">Food & beverage</SelectItem>
                  </SelectContent>
                </Select>
              <FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="max_price" render={({ field }) => (
                <FormItem><FormLabel>Max Price (₹/ton)</FormLabel><FormControl><Input type="number" placeholder="5000" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="required_location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="Pune, MH" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="delivery_deadline" render={({ field }) => (
              <FormItem><FormLabel>Delivery Deadline</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Request
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function DemandsPage() {
  const [demands, setDemands] = useState<DemandRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { company } = useAuth();
  const supabase = createClient();

  const fetchDemands = async () => {
    if (!company) return;
    const { data } = await supabase
      .from("demand_requests")
      .select("*")
      .eq("buyer_id", company.company_id)
      .order("created_at", { ascending: false });
    setDemands(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchDemands(); }, [company]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl text-foreground">My Demands</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Post your CO₂ requirements and let the matching engine find suppliers.
          </p>
        </div>
        <CreateDemandDialog onCreated={fetchDemands} />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : demands.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <CardTitle>No demand requests yet</CardTitle>
          <CardDescription className="mt-2">Create your first demand to find matching CO₂ suppliers.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-4">
          {demands.map((d) => (
            <Card key={d.request_id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{d.application}</p>
                      <Badge variant={d.status === "OPEN" ? "default" : "outline"}>{d.status}</Badge>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>{d.required_quantity} tons</span>
                      <span>Min purity: {d.required_purity}%</span>
                      <span>Max: ₹{d.max_price.toLocaleString()}/t</span>
                      <span>📍 {d.required_location}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deadline: {new Date(d.delivery_deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/matches?demand=${d.request_id}`}>
                      View Matches
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
