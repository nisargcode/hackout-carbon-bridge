"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import type { CompanyType } from "@/types";

const formSchema = z.object({
  name: z.string().min(2, "Company name is required"),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  company_type: z.enum(["EMITTER", "CO2_BUYER"]),
  industry: z.string().min(2, "Industry is required"),
  location: z.string().min(2, "Location is required"),
});

export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      company_type: "EMITTER",
      industry: "",
      location: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    const { error } = await signUp(
      data.email,
      data.password,
      data.name,
      data.company_type as CompanyType,
      data.industry,
      data.location,
    );
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    toast.success("Account created! Check your email for verification link.");
    router.push("/dashboard");
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
      <FieldGroup className="gap-3.5">
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-name" className="font-bold text-xs text-foreground">
                Company / Facility Name
              </FieldLabel>
              <Input
                {...field}
                id="register-name"
                placeholder="ABC Cement Works Ltd"
                className="h-10 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 font-medium text-sm transition-all"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-email" className="font-bold text-xs text-foreground">
                Work Email
              </FieldLabel>
              <Input
                {...field}
                id="register-email"
                type="email"
                placeholder="procurement@company.com"
                autoComplete="email"
                className="h-10 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 font-medium text-sm transition-all"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-password" className="font-bold text-xs text-foreground">
                Password
              </FieldLabel>
              <Input
                {...field}
                id="register-password"
                type="password"
                placeholder="••••••••••••"
                autoComplete="new-password"
                className="h-10 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 font-medium text-sm transition-all"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="company_type"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="register-role" className="font-bold text-xs text-foreground">
                Marketplace Role
              </FieldLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger id="register-role" className="h-10 rounded-xl bg-background font-semibold text-xs">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 border-slate-200">
                  <SelectItem value="EMITTER" className="text-xs">🏭 CO₂ Emitter / Seller</SelectItem>
                  <SelectItem value="CO2_BUYER" className="text-xs">⚡ CO₂ Buyer / Offtaker</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={form.control}
            name="industry"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-industry" className="font-bold text-xs text-foreground">
                  Industry
                </FieldLabel>
                <Input
                  {...field}
                  id="register-industry"
                  placeholder="Cement, Steel…"
                  className="h-10 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 font-medium text-sm transition-all"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="location"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-location" className="font-bold text-xs text-foreground">
                  Location
                </FieldLabel>
                <Input
                  {...field}
                  id="register-location"
                  placeholder="Mumbai, India"
                  className="h-10 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 font-medium text-sm transition-all"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </div>
      </FieldGroup>
      <Button
        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer mt-1"
        type="submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
        Create Enterprise Account
      </Button>
    </form>
  );
}
