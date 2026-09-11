"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck, ExternalLink, ArrowLeft, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
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
import { GoogleButton } from "@/app/(main)/auth/_components/social-auth/google-button";
import { useAuth } from "@/contexts/auth-context";
import type { CompanyType } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Company name required"),
  company_type: z.enum(["EMITTER", "CO2_BUYER", "LOGISTICS_PROVIDER", "REGULATOR"]),
  industry: z.string().min(2, "Industry required"),
  location: z.string().min(2, "Location required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthDialog({ open, onOpenChange, defaultTab = "login" }: AuthDialogProps) {
  const [tab, setTab] = useState<string>(defaultTab);
  const [verificationPending, setVerificationPending] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const { signIn, signInWithGoogle, signUp, setDemoRole } = useAuth();
  const router = useRouter();

  const handleDemoSelect = (role: CompanyType) => {
    setDemoRole(role);
    toast.success(`Entering dashboard as ${role.replace("_", " ")}`);
    onOpenChange(false);
    router.push("/dashboard");
  };

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginForm) => {
    const { error } = await signIn(data.email, data.password);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back!");
    onOpenChange(false);
    router.push("/dashboard");
  };

  const handleRegister = async (data: RegisterForm) => {
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
      return;
    }
    // Show email verification popup screen
    setRegisteredEmail(data.email);
    setVerificationPending(true);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.info("Google OAuth provider initialized. Please ensure Google provider is enabled in your Supabase project.");
    }
    setIsGoogleLoading(false);
  };

  const openGmail = () => {
    window.open("https://mail.google.com", "_blank");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setVerificationPending(false);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {verificationPending ? (
          /* Email Verification Required View */
          <div className="py-4 space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400">
              <MailCheck className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <DialogTitle className="text-xl font-bold">Check Your Email</DialogTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've sent a confirmation email with a verification link to:
              </p>
              <div className="inline-block rounded-md bg-muted px-3 py-1 font-semibold text-foreground text-sm">
                {registeredEmail}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4 text-left space-y-2 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" /> Next Steps:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open your inbox in Gmail or your email client.</li>
                <li>Look for a confirmation email from <strong>Carbon Bridge / Supabase</strong>.</li>
                <li>Click the verification link to activate your account.</li>
              </ol>
            </div>

            <div className="space-y-2.5">
              <Button onClick={openGmail} className="w-full gap-2" size="lg">
                Open Gmail <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-1.5"
                onClick={() => {
                  setVerificationPending(false);
                  setTab("login");
                }}
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Button>
            </div>
          </div>
        ) : (
          /* Standard Sign In / Sign Up View */
          <>
            <DialogHeader>
              <DialogTitle>Welcome to Carbon Bridge</DialogTitle>
              <DialogDescription>
                Sign in or create your account to access the circular CO₂ marketplace.
              </DialogDescription>
            </DialogHeader>

            {/* Google OAuth Option */}
            <div className="space-y-3 pt-1">
              <GoogleButton
                className="w-full justify-center gap-2 cursor-pointer h-10"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              />

              <div className="relative text-center text-xs after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground uppercase font-medium">
                  Or continue with email
                </span>
              </div>
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      disabled={loginForm.formState.isSubmitting}
                    >
                      {loginForm.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Sign In
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="mt-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3.5">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="ABC Cement Ltd." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="you@company.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="company_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select your role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="EMITTER">CO₂ Emitter / Seller</SelectItem>
                              <SelectItem value="CO2_BUYER">CO₂ Buyer</SelectItem>
                              <SelectItem value="LOGISTICS_PROVIDER">Logistics Provider</SelectItem>
                              <SelectItem value="REGULATOR">Regulator</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input placeholder="Cement, Steel…" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Mumbai, India" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full cursor-pointer"
                      disabled={registerForm.formState.isSubmitting}
                    >
                      {registerForm.formState.isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Create Account
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="mt-2 border-t border-border pt-3 text-center">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Or explore directly without login (Demo Mode):
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => handleDemoSelect("EMITTER")}
                >
                  🏭 Emitter (Seller)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => handleDemoSelect("CO2_BUYER")}
                >
                  🛒 CO₂ Buyer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => handleDemoSelect("LOGISTICS_PROVIDER")}
                >
                  🚚 Logistics Provider
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start"
                  onClick={() => handleDemoSelect("REGULATOR")}
                >
                  🏛️ Regulator
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
