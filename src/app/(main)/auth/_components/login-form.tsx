"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";

const formSchema = z.object({
  email: z.email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  remember: z.boolean().optional(),
});

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      toast.error(error);
      setLoading(false);
      return;
    }
    toast.success("Welcome back!");
    router.push("/dashboard");
  };

  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field className="gap-1.5" data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email" className="font-bold text-xs text-foreground">
                Email Address
              </FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                className="h-11 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 font-medium text-sm transition-all"
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
              <FieldLabel htmlFor="login-password" className="font-bold text-xs text-foreground">
                Password
              </FieldLabel>
              <Input
                {...field}
                id="login-password"
                type="password"
                placeholder="••••••••••••"
                autoComplete="current-password"
                className="h-11 rounded-xl bg-background border-border focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 font-medium text-sm transition-all"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name="remember"
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id="login-remember"
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                aria-invalid={fieldState.invalid}
              />
              <FieldContent>
                <FieldLabel htmlFor="login-remember" className="font-semibold text-xs text-muted-foreground cursor-pointer">
                  Remember me on this workstation
                </FieldLabel>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </FieldContent>
            </Field>
          )}
        />
      </FieldGroup>
      <Button
        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
        type="submit"
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
        Sign In
      </Button>
    </form>
  );
}
