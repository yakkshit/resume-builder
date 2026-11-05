"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, HelpCircle, ArrowRight, Sparkles, Zap, Shield, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GridPattern } from "@/components/ui/grid-pattern";

const PRICING_FAQS = [
  {
    q: "How does the Free Community Tier work?",
    a: "Every user receives 100 free requests every single day. This includes tailoring resumes, generating cover letters, practicing interview questions, and querying your dedicated MCP & REST server. Quotas automatically reset each night at 00:00 UTC.",
  },
  {
    q: "Can I use my personal Dynamic MCP server in Cursor and Claude Desktop on the Free Tier?",
    a: "Yes! Every CareerAgent user gets a dedicated MCP endpoint (e.g. `resume.cedzlabs.com/api/mcp/your-name`) compatible with Claude Desktop, Cursor, and Windsurf out of the box with 100 daily requests.",
  },
  {
    q: "What payment methods do you accept for Pro?",
    a: "We accept all major credit cards (Visa, MasterCard, Amex), Apple Pay, Google Pay, and GitHub Sponsors via Stripe's encrypted payment checkout.",
  },
  {
    q: "Is there a long-term commitment or cancellation penalty?",
    a: "No. You can cancel your subscription at any time with a single click from your profile settings. You will retain Pro access until the end of your billing cycle.",
  },
  {
    q: "Do you offer student, researcher, or open-source discounts?",
    a: "Yes! Students, academics, and active open-source maintainers receive a 50% discount on Pro plans. Contact us via the feedback page or email contact@cedzlabs.com.",
  },
];

const COMPARISON_FEATURES = [
  { feature: "Daily AI Quota", free: "100 requests/day", pro: "Unlimited", enterprise: "Custom / Dedicated" },
  { feature: "Dedicated MCP & REST Endpoint", free: "Standard", pro: "High Priority", enterprise: "Custom VPC" },
  { feature: "Career Memory Vault (AES-256)", free: "Yes (Client Encrypted)", pro: "Yes (Multi-version)", enterprise: "Enterprise HSM" },
  { feature: "ATS Vector PDF & LaTeX Export", free: "All 12+ Designs", pro: "All 12+ Designs + Custom", enterprise: "Custom Brand Templates" },
  { feature: "Real-time GitHub & Portfolio Sync", free: "Manual", pro: "Automated Webhooks", enterprise: "SSO + Org Scanners" },
  { feature: "AI Mock Interview Coaching (STAR)", free: "Standard AI", pro: "Gemini 1.5 Pro & Claude 3.5", enterprise: "Fine-tuned Role Models" },
  { feature: "Autonomous Agent Job Scraper", free: "Preview", pro: "Full Automation", enterprise: "Dedicated Worker Fleet" },
  { feature: "Support SLA", free: "Community Discord", pro: "Priority Email", enterprise: "24/7 Dedicated Slack Channel" },
];

