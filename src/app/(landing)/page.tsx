"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app-config";
import { AuthDialog } from "@/components/auth/auth-dialog";

export default function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  const openLogin = () => {
    setAuthTab("login");
    setAuthOpen(true);
  };

  const openRegister = () => {
    setAuthTab("register");
    setAuthOpen(true);
  };

  return (
    // Landing page is ALWAYS light — no dark mode, no data-theme-mode attribute changes here.
    <div className="min-h-screen bg-white text-black" style={{ colorScheme: "light" }}>
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <title>Carbon Bridge logo</title>
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M2 12a10 10 0 0 0 10 10" />
              </svg>
            </div>
            <span className="font-semibold text-lg">{APP_CONFIG.name}</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={openLogin}>
              Login
            </Button>
            <Button onClick={openRegister}>Sign Up</Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <main className="mx-auto max-w-screen-xl px-6">
        <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2">
          {/* Left: copy */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h1 className="font-bold text-5xl leading-tight tracking-tight text-black lg:text-6xl">
                CO₂ marketplace
              </h1>
              <p className="max-w-md text-lg text-slate-600 leading-relaxed">
                A marketplace that turns captured CO₂ into a traceable, discoverable and tradeable
                industrial resource.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="rounded-full px-8 text-base"
                onClick={openRegister}
              >
                Get started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 text-base"
                onClick={openLogin}
              >
                Sign in
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 text-slate-600 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                Verified CO₂ Sources
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                Real-time Matching
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-orange-500" />
                Smart Logistics
              </div>
            </div>
          </div>

          {/* Right: graphic */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg">
              <Image
                src="/assets/graphic.png"
                alt="CO₂ marketplace — circular carbon ecosystem illustration"
                width={600}
                height={500}
                className="h-auto w-full object-contain"
                priority
              />
            </div>
          </div>
        </div>

        {/* ─── Stats section ─── */}
        <section className="border-t border-border py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "CO₂ Traded", value: "12,400 tons" },
              { label: "Active Suppliers", value: "340+" },
              { label: "Buyers Served", value: "1,200+" },
              { label: "Avg Match Score", value: "94%" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-bold text-3xl text-black">{stat.value}</p>
                <p className="mt-1 text-slate-600 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Feature highlights ─── */}
        <section className="py-16">
          <h2 className="mb-10 text-center font-bold text-3xl text-black">
            Everything you need to trade CO₂
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🔍",
                title: "Intelligent Matching",
                desc: "AI-powered matching based on purity, quantity, distance, price, and certification.",
              },
              {
                icon: "📦",
                title: "Logistics Management",
                desc: "Connect with logistics providers who bid competitively on transportation jobs.",
              },
              {
                icon: "📜",
                title: "Verified Certificates",
                desc: "Full verification layer with lab reports, capture technology audits, and purity tests.",
              },
              {
                icon: "💰",
                title: "Dynamic Pricing",
                desc: "Buy Now, Request Quote, Bid, Negotiate, or enter Long-Term Contracts.",
              },
              {
                icon: "⭐",
                title: "Reputation System",
                desc: "Score every company on Reliability, Quality, Delivery, and Documentation.",
              },
              {
                icon: "📊",
                title: "Role-Based Dashboards",
                desc: "Tailored views for Emitters, Buyers, Logistics Providers, and Regulators.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-semibold text-black">{f.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-16 text-center">
          <div className="rounded-2xl border border-border bg-card px-8 py-12">
            <h2 className="mb-4 font-bold text-3xl text-black">
              Ready to turn carbon into value?
            </h2>
            <p className="mb-8 text-slate-600">
              Join the circular carbon economy. List your CO₂ or find your next supplier.
            </p>
            <Button size="lg" className="rounded-full px-10 text-base" onClick={openRegister}>
              Get started for free
            </Button>
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-white py-6">
        <div className="mx-auto max-w-screen-xl px-6 text-center text-slate-600 text-sm">
          {APP_CONFIG.copyright} All rights reserved.
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </div>
  );
}
