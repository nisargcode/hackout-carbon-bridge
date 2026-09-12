"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Company, CompanyType } from "@/types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  company: Company | null;
  companyType: CompanyType | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    companyType: CompanyType,
    industry: string,
    location: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshCompany: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompany = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!error && data) {
        setCompany(data);
      } else {
        setCompany(null);
      }
    } catch {
      setCompany(null);
    }
  };

  const refreshCompany = async () => {
    if (user?.id) {
      await fetchCompany(user.id);
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

  const getRedirectUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/auth/callback?next=/dashboard`;
    }
    return process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`
      : undefined;
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = getRedirectUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });
      return { error: error?.message ?? null };
    } catch (err: any) {
      return { error: err?.message ?? "Google sign-in initialization failed" };
    }
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
    const redirectUrl = getRedirectUrl();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          company_type: companyType,
          industry,
          location,
        },
      },
    });
    if (error) return { error: error.message };

    if (data.user) {
      const { error: companyError } = await supabase.from("companies").insert({
        user_id: data.user.id,
        name,
        company_type: companyType,
        industry,
        location,
        verification_status: false,
        sustainability_score: 85.0,
        contact_details: { email },
      });
      if (companyError) {
        console.error("Failed to insert company row:", companyError);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setCompany(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        company,
        companyType: company?.company_type ?? null,
        isLoading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        refreshCompany,
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