export default function PricePage() {
  const [annualBilling, setAnnualBilling] = useState(false);

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-white/20 selection:text-white">
      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <Navbar />

      <main className="relative overflow-hidden">
        {/* Subtle background grid pattern */}
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)]">
          <GridPattern
            width={48}
            height={48}
            strokeDasharray="4 4"
            className="opacity-10 stroke-white/[0.08]"
          />
        </div>

        {/* ── 1. HERO ─────────────────────────────────────────── */}
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-20 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1 text-xs text-zinc-400 backdrop-blur-md mb-6"
          >
            <span className="size-1.5 rounded-full bg-[#aff33e]" />
            <span className="text-zinc-300 font-mono text-[11px]">
              Predictable Pricing &bull; No Hidden Fees
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="text-4xl sm:text-6xl font-black tracking-[-0.035em] text-white leading-tight"
          >
            Simple, transparent plans for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#aff33e] to-white">
              ambitious builders.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Start free with 100 requests every single day. Upgrade when you need unlimited multi-agent scrapers, custom MCP tools, and priority processing.
          </motion.p>

          {/* Billing Switcher */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22 }}
            className="mt-10 inline-flex items-center gap-3 p-1 rounded-full border border-white/10 bg-zinc-950/80 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setAnnualBilling(false)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                !annualBilling
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setAnnualBilling(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                annualBilling
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] font-mono text-[#aff33e] bg-[#aff33e]/10 border border-[#aff33e]/30 px-1.5 py-0.2 rounded-full">
                Save 20%
              </span>
            </button>
          </motion.div>
        </section>

        {/* ── 2. PRICING CARDS ─────────────────────────────────── */}
        <section className="relative px-4 max-w-6xl mx-auto pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Community Free */}
            <div className="relative rounded-2xl border border-white/10 bg-zinc-950/60 p-7 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Community</h3>
                  <Badge variant="outline" className="text-[10px] font-mono text-zinc-400 border-white/10">
                    Free Forever
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  Ideal for students and software engineers getting started with AI-tailored career tools.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">$0</span>
                  <span className="text-xs text-zinc-500 font-mono">/ month</span>
                </div>

                <div className="mt-8 space-y-3 border-t border-white/5 pt-6 text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span><strong>100 free requests</strong> / day (auto-resets at 00:00 UTC)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Master Career Memory Vault</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Dedicated MCP &amp; REST Server endpoint</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>All 12+ Vector PDF &amp; LaTeX resume designs</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Zero-Knowledge AES-256 client encryption</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  asChild
                  className="w-full h-10 rounded-full border border-white/15 bg-white/[0.04] text-white hover:bg-white/10 text-xs font-medium"
                >
                  <Link href="/chat">Get Started Free</Link>
                </Button>
              </div>
            </div>

            {/* Card 2: Pro Career OS (Featured) */}
            <div className="relative rounded-2xl border-2 border-[#aff33e]/50 bg-gradient-to-b from-[#aff33e]/[0.04] via-zinc-950 to-zinc-950 p-7 flex flex-col justify-between shadow-[0_0_40px_rgba(175,243,62,0.08)]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-medium text-black bg-[#aff33e]">
                  <Sparkles className="size-3" />
                  <span>MOST POPULAR</span>
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Pro Career OS</h3>
                  <Badge variant="outline" className="text-[10px] font-mono text-[#aff33e] border-[#aff33e]/30 bg-[#aff33e]/5">
                    Full Autonomous Power
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  For active job seekers who want automated agent scrapers, priority queueing, and unlimited power.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    ${annualBilling ? "15" : "19"}
                  </span>
                  <span className="text-xs text-zinc-500 font-mono">
                    / month {annualBilling && "(billed $180/yr)"}
                  </span>
                </div>

                <div className="mt-8 space-y-3 border-t border-white/5 pt-6 text-xs text-zinc-200">
                  <div className="flex items-center gap-2.5 font-medium text-white">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span><strong>Unlimited AI requests</strong> &amp; priority speed</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Autonomous Multi-Agent Job Scraper</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Custom MCP tools with private bearer token auth</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Real-time GitHub &amp; LinkedIn portfolio sync</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Graph RAG deep skills graph &amp; gap analysis</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Priority Gemini 1.5 Pro &amp; Claude 3.5 Sonnet access</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  asChild
                  className="w-full h-10 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow-none transition-all"
                >
                  <Link href="/chat" className="flex items-center justify-center gap-2">
                    <span>Start 7-Day Pro Trial</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Card 3: Enterprise */}
            <div className="relative rounded-2xl border border-white/10 bg-zinc-950/60 p-7 flex flex-col justify-between hover:border-white/20 transition-all">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Enterprise &amp; Teams</h3>
                  <Badge variant="outline" className="text-[10px] font-mono text-zinc-400 border-white/10">
                    Volume &amp; VPC
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  For universities, tech bootcamps, and career centers managing hundreds of job placements.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white tracking-tight">Custom</span>
                  <span className="text-xs text-zinc-500 font-mono">/ team seat</span>
                </div>

                <div className="mt-8 space-y-3 border-t border-white/5 pt-6 text-xs text-zinc-300">
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Private VPC or on-prem deployment</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Institutional ATS benchmarks &amp; audit reports</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Bulk student/team seats &amp; admin dashboard</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>Custom LLM fine-tuning on company rubric</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="size-4 text-[#aff33e] shrink-0" />
                    <span>99.9% Uptime SLA &amp; dedicated engineer</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  asChild
                  className="w-full h-10 rounded-full border border-white/15 bg-white/[0.04] text-white hover:bg-white/10 text-xs font-medium"
                >
                  <a href="mailto:contact@cedzlabs.com?subject=CareerAgent%20Enterprise%20Inquiry">
                    Contact Enterprise Sales
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. FEATURE COMPARISON MATRIX ────────────────────── */}
        <section className="border-t border-white/10 py-20 px-4 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Feature by Feature Comparison
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Everything you need to know about what is included in each tier.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/10 bg-zinc-950/60">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-white/10 bg-zinc-900/40 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Feature</th>
                  <th className="py-3.5 px-4">Community</th>
                  <th className="py-3.5 px-4 text-[#aff33e]">Pro OS</th>
                  <th className="py-3.5 px-4">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_FEATURES.map((row) => (
                  <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-white">{row.feature}</td>
                    <td className="py-3 px-4 text-zinc-400">{row.free}</td>
                    <td className="py-3 px-4 text-zinc-200 font-semibold">{row.pro}</td>
                    <td className="py-3 px-4 text-zinc-400">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 4. PRICING FAQ ──────────────────────────────────── */}
        <section className="border-t border-white/10 py-20 px-4 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-zinc-400">
              Common questions regarding quotas, subscriptions, and security.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {PRICING_FAQS.map((faq, i) => (
              <AccordionItem
                key={faq.q}
                value={`faq-${i}`}
                className="border border-white/10 rounded-xl px-5 bg-zinc-950/40 data-[state=open]:border-white/20 transition-all"
              >
                <AccordionTrigger className="text-sm font-medium text-white hover:text-zinc-200 hover:no-underline py-4 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-xs text-zinc-400 leading-relaxed pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* ── 5. BOTTOM CTA ───────────────────────────────────── */}
        <section className="border-t border-white/10 py-20 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex size-10 rounded-full bg-[#aff33e]/10 border border-[#aff33e]/30 items-center justify-center text-[#aff33e] mb-4">
            <Zap className="size-5" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to upgrade your job hunt?
          </h2>
          <p className="mt-3 text-zinc-400 text-sm max-w-lg mx-auto">
            Join thousands of developers using CareerAgent to land top-tier tech roles.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 px-7 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-semibold"
            >
              <Link href="/chat">Get Started Free (100 req/day)</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 px-7 rounded-full border-white/15 bg-transparent text-zinc-300 hover:text-white text-xs"
            >
              <Link href="/labs">Explore CedzLabs Ecosystem</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-black py-12 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#aff33e]" />
            <span className="text-white font-medium">CareerAgent</span>
            <span className="font-mono text-[10px]">by CedzLabs</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-zinc-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/labs" className="hover:text-white">Labs</Link>
            <Link href="/chat" className="hover:text-white">Studio</Link>
            <Link href="/feedback" className="hover:text-white">Feedback</Link>
            <Link href="/api/doc" className="hover:text-white">API Docs</Link>
          </div>
          <div className="font-mono text-[11px] text-zinc-600">
            &copy; {new Date().getFullYear()} CedzLabs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
