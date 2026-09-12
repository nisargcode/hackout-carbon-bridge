"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Mail, ShieldCheck, Zap, Award, ArrowUpRight, Sparkles, Building2, Truck, CheckCircle2 } from "lucide-react";
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

  const teamMembers = [
    {
      name: "Bhavya Parmar",
      email: "bhavyaparmar19102007@gmail.com",
      avatarBg: "bg-emerald-600",
      initials: "BP",
    },
    {
      name: "Samarth Vaghela",
      email: "samarth7v@gmail.com",
      avatarBg: "bg-teal-600",
      initials: "SV",
    },
    {
      name: "Nisarg Panchal",
      email: "nisargpanchal.abc@gmail.com",
      avatarBg: "bg-cyan-700",
      initials: "NP",
    },
  ];

  return (
    // Landing page is ALWAYS light — clean high-contrast black on white.
    <div className="min-h-screen bg-white text-black font-sans selection:bg-emerald-500 selection:text-white" style={{ colorScheme: "light" }}>
      {/* ─── Top Notification / Announcement Bar ─── */}
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold text-white tracking-wide">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span>Next-Gen Circular Carbon Infrastructure for Global Industrial Offtakers</span>
        </span>
      </div>

      {/* ─── Header ─── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <title>Carbon Bridge logo</title>
                <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <path d="M2 12a10 10 0 0 0 10 10" />
              </svg>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-950">{APP_CONFIG.name}</span>
          </Link>

          {/* Nav links & actions */}
          <div className="flex items-center gap-3">
            <a
              href="#about-us"
              className="hidden sm:inline-block text-sm font-semibold text-slate-800 hover:text-emerald-700 transition-colors px-3 py-1.5"
            >
              About Us
            </a>
            <Button
              variant="ghost"
              onClick={openLogin}
              className="font-bold !text-slate-900 hover:!text-black hover:!bg-slate-200 px-4 cursor-pointer"
            >
              Login
            </Button>
            <Button
              onClick={openRegister}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 !text-white rounded-xl shadow-md shadow-emerald-600/20 px-5 cursor-pointer"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <main className="mx-auto max-w-screen-xl px-6">
        <div className="grid min-h-[calc(100vh-8rem)] grid-cols-1 items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
          {/* Left: copy */}
          <div className="flex flex-col gap-8">
            <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-600/20 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
              Empowering Zero-Carbon Heavy Industry
            </div>

            <div className="flex flex-col gap-5">
              <h1 className="font-black text-5xl leading-[1.1] tracking-tight text-black sm:text-6xl lg:text-7xl">
                CO₂ marketplace
              </h1>
              <p className="max-w-xl text-xl text-slate-900 font-semibold leading-relaxed">
                A marketplace that turns captured CO₂ into a traceable, discoverable and tradeable industrial resource.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="rounded-full bg-emerald-600 hover:bg-emerald-700 !text-white font-extrabold px-9 text-base shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/35 hover:-translate-y-0.5 transition-all cursor-pointer h-13"
                onClick={openRegister}
              >
                Get started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-2 border-slate-300 hover:border-black font-bold px-8 text-base !text-black hover:!text-black hover:!bg-slate-200 hover:-translate-y-0.5 transition-all cursor-pointer h-13"
                onClick={openLogin}
              >
                Sign in
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-slate-950 font-bold text-sm">
              <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200 px-3 py-1.5 rounded-full">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                Verified CO₂ Sources
              </div>
              <div className="flex items-center gap-2 bg-slate-100/90 border border-slate-200 px-3 py-1.5 rounded-full">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                Real-time Matching
              </div>

            </div>
          </div>

          {/* Right: graphic */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-lg rounded-3xl p-4 bg-gradient-to-tr from-emerald-100/60 via-slate-100/80 to-teal-50 border border-slate-200 shadow-xl">
              <Image
                src="/assets/graphic.png"
                alt="CO₂ marketplace — circular carbon ecosystem illustration"
                width={600}
                height={500}
                className="h-auto w-full object-contain drop-shadow-md"
                priority
              />
            </div>
          </div>
        </div>

        {/* ─── Stats section ─── */}
        <section className="border-y-2 border-slate-200 bg-slate-50/70 rounded-3xl py-12 px-6 my-10">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "CO₂ Traded", value: "12,400+ tons", accent: "text-emerald-700" },
              { label: "Active Industrial Suppliers", value: "340+", accent: "text-blue-700" },
              { label: "Enterprises Served", value: "1,200+", accent: "text-teal-700" },
              { label: "Avg Match Purity Score", value: "94.8%", accent: "text-purple-700" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className={`font-black text-3xl sm:text-4xl tracking-tight ${stat.accent}`}>{stat.value}</p>
                <p className="mt-2 text-slate-950 font-bold text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Feature highlights ─── */}
        <section className="py-16">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="font-black text-3xl sm:text-4xl text-black tracking-tight">Everything you need to trade CO₂</h2>
            <p className="text-slate-900 font-semibold text-base">
              A comprehensive marketplace engineered for verifiable emissions reduction and industrial circularity.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: "🔍",
                title: "Intelligent Matching",
                desc: "AI-powered matching based on purity, quantity, distance, price, and lab-grade certification.",
              },

              {
                icon: "📜",
                title: "Verified Certificates",
                desc: "Immutable verification layer with lab reports, capture technology audits, and statutory purity assays.",
              },
              {
                icon: "💰",
                title: "Dynamic Pricing",
                desc: "Buy Now, Request Quote, Live Bidding, Counter Offers, or enter multi-year Long-Term Contracts.",
              },
              {
                icon: "⭐",
                title: "Reputation System",
                desc: "Score counterparties on Reliability, Quality Assurance, Delivery Accuracy, and Statutory Compliance.",
              },
              {
                icon: "📊",
                title: "Role-Based Dashboards",
                desc: "Dedicated workspaces engineered for CO₂ Emitters and Industrial Offtakers.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border-2 border-slate-200 bg-white p-7 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-emerald-600 hover:-translate-y-1"
              >
                <div className="mb-4 text-4xl p-2.5 rounded-xl bg-slate-100 inline-block">{f.icon}</div>
                <h3 className="mb-2.5 font-bold text-xl text-black tracking-tight">{f.title}</h3>
                <p className="text-slate-900 font-medium text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─── */}
        <section className="py-12 text-center">
          <div className="rounded-3xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-slate-100 px-8 py-16 shadow-lg">
            <h2 className="mb-4 font-black text-3xl sm:text-4xl text-black tracking-tight">Ready to turn carbon into value?</h2>
            <p className="mb-8 text-slate-950 font-bold text-lg max-w-xl mx-auto leading-relaxed">
              Join the circular carbon economy. List your industrial CO₂ or find your next feedstock supplier in seconds.
            </p>
            <Button
              size="lg"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-10 text-base shadow-xl shadow-emerald-600/30 hover:scale-105 transition-all cursor-pointer h-13"
              onClick={openRegister}
            >
              Get started for free
            </Button>
          </div>
        </section>

        {/* ─── About Us / Team Section ─── */}
        <section id="about-us" className="py-16 border-t-2 border-slate-200 scroll-mt-20">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              Founding Leadership
            </div>
            <h2 className="font-black text-3xl sm:text-4xl text-black tracking-tight">About Us</h2>
            <p className="text-slate-900 font-semibold text-base leading-relaxed">
              Carbon Bridge was built to solve one of humanity’s greatest industrial bottlenecks: transforming atmospheric and post-combustion CO₂ from a liability into a verified, tradeable industrial asset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="group relative rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm hover:shadow-xl hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`h-14 w-14 rounded-2xl ${member.avatarBg} text-white flex items-center justify-center font-black text-lg shadow-md ring-4 ring-slate-100 group-hover:scale-105 transition-transform`}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-black tracking-tight">{member.name}</h3>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2">
                  <a
                    href={`mailto:${member.email}`}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-950 hover:text-emerald-900 text-xs font-bold transition-all group/mail"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Mail className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover/mail:text-emerald-700 transition-transform group-hover/mail:translate-x-0.5 group-hover/mail:-translate-y-0.5 shrink-0" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ─── Footer ─── */}
      <footer className="border-t-2 border-slate-200 bg-slate-50 py-10 mt-10">
        <div className="mx-auto max-w-screen-xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-900 font-semibold text-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-black">
              CB
            </div>
            <span>{APP_CONFIG.name} — Circular Industrial Decarbonization Protocol</span>
          </div>
          <div className="text-slate-800 text-xs font-medium">
            © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
          </div>
        </div>
      </footer>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab={authTab} />
    </div>
  );
}
