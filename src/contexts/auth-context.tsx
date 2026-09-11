"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Company, CompanyType } from "@/types";

export const DEFAULT_DEMO_COMPANIES: Record<CompanyType, Company> = {
  EMITTER: {
    company_id: "11111111-1111-1111-1111-111111111111",
    user_id: "demo-user-1",
    name: "ABC Cement Works (Demo)",
    industry: "Cement Manufacturing",
    company_type: "EMITTER",
    location: "Mumbai, Maharashtra",
    verification_status: true,
    sustainability_score: 96,
    contact_details: { email: "emitter@carbonbridge.org" },
    created_at: new Date().toISOString(),
  },
  CO2_BUYER: {
    company_id: "33333333-3333-3333-3333-333333333333",
    user_id: "demo-user-2",
    name: "CleanFuel Synthesis (Demo)",
    industry: "Synthetic Fuels",
    company_type: "CO2_BUYER",
    location: "Pune, Maharashtra",
    verification_status: true,
    sustainability_score: 92,
    contact_details: { email: "buyer@carbonbridge.org" },
    created_at: new Date().toISOString(),
  },
  LOGISTICS_PROVIDER: {
    company_id: "55555555-5555-5555-5555-555555555555",
    user_id: "demo-user-3",
    name: "CryoTrans Logistics (Demo)",
    industry: "Cryogenic Freight",
    company_type: "LOGISTICS_PROVIDER",
    location: "Navi Mumbai, Maharashtra",
    verification_status: true,
    sustainability_score: 98,
    contact_details: { email: "logistics@carbonbridge.org" },
    created_at: new Date().toISOString(),
  },
  REGULATOR: {
    company_id: "66666666-6666-6666-6666-666666666666",
    user_id: "demo-user-4",
    name: "National Carbon Authority (Demo)",
    industry: "Regulatory Body",
    company_type: "REGULATOR",
    location: "New Delhi, Delhi",
    verification_status: true,
    sustainability_score: 100,
    contact_details: { email: "regulator@carbonbridge.org" },
    created_at: new Date().toISOString(),
  },
  ADMIN: {
    company_id: "66666666-6666-6666-6666-666666666666",
    user_id: "demo-user-5",
    name: "System Administrator (Demo)",
    industry: "Platform Operations",
    company_type: "ADMIN",
    location: "New Delhi, Delhi",
    verification_status: true,
    sustainability_score: 100,
    contact_details: { email: "admin@carbonbridge.org" },
    created_at: new Date().toISOString(),
  },
};

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  company: Company | null;
  companyType: CompanyType | null;
  isLoading: boolean;
  isGuest: boolean;
  setDemoRole: (role: CompanyType) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    companyType: CompanyType,
    industry: string,
    location: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [demoRole, setDemoRoleState] = useState<CompanyType>("EMITTER");
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompany = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (data) {
        setCompany(data);
      }
    } catch {
      // Ignored if table or user not yet present
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompany(session.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCompany(session.user.id);
      } else {
        setCompany(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setDemoRole = (role: CompanyType) => {
    setDemoRoleState(role);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    companyType: CompanyType,
    industry: string,
    location: string,
  ) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const { error: companyError } = await supabase.from("companies").insert({
        user_id: data.user.id,
        name,
        company_type: companyType,
        industry,
        location,
        verification_status: false,
        sustainability_score: 0,
        contact_details: { email },
      });
      if (companyError) return { error: companyError.message };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCompany(null);
  };

  // Provide fallback demo company if not logged in
  const effectiveCompany = company || DEFAULT_DEMO_COMPANIES[demoRole];
  const effectiveCompanyType = effectiveCompany.company_type;
  const isGuest = !user;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        company: effectiveCompany,
        companyType: effectiveCompanyType,
        isLoading,
        isGuest,
        setDemoRole,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
