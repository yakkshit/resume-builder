"use client";

import React, { useState } from "react";
import {
  Terminal,
  Play,
  Copy,
  Check,
  Zap,
  Server,
  Sparkles,
  Briefcase,
  Bot,
  FileText,
  Clock,
  Database,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Code2,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadTokensDialog } from "@/components/tokens/load-tokens-dialog";

type DemoToolId = "get_memory_vault" | "tailor_resume_for_job" | "search_jobs" | "ask_career_coach" | "generate_interview_questions";

interface DemoTool {
  name: DemoToolId;
  label: string;
  category: string;
  icon: typeof Sparkles;
  description: string;
  sampleArgs: Record<string, any>;
  sampleResponse: Record<string, any>;
}

const DEMO_TOOLS: DemoTool[] = [
  {
    name: "get_memory_vault",
    label: "get_memory_vault",
    category: "Memory Vault",
    icon: Database,
    description: "Fetch the user's master career knowledge base to ground AI models.",
    sampleArgs: { userId: "user_alex_dev" },
    sampleResponse: {
      userId: "user_alex_dev",
      vaultLength: 2840,
      vaultMarkdown: `# Master Career Memory Vault\n\n## Professional Identity\nStaff / Principal Engineer with 8+ years designing fault-tolerant distributed systems.\n\n## Core Competencies\n- TypeScript, Go, Python, React 19, Next.js, Kubernetes, PostgreSQL\n- Scaled payment microservices to 10M+ daily events with 99.99% uptime\n- Pioneered Model Context Protocol (MCP) tool harness for automated workflows.`,
      _quota: { limit: 100, remaining: 98, resetsAt: "00:00 UTC" },
    },
  },
  {
    name: "tailor_resume_for_job",
    label: "tailor_resume_for_job",
    category: "ATS Optimization",
    icon: FileText,
    description: "Analyze a target job posting and rewrite bullet points with high-impact action verbs.",
    sampleArgs: {
      jobTitle: "Senior Full Stack Architect",
      companyName: "Stripe",
      jobDescription: "Distributed systems, low latency APIs, TypeScript, and high-concurrency event pipelines.",
    },
    sampleResponse: {
      atsScore: 94,
      matchGrade: "Strong Match (A+)",
      tailoredSummary: "Architect with proven expertise engineering distributed event pipelines and high-throughput APIs. Directly aligned with Stripe's payments reliability objectives.",
      recommendedBulletPoints: [
        "Architected distributed microservices cutting P99 latency by 44% under 15,000 req/sec peak loads.",
        "Refactored legacy event buses into decoupled Redis/Kafka streams with zero message loss across $40M monthly volume.",
      ],
      keywordsInjected: ["distributed event pipelines", "latency optimization", "high-throughput APIs"],
      _quota: { limit: 100, remaining: 97, resetsAt: "00:00 UTC" },
    },
  },
  {
    name: "search_jobs",
    label: "search_jobs",
    category: "Real-Time Jobs",
    icon: Briefcase,
    description: "Search live job openings with real-time salary benchmarks and remote filters.",
    sampleArgs: { query: "Staff AI Engineer", location: "Remote" },
    sampleResponse: {
      resultsCount: 3,
      jobs: [
        {
          title: "Staff AI Infrastructure Engineer",
          company: "Scale AI",
          location: "Remote (US/EU)",
          salary: "$210,000 - $275,000 + Equity",
          matchScore: "96%",
          posted: "Just now",
        },
        {
          title: "Senior Full Stack / Agentic AI",
          company: "Vercel Labs",
          location: "Remote",
          salary: "$185,000 - $230,000",
          matchScore: "91%",
          posted: "2 hours ago",
        },
      ],
      _quota: { limit: 100, remaining: 96, resetsAt: "00:00 UTC" },
    },
  },
  {
    name: "ask_career_coach",
    label: "ask_career_coach",
    category: "AI Advisory",
    icon: Bot,
    description: "Consult the AI Career Coach on negotiation, promotion strategy, or technical pivots.",
    sampleArgs: { question: "How to negotiate equity vs base salary at a Series B startup?" },
    sampleResponse: {
      coachingAdvice: "1. Anchor your ask around de-risked upside: ask for acceleration clauses or performance equity bonuses.\n2. Inquire about the last 409A valuation and preferred price to compute actual dilution.\n3. Frame your impact around your demonstrated ability to shorten platform roadmap velocity.",
      groundedInVault: true,
      _quota: { limit: 100, remaining: 95, resetsAt: "00:00 UTC" },
    },
  },
  {
    name: "generate_interview_questions",
    label: "generate_interview_questions",
    category: "Interview Prep",
    icon: Sparkles,
    description: "Generate behavioral & system design questions tailored with STAR talking points.",
    sampleArgs: { roleTitle: "Staff Platform Engineer", seniority: "Staff" },
    sampleResponse: {
      questionsCount: 2,
      questions: [
        {
          type: "System Design",
          question: "How would you design a distributed rate limiter supporting 100k requests/second across multiple cloud regions?",
          starKeyPoints: {
            situation: "Global DDoS and hot partition bottleneck on auth gateways.",
            action: "Deployed Redis token bucket with local sliding window edge caches.",
            result: "99.999% uptime, reduced central DB queries by 82%.",
          },
        },
      ],
      _quota: { limit: 100, remaining: 94, resetsAt: "00:00 UTC" },
    },
  },
];

