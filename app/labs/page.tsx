"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Github,
  ArrowUpRight,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Users,
  Code2,
  Globe,
  Radio,
  ExternalLink,
  Bot,
  Zap,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/labs/product-card";
import { PredictabilityRacingLab } from "@/components/labs/predictability-racing-lab";
import { GridPattern } from "@/components/ui/grid-pattern";

export default function LabsPage() {
  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-white/20 selection:text-white">
      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <Navbar />

      <main className="relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)]">
          <GridPattern
            width={48}
            height={48}
            strokeDasharray="4 4"
            className="opacity-10 stroke-white/[0.08]"
          />
        </div>

        {/* ── 1. HERO SECTION ─────────────────────────────────── */}
        <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1 text-xs text-zinc-400 backdrop-blur-md mb-6"
          >
            <span className="size-1.5 rounded-full bg-[#aff33e]" />
            <span className="text-zinc-300 font-mono text-[11px]">
              Open Source by @yakkshit &bull; Commercial by CedzLabs
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-[-0.035em] text-white leading-tight"
          >
            Open Source{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#aff33e] via-emerald-300 to-white">
              Labs.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mt-6 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            Building the future of developer tooling, agentic AI, and autonomous systems. All core open-source projects are maintained by{" "}
            <a
              href="https://github.com/yakkshit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-medium underline hover:text-[#aff33e] transition-colors"
            >
              @yakkshit
            </a>
            , with enterprise commercial cloud powered by CedzLabs.
          </motion.p>

          {/* Primary & Secondary CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5"
          >
            <Button
              asChild
              size="lg"
              className="h-11 px-7 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow-none transition-all"
            >
              <a
                href="https://github.com/yakkshit"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Github className="size-4" />
                <span>Follow @yakkshit on GitHub</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 px-6 rounded-full border-white/15 bg-transparent text-zinc-300 hover:text-white text-xs font-medium"
            >
              <a
                href="https://labs.cedzlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <span>Commercial Hub (labs.cedzlabs.com)</span>
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </motion.div>
        </section>

        {/* ── 2. FEATURED PRODUCTS (BENTO GRID) ───────────────── */}
        <section className="relative px-4 max-w-6xl mx-auto pb-24">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Featured Open Source Ecosystem
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Maintained by @yakkshit &bull; Transparent, extensible, and free for the builder community.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-500">
              <span className="size-2 rounded-full bg-[#aff33e]" />
              <span>Active Repositories</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Card 1: CareerAgent (Span 2 / Large) */}
            <ProductCard
              title="CareerAgent"
              badges={["Autonomous Career OS", "Model Context Protocol", "Open Source"]}
              description="The personal AI agent that tailors resumes to beat ATS parsers, conducts realistic mock interviews with STAR scoring, and manages your career trajectory with dedicated Dynamic MCP & REST endpoints."
              span="col-span-1 md:col-span-2"
              stars="★ 4.9 (128 Reviews)"
              primaryLink={{
                label: "Launch Studio",
                href: "/chat",
                isExternal: false,
              }}
              secondaryLink={{
                label: "yakkshit/resume-builder",
                href: "https://github.com/yakkshit/resume-builder",
                isExternal: true,
                icon: "github",
              }}
              visual={
                <div className="p-4 sm:p-6 bg-gradient-to-b from-zinc-900/60 to-black font-mono text-xs text-zinc-300 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Bot className="size-3.5 text-[#aff33e]" />
                      <span>CareerAgent MCP Protocol v2.0</span>
                    </span>
                    <span className="text-[#aff33e] text-[10px]">100 requests/day &bull; AES-256</span>
                  </div>
                  <div className="text-[12px] text-zinc-400 space-y-1">
                    <p className="text-zinc-500">// Connected to Claude Desktop / Cursor:</p>
                    <p className="text-emerald-400">$ cursor-agent &gt; call tool &quot;tailor_resume_to_jd&quot; --ats-target 95</p>
                    <p className="text-zinc-300">&gt; ATS Score: 94% | Single-Page Budget: Balanced | 12+ Vector LaTeX Presets</p>
                  </div>
                </div>
              }
            />

            {/* Card 2: nde (Next Development Environment) */}
            <ProductCard
              title="NDE (Neural Dev Environment)"
              badges={["Developer Tooling", "Open Source", "Autonomous Coding"]}
              description="High-performance next-generation terminal and agentic development environment. Seamlessly orchestrates local LLMs, MCP tool servers, and automated code review sandboxes."
              span="col-span-1"
              primaryLink={{
                label: "yakkshit/nde",
                href: "https://github.com/yakkshit/nde",
                isExternal: true,
              }}
              secondaryLink={{
                label: "Yakkshit GitHub",
                href: "https://github.com/yakkshit",
                isExternal: true,
                icon: "github",
              }}
              visual={
                <div className="p-4 bg-black font-mono text-xs text-zinc-300 space-y-1.5 overflow-x-auto">
                  <div className="text-zinc-500 text-[10px]">// Clone &amp; launch NDE</div>
                  <div className="text-emerald-400">$ git clone https://github.com/yakkshit/nde.git</div>
                  <div className="text-zinc-400 text-[11px]">&gt; Initialized NDE runtime &bull; Agent harness active</div>
                  <div className="text-[#aff33e] text-[11px]">&gt; Connected to local MCP socket and sandboxed toolrunner</div>
                </div>
              }
            />

            {/* Card 3: context-gen-cli */}
            <ProductCard
              title="context-gen-cli"
              badges={["Developer Tooling", "Open Source", "npm & pip"]}
              description="A cross-platform CLI tool and live Model Context Protocol (MCP) server. Scans codebases, builds dependency graphs, enforces security filters, and generates token-efficient context files for AI agents (Cursor, Claude, VS Code)."
              span="col-span-1"
              primaryLink={{
                label: "View on npm",
                href: "https://www.npmjs.com/package/context-gen-cli",
                isExternal: true,
              }}
              secondaryLink={{
                label: "yakkshit/context-gen-cli",
                href: "https://github.com/yakkshit/context-gen-cli",
                isExternal: true,
                icon: "github",
              }}
              visual={
                <div className="p-4 bg-black font-mono text-xs text-zinc-300 space-y-1.5 overflow-x-auto">
                  <div className="text-zinc-500 text-[10px]">// Quick scan &amp; token optimization</div>
                  <div className="text-emerald-400">$ npx context-gen-cli scan --mcp</div>
                  <div className="text-zinc-400 text-[11px]">&gt; Parsed 1,420 files in 480ms</div>
                  <div className="text-zinc-400 text-[11px]">&gt; Generated .ai-context.json (saved 78% tokens)</div>
                  <div className="text-[#aff33e] text-[11px]">&gt; Live MCP Server listening on stdio &amp; HTTP</div>
                </div>
              }
            />

            {/* Card 4: PredictaSteal (Upcoming Open Source Project) */}
            <ProductCard
              title="PredictaSteal &bull; OSINT &amp; Threat Profiler"
              badges={["Upcoming Project", "Threat Modeling", "Cybersecurity", "Open Source"]}
              description="Behavioral entropy &amp; threat surface analyzer. Tests how predictable your daily routines and digital exhaust are, mapping how automated infostealers (RedLine, Lumma) and spearphishers target your session cookies, decrypted browser vaults, and credentials."
              span="col-span-1"
              primaryLink={{
                label: "yakkshit/predictasteal",
                href: "https://github.com/yakkshit/nde",
                isExternal: true,
              }}
              secondaryLink={{
                label: "Yakkshit GitHub",
                href: "https://github.com/yakkshit",
                isExternal: true,
                icon: "github",
              }}
              visual={
                <div className="p-4 bg-black font-mono text-xs text-zinc-300 space-y-1.5 overflow-x-auto">
                  <div className="text-zinc-500 text-[10px]">// Daily routine entropy &amp; stealer audit</div>
                  <div className="text-emerald-400">$ npx predictasteal audit --daily-patterns</div>
                  <div className="text-zinc-400 text-[11px]">&gt; Pattern Entropy: 28% (High Predictability Risk)</div>
                  <div className="text-amber-400 text-[11px]">&gt; Vulnerable: DPAPI Chrome Session Cookie Vault</div>
                  <div className="text-[#aff33e] text-[11px]">&gt; Countermeasure: Ephemeral browser sandbox generated</div>
                </div>
              }
            />

            {/* Card 5: ApexTelemetry (Upcoming Racing Project) */}
            <ProductCard
              title="ApexTelemetry &bull; ROS2 Racing OS"
              badges={["Upcoming Project", "Autonomous Racing", "ROS2 / C++", "Bodensee RT"]}
              description="High-frequency telemetry analysis and reflex performance engine for track drivers and autonomous vehicles. Ingests CAN-bus &amp; ROS2 bag files to optimize trail-braking deltas, tire slip angles, lateral G fatigue, and apex trajectories."
              span="col-span-1"
              primaryLink={{
                label: "yakkshit/apex-telemetry",
                href: "https://github.com/yakkshit/nde",
                isExternal: true,
              }}
              secondaryLink={{
                label: "Yakkshit GitHub",
                href: "https://github.com/yakkshit",
                isExternal: true,
                icon: "github",
              }}
              visual={
                <div className="p-4 bg-black font-mono text-xs text-zinc-300 space-y-1.5 overflow-x-auto">
                  <div className="text-zinc-500 text-[10px]">// Ingest telemetry &amp; calculate corner delta</div>
                  <div className="text-emerald-400">$ ros2 run apex_telemetry lap_delta --circuit bodensee-ring</div>
                  <div className="text-zinc-400 text-[11px]">&gt; Turn 4 Delta: -0.42s | Trail-braking: 14m deeper</div>
                  <div className="text-zinc-400 text-[11px]">&gt; Lateral G-Force: 1.84G | Slip Angle: 7.2&deg; (Optimal)</div>
                  <div className="text-[#aff33e] text-[11px]">&gt; Driver cognitive reaction latency: 168ms (Target Met)</div>
                </div>
              }
            />

            {/* Card 6: CedzLabs Commercial Ecosystem */}
            <ProductCard
              title="CedzLabs Commercial Hub"
              badges={["Commercial", "Enterprise", "Cloud Systems"]}
              description="Enterprise multi-agent robotics, high-throughput cloud infrastructure, and custom organizational placements powered and maintained commercially by CedzLabs."
              span="col-span-1 md:col-span-2"
              primaryLink={{
                label: "Visit labs.cedzlabs.com",
                href: "https://labs.cedzlabs.com",
                isExternal: true,
              }}
              secondaryLink={{
                label: "CedzLabs Official",
                href: "https://cedzlabs.com",
                isExternal: true,
                icon: "external",
              }}
              visual={
                <div className="p-4 bg-black font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-400">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-white text-[11px]">
                      <Radio className="size-3 text-[#aff33e] animate-pulse" />
                      <span>Commercial Cloud &amp; Multi-Agent Deployments</span>
                    </div>
                    <div className="text-[11px] text-zinc-500">Dedicated VPCs, custom LLM fine-tuning, and enterprise SLAs</div>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-[10px] text-zinc-400 self-start sm:self-auto">
                    Enterprise
                  </Badge>
                </div>
              }
            />
          </div>
        </section>

        {/* ── 3. INTERACTIVE LAB: PREDICTABILITY & RACING OS ─── */}
        <section className="relative px-4 max-w-6xl mx-auto pb-24 border-t border-white/10 pt-16">
          <PredictabilityRacingLab />
        </section>

        {/* ── 4. "WHY OPEN SOURCE?" SECTION ───────────────────── */}
        <section className="border-t border-white/10 py-24 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Why Open Source?
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Open source maintainer: <strong className="text-white">@yakkshit</strong>. Commercial &amp; enterprise operations: <strong className="text-white">CedzLabs</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-7 flex flex-col space-y-4 hover:border-white/20 transition-all">
              <div className="size-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#aff33e]">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Radical Transparency</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                No black boxes. Inspect our code on GitHub, verify our zero-knowledge security, and fork anytime. Your sensitive career vault data stays client-side.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-7 flex flex-col space-y-4 hover:border-white/20 transition-all">
              <div className="size-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#aff33e]">
                <Users className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Community Driven</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Built by engineers for engineers. Contributions, issues, and feature pull requests are directly reviewed and merged on @yakkshit repositories.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-white/10 bg-zinc-950/60 p-7 flex flex-col space-y-4 hover:border-white/20 transition-all">
              <div className="size-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#aff33e]">
                <Code2 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Free &amp; Accessible</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Core tools are freely available to empower the next generation of builders. 100 free requests per day without credit cards or lock-in.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4. CALL TO ACTION TO LABS HUB ───────────────────── */}
        <section className="border-t border-white/10 py-20 px-4 text-center max-w-4xl mx-auto">
          <div className="inline-flex size-10 rounded-full bg-[#aff33e]/10 border border-[#aff33e]/30 items-center justify-center text-[#aff33e] mb-4">
            <Zap className="size-5" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Explore All Repositories
          </h2>
          <p className="mt-3 text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto">
            Discover all open-source repositories by @yakkshit and commercial systems by CedzLabs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="h-11 px-8 rounded-full bg-white text-black hover:bg-zinc-200 text-xs font-semibold"
            >
              <a href="https://github.com/yakkshit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Github className="size-4" />
                <span>github.com/yakkshit</span>
                <ArrowUpRight className="size-3.5" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 px-6 rounded-full border-white/15 bg-transparent text-zinc-300 hover:text-white text-xs font-medium"
            >
              <a href="https://labs.cedzlabs.com" target="_blank" rel="noopener noreferrer">
                Visit Commercial Hub
              </a>
            </Button>
          </div>
        </section>
      </main>

      {/* ── 5. FOOTER ATTRIBUTION ─────────────────────────────── */}
      <footer className="border-t border-white/10 bg-black py-16 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-[#aff33e]" />
              <span className="text-white font-semibold text-sm">Open Source Labs</span>
              <span className="text-[10px] font-mono border border-white/10 px-1.5 rounded text-zinc-400">
                Maintained by @yakkshit
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] text-zinc-400">
              <a
                href="https://github.com/yakkshit/nde"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                NDE (GitHub)
              </a>
              <a
                href="https://github.com/yakkshit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                GitHub (@yakkshit)
              </a>
              <a
                href="https://labs.cedzlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Commercial (CedzLabs)
              </a>
              <a
                href="https://linkedin.com/in/yakkshit"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-zinc-600">
            <div>
              Open source maintainer:{" "}
              <a
                href="https://github.com/yakkshit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white underline underline-offset-2"
              >
                Yakkshit
              </a>
              . Commercial operations by{" "}
              <a
                href="https://cedzlabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-300 hover:text-white underline underline-offset-2"
              >
                CedzLabs
              </a>
              .
            </div>
            <div>&copy; {new Date().getFullYear()} All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
