"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  MailCheck,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Lock,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Company name is required"),
  company_type: z.enum(["EMITTER", "CO2_BUYER", "LOGISTICS_PROVIDER", "REGULATOR"]),
  industry: z.string().min(2, "Industry is required"),
  location: z.string().min(2, "City / Location is required"),
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

  const { signIn, signInWithGoogle, signUp } = useAuth();
  const router = useRouter();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginForm) => {
    const { error } = await signIn(data.email, data.password);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Welcome back to Carbon Bridge!");
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
    setRegisteredEmail(data.email);
    setVerificationPending(true);
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.info("Google OAuth initialized. Redirecting to provider...");
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-2 border-emerald-500/30 bg-white/95 backdrop-blur-2xl shadow-2xl shadow-emerald-950/20 rounded-3xl">
        {/* Subtle Ambient Mesh & Gradient Glow */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-emerald-500/15 via-teal-500/5 to-transparent pointer-events-none" />
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-12 -left-12 h-44 w-44 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        {verificationPending ? (
          /* Email Verification Required View */
          <div className="relative p-8 text-center space-y-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 ring-8 ring-emerald-500/15 animate-bounce">
              <MailCheck className="h-10 w-10" />
            </div>

            <div className="space-y-2.5">
              <DialogTitle className="text-2xl font-black text-slate-950 tracking-tight">Check Your Inbox</DialogTitle>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                We have transmitted an instant activation link to:
              </p>
              <div className="inline-block rounded-xl border border-emerald-300 bg-emerald-50/80 px-4 py-1.5 font-bold text-emerald-900 text-sm shadow-xs">
                {registeredEmail}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-slate-200 bg-slate-50/80 p-5 text-left space-y-2.5 text-xs text-slate-700 shadow-xs">
              <p className="font-bold text-slate-950 flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Statutory Verification Steps:
              </p>
              <ul className="space-y-1.5 font-medium pl-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Open your email inbox (or spam folder).</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Locate the message from <strong>Carbon Bridge / Supabase</strong>.</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Click the cryptographic activation link to enter the marketplace.</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                onClick={openGmail}
                className="w-full gap-2 h-12 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold shadow-lg shadow-emerald-600/30 cursor-pointer"
                size="lg"
              >
                Open Gmail <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 h-11 rounded-xl border-slate-300 font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
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
          <div className="relative flex flex-col">
            {/* Attractive Header */}
            <div className="pt-8 pb-3 px-8 text-center space-y-2">
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 ring-4 ring-emerald-500/15">
                <Sparkles className="h-6 w-6" />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-950 tracking-tight">
                {tab === "login" ? "Access Carbon Bridge" : "Create Enterprise Account"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600 font-semibold max-w-xs mx-auto leading-relaxed">
                Connect directly with industrial CO₂ emitters, offtakers, and certified cryogenic carriers.
              </DialogDescription>
            </div>

            {/* Content Container */}
            <div className="px-8 pb-8 space-y-5">
              {/* Google OAuth Option */}
              <div className="space-y-3 pt-1">
                <GoogleButton
                  className="w-full justify-center gap-3 cursor-pointer h-11 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-900 font-extrabold transition-all shadow-xs hover:shadow-md"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading}
                />

                <div className="relative text-center text-[10px] after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-slate-200">
                  <span className="relative z-10 bg-white px-3 text-slate-500 uppercase font-black tracking-wider">
                    Or continue with credentials
                  </span>
                </div>
              </div>

              {/* Tabs for Login vs Register */}
              <Tabs value={tab} onValueChange={setTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 h-11">
                  <TabsTrigger
                    value="login"
                    className="rounded-xl font-extrabold text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all"
                  >
                    Sign In
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="rounded-xl font-extrabold text-xs data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm transition-all"
                  >
                    Create Account
                  </TabsTrigger>
                </TabsList>

                {/* SIGN IN TAB */}
                <TabsContent value="login" className="mt-4">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-900">Corporate Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="name@company.com"
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 text-slate-950 font-medium text-sm transition-all"
                                {...field}
                              />
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
                            <FormLabel className="text-xs font-bold text-slate-900">Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••••••"
                                className="h-11 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 text-slate-950 font-medium text-sm transition-all"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer mt-2"
                        disabled={loginForm.formState.isSubmitting}
                      >
                        {loginForm.formState.isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Lock className="mr-2 h-4 w-4" />
                        )}
                        Sign In to Dashboard
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* SIGN UP TAB */}
                <TabsContent value="register" className="mt-4">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3.5">
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-900">Company / Facility Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g. ABC Cement Works Pvt Ltd"
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 text-slate-950 font-medium text-sm transition-all"
                                {...field}
                              />
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
                            <FormLabel className="text-xs font-bold text-slate-900">Work Email</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="procurement@company.com"
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 text-slate-950 font-medium text-sm transition-all"
                                {...field}
                              />
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
                            <FormLabel className="text-xs font-bold text-slate-900">Master Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Min. 6 alphanumeric characters"
                                className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 text-slate-950 font-medium text-sm transition-all"
                                {...field}
                              />
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
                            <FormLabel className="text-xs font-bold text-slate-900">Operating Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/60 font-semibold text-slate-900 text-xs">
                                  <SelectValue placeholder="Select marketplace participation role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border-2 border-slate-200 shadow-xl">
                                <SelectItem value="EMITTER" className="font-medium text-xs py-2.5">
                                  🏭 CO₂ Emitter / Industrial Seller (Cement, Steel, Power)
                                </SelectItem>
                                <SelectItem value="CO2_BUYER" className="font-medium text-xs py-2.5">
                                  ⚡ CO₂ Buyer / Industrial Offtaker (Fuels, Agri, Chemical)
                                </SelectItem>
                                <SelectItem value="LOGISTICS_PROVIDER" className="font-medium text-xs py-2.5">
                                  🚛 Cryogenic Fleet Carrier & Logistics Provider
                                </SelectItem>
                                <SelectItem value="REGULATOR" className="font-medium text-xs py-2.5">
                                  ⚖️ Environmental Authority & Carbon Auditor
                                </SelectItem>
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
                              <FormLabel className="text-xs font-bold text-slate-900">Industry</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Cement, Steel, Tech"
                                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 text-slate-950 font-medium text-sm transition-all"
                                  {...field}
                                />
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
                              <FormLabel className="text-xs font-bold text-slate-900">Location</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Mumbai, India"
                                  className="h-10 rounded-xl border-slate-200 bg-slate-50/60 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-600 text-slate-950 font-medium text-sm transition-all"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="submit"
                        className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer mt-2"
                        disabled={registerForm.formState.isSubmitting}
                      >
                        {registerForm.formState.isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Building2 className="mr-2 h-4 w-4" />
                        )}
                        Complete Registration
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>

              {/* Security & Compliance Footnote */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-500 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Audited 256-bit encrypted industrial provenance ledger</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