export function McpLiveDemo() {
  const [selectedToolId, setSelectedToolId] = useState<DemoToolId>("get_memory_vault");
  const [isRunning, setIsRunning] = useState(false);
  const [remainingQuota, setRemainingQuota] = useState(98);
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"response" | "curl" | "mcp">("response");
  const [loadTokensOpen, setLoadTokensOpen] = useState(false);

  const currentTool = DEMO_TOOLS.find((t) => t.name === selectedToolId) || DEMO_TOOLS[0];

  const handleRunTool = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setRemainingQuota((prev) => Math.max(1, prev - 1));
    }, 350);
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlCommand = `curl -X POST https://resume.cedzlabs.com/api/mcp/rest/alex-demo \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer mcp_sec_live_token" \\\n  -d '${JSON.stringify({ tool: currentTool.name, args: currentTool.sampleArgs }, null, 2)}'`;

  const mcpJsonRpc = JSON.stringify(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: currentTool.name,
        arguments: currentTool.sampleArgs,
      },
    },
    null,
    2
  );

  return (
    <div className="rounded-2xl border border-white/[0.1] bg-[#121216] overflow-hidden shadow-2xl relative">
      {/* Glow background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Telemetry Bar */}
      <div className="bg-[#18181f] border-b border-white/[0.08] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white font-semibold">Live Server:</span>
            <code className="text-primary text-[11px] bg-black/40 px-2 py-0.5 rounded border border-white/5">
              https://resume.cedzlabs.com/api/mcp/alex-demo
            </code>
          </div>
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-mono hidden sm:inline-flex">
            200 OK • 38ms
          </Badge>
        </div>

        {/* Quota Ticker & Load Tokens Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Sliders className="h-3 w-3 text-primary" />
            <span className="text-[11px]">Daily Admin Quota:</span>
            <strong className="text-emerald-400 font-mono text-xs">{remainingQuota} / 100</strong>
            <span className="text-[10px] text-neutral-500 font-mono hidden md:inline">(Resets 00:00 UTC)</span>
          </div>
          <button
            type="button"
            onClick={() => setLoadTokensOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors shadow-xs"
          >
            <Coins className="size-3 text-amber-400" />
            <span>Load Tokens</span>
            <span className="text-[9px] font-mono uppercase bg-amber-500/25 text-amber-200 px-1 py-0.2 rounded font-bold">Coming Soon...</span>
          </button>
          <Badge variant="outline" className="text-[10px] bg-white/5 text-neutral-400 border-white/10 font-mono hidden lg:inline-flex">
            Firebase Synced
          </Badge>
        </div>
      </div>

      {/* Tool Selector Tabs */}
      <div className="p-3 bg-[#15151a] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {DEMO_TOOLS.map((tool) => {
          const Icon = tool.icon;
          const isSelected = selectedToolId === tool.name;
          return (
            <button
              key={tool.name}
              type="button"
              onClick={() => setSelectedToolId(tool.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.04]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tool.label}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${isSelected ? "bg-black/20 text-white" : "bg-white/5 text-neutral-500"}`}>
                {tool.category}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[380px]">
        {/* Left Column: Input Arguments & Tool Control */}
        <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col justify-between bg-[#111115]">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-500">Tool Schema &amp; Arguments</span>
                <span className="text-[10px] text-primary font-mono font-medium">REST &amp; MCP Compatible</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary" />
                <code>{currentTool.name}</code>
              </h4>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                {currentTool.description}
              </p>
            </div>

            {/* Input Arguments Box */}
            <div className="rounded-xl bg-[#0a0a0d] border border-white/[0.06] p-3 text-xs font-mono">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">JSON Arguments (Payload)</div>
              <pre className="text-neutral-300 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(currentTool.sampleArgs, null, 2)}
              </pre>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Auth: Public, Bearer, or OAuth Client Supported</span>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center gap-3">
            <Button
              type="button"
              onClick={handleRunTool}
              disabled={isRunning}
              className="flex-1 h-10 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Play className={`h-3.5 w-3.5 fill-current ${isRunning ? "animate-spin" : ""}`} />
              <span>{isRunning ? "Executing via MCP..." : "Test Run Tool Live"}</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Output Preview & Ready-To-Copy Snippets */}
        <div className="lg:col-span-7 p-5 bg-[#0d0d10] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              {/* Output / Curl / MCP tabs */}
              <div className="flex items-center gap-1 bg-[#16161c] p-0.5 rounded-lg border border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setActiveView("response")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeView === "response" ? "bg-white/10 text-white font-semibold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Live Response
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("curl")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeView === "curl" ? "bg-white/10 text-white font-semibold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  cURL REST
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView("mcp")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    activeView === "mcp" ? "bg-white/10 text-white font-semibold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  JSON-RPC 2.0
                </button>
              </div>

              {/* Copy Output Button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const toCopy =
                    activeView === "response"
                      ? JSON.stringify(currentTool.sampleResponse, null, 2)
                      : activeView === "curl"
                      ? curlCommand
                      : mcpJsonRpc;
                  handleCopyCode(toCopy);
                }}
                className="h-7 px-2.5 text-xs text-neutral-400 hover:text-white hover:bg-white/10"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                <span>{copied ? "Copied!" : "Copy Snippet"}</span>
              </Button>
            </div>

            {/* Output Display Area */}
            <div className="relative rounded-xl border border-white/[0.08] bg-[#070709] p-4 font-mono text-xs overflow-hidden">
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                {activeView === "response" && (
                  <pre className="text-emerald-400 text-[11px] leading-relaxed">
                    {JSON.stringify(
                      {
                        ...currentTool.sampleResponse,
                        _quota: {
                          limit: 100,
                          remaining: remainingQuota,
                          resetsAt: "00:00 UTC",
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                )}
                {activeView === "curl" && (
                  <pre className="text-sky-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                    {curlCommand}
                  </pre>
                )}
                {activeView === "mcp" && (
                  <pre className="text-purple-300 text-[11px] leading-relaxed">
                    {mcpJsonRpc}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Quick Client Config Pill Footer */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-xs text-neutral-400 gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Connectable in Cursor, Claude Desktop, &amp; Windsurf</span>
            </span>
            <span className="font-mono text-[11px] text-neutral-500">
              Each user gets 100 requests/day admin allowance
            </span>
          </div>
        </div>
      </div>

      <LoadTokensDialog open={loadTokensOpen} onOpenChange={setLoadTokensOpen} />
    </div>
  );
}

