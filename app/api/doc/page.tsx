"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  Server,
  Key,
  Shield,
  Layers,
  FileCode,
  ArrowRight,
  Database,
} from "lucide-react";
import { GridPattern } from "@/components/ui/grid-pattern";

interface EndpointDoc {
  method: "POST" | "GET" | "OPTIONS";
  path: string;
  category: "MCP Protocol" | "REST Tools" | "PDF Engine" | "Config & Telemetry";
  summary: string;
  description: string;
  authRequired: boolean;
  sampleRequest: string;
  sampleResponse: string;
}

const ENDPOINTS: EndpointDoc[] = [
  {
    method: "POST",
    path: "/api/mcp/[slug]",
    category: "MCP Protocol",
    summary: "Dynamic User MCP Server Endpoint",
    description:
      "Full JSON-RPC 2.0 Model Context Protocol endpoint for your personal user agent. Supports tools/list, tools/call, initialize, and ping. Integrates seamlessly with Claude Desktop, Cursor, and Windsurf.",
    authRequired: false,
    sampleRequest: JSON.stringify(
      {
        jsonrpc: "2.0",
        id: "call-1",
        method: "tools/call",
        params: {
          name: "ats_resume_scorer",
          arguments: {
            resumeText: "Senior Full Stack Engineer with 6 years experience building distributed React & Node systems...",
            targetRole: "Staff Backend Engineer",
          },
        },
      },
      null,
      2
    ),
    sampleResponse: JSON.stringify(
      {
        jsonrpc: "2.0",
        id: "call-1",
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                overallScore: 88,
                atsPassLikelihood: "HIGH",
                keywordMatchPercent: 91,
                matchedKeywords: ["Distributed Systems", "React", "Node", "TypeScript"],
                recommendations: ["Add quantitative impact metrics to bullet points 2 and 4"],
              }),
            },
          ],
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/mcp/rest/[slug]",
    category: "REST Tools",
    summary: "REST-Friendly MCP Tool Execution",
    description:
      "Execute any of the 38+ career & developer tools using clean, standard REST JSON payloads without managing JSON-RPC framing. Accepts optional Bearer token in Authorization header.",
    authRequired: false,
    sampleRequest: JSON.stringify(
      {
        tool: "job_keywords_matcher",
        arguments: {
          jobDescription: "We are looking for a Senior DevOps engineer experienced with Kubernetes, Terraform, and AWS CI/CD pipelines.",
        },
      },
      null,
      2
    ),
    sampleResponse: JSON.stringify(
      {
        success: true,
        tool: "job_keywords_matcher",
        data: {
          criticalKeywords: ["Kubernetes", "Terraform", "AWS", "CI/CD"],
          skillCategories: {
            cloud: ["AWS"],
            orchestration: ["Kubernetes"],
            iac: ["Terraform"],
          },
        },
        quota: {
          dailyLimit: 100,
          used: 14,
          remaining: 86,
        },
      },
      null,
      2
    ),
  },
  {
    method: "POST",
    path: "/api/generate-pdf",
    category: "PDF Engine",
    summary: "Vector ATS-Compliant PDF Rendering",
    description:
      "Renders publication-grade, ATS-parsable vector PDFs from structured resume or cover letter JSON using Chromium rendering engines.",
    authRequired: true,
    sampleRequest: JSON.stringify(
      {
        template: "modern",
        resumeData: {
          basics: {
            name: "Alex Mercer",
            label: "Senior Backend Engineer",
            email: "alex@example.com",
          },
          work: [
            {
              company: "Stripe",
              position: "Infrastructure Lead",
              summary: "Scaled payment orchestrator to 45,000 TPS with 99.999% availability.",
            },
          ],
        },
      },
      null,
      2
    ),
    sampleResponse: "Binary Stream: application/pdf (200 OK)",
  },
  {
    method: "GET",
    path: "/api/mcp/user-config",
    category: "Config & Telemetry",
    summary: "Retrieve User MCP Preferences & Daily Quotas",
    description:
      "Fetches user server slug, authorization mode (public, private bearer, API key), custom enabled tools, and daily 100-request quota usage.",
    authRequired: false,
    sampleRequest: "GET /api/mcp/user-config?userId=usr_live_7x89q2",
    sampleResponse: JSON.stringify(
      {
        success: true,
        config: {
          slug: "alex-mercer",
          authType: "none",
          isPublic: true,
          requestsUsedToday: 12,
          dailyQuota: 100,
          enabledToolCount: 38,
        },
      },
      null,
      2
    ),
  },
];

export default function ApiDocPage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeDoc = ENDPOINTS[selectedIdx];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCurl = (endpoint: EndpointDoc) => {
    const baseUrl = "https://resume.cedzlabs.com";
    if (endpoint.method === "GET") {
      return `curl -X GET "${baseUrl}${endpoint.path}?userId=your_user_id"`;
    }
    return `curl -X POST "${baseUrl}${endpoint.path}" \\\n  -H "Content-Type: application/json" \\\n  -d '${endpoint.sampleRequest.replace(/\n/g, "")}'`;
  };

  return (
    <div className="min-h-screen bg-black text-[#ededed] font-sans selection:bg-white/20 selection:text-white">
      {/* ── NAVBAR ────────────────────────────────────────────── */}
      <Navbar />

      <main className="relative overflow-hidden py-12 md:py-20 px-4 sm:px-6">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)]">
          <GridPattern
            width={48}
            height={48}
            strokeDasharray="4 4"
            className="opacity-10 stroke-white/[0.08]"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-1 text-xs text-zinc-400 backdrop-blur-md mb-4">
                <span className="size-1.5 rounded-full bg-[#aff33e]" />
                <span className="text-zinc-300 font-mono text-[11px]">
                  OpenAPI 3.1.0 &bull; Model Context Protocol
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                CareerAgent Developer API Reference
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Connect external agents (Cursor, Claude Desktop, Windsurf, LangChain) directly to your Career Memory Vault, ATS scoring engines, and vector document renderers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-full border-white/15 bg-white/[0.02] text-xs font-mono text-zinc-300 hover:text-white"
              >
                <Link href="/api/openapi" target="_blank" className="flex items-center gap-1.5">
                  <FileCode className="size-3.5" />
                  <span>Raw OpenAPI 3.1 JSON</span>
                  <ExternalLink className="size-3 text-zinc-500" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Authentication Models Banner */}
          <div className="mt-8 p-5 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Key className="size-4 text-[#aff33e]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Authentication Options</h2>
              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">Zero Friction</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <span className="font-semibold text-white flex items-center gap-1.5 mb-1 text-emerald-400">
                  1. Capability Slug (Gemini Ready)
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Passing your private 28-character endpoint slug in <code className="text-zinc-200">/api/mcp/{`{slug}`}</code> acts as a capability key. Perfect for Google Gemini, Claude, and external agents with zero header setup.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <span className="font-semibold text-white flex items-center gap-1.5 mb-1 text-amber-400">
                  2. Bearer Header (Cursor & IDEs)
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Pass <code className="text-zinc-200">Authorization: Bearer &lt;token&gt;</code> in your HTTP headers for Cursor, Windsurf, or terminal curl execution.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-black/60 border border-white/5">
                <span className="font-semibold text-white flex items-center gap-1.5 mb-1 text-sky-400">
                  3. Query Parameter Token
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Append <code className="text-zinc-200">?token=&lt;token&gt;</code> to any MCP or REST endpoint to authenticate seamlessly across all webhooks and AI tools.
                </p>
              </div>
            </div>
          </div>

          {/* Master 2-Column Documentation Grid */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Nav: Endpoint list */}
            <div className="lg:col-span-4 space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 px-2 mb-3">
                Available Endpoints
              </div>
              {ENDPOINTS.map((ep, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <button
                    key={ep.path}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                      isSelected
                        ? "border-[#aff33e]/50 bg-[#aff33e]/5"
                        : "border-white/5 bg-zinc-950/40 hover:bg-zinc-900/40 hover:border-white/15 text-zinc-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            ep.method === "POST"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {ep.summary}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono border-white/10 text-zinc-500">
                        {ep.category}
                      </Badge>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 truncate">
                      {ep.path}
                    </div>
                  </button>
                );
              })}

              <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="p-3.5 rounded-xl border border-white/5 bg-zinc-950/30 text-xs text-zinc-400 space-y-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Shield className="size-3.5 text-[#aff33e]" />
                    <span>Free Community Quota</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    All users get 100 free requests per day, resetting at 00:00 UTC. Zero credit card required.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Endpoint detail & Code Samples */}
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6 backdrop-blur-xl">
                {/* Method & Path bar */}
                <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-white/10">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                      activeDoc.method === "POST"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    }`}
                  >
                    {activeDoc.method}
                  </span>
                  <span className="text-sm font-mono font-semibold text-white">
                    {activeDoc.path}
                  </span>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-zinc-400">
                      {activeDoc.authRequired ? "Auth Required" : "Public / Optional Bearer"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-white">{activeDoc.summary}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {activeDoc.description}
                  </p>
                </div>

                {/* cURL snippet */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-zinc-400">cURL Example</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(generateCurl(activeDoc))}
                      className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {copied ? <Check className="size-3 text-[#aff33e]" /> : <Copy className="size-3" />}
                      <span>{copied ? "Copied" : "Copy cURL"}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-black border border-white/10 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                    <code>{generateCurl(activeDoc)}</code>
                  </pre>
                </div>

                {/* Payload Samples */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-mono text-zinc-400 mb-2">Sample Request</span>
                    <pre className="p-3.5 rounded-xl bg-black border border-white/10 font-mono text-[11px] text-zinc-300 overflow-x-auto max-h-72">
                      <code>{activeDoc.sampleRequest}</code>
                    </pre>
                  </div>
                  <div>
                    <span className="block text-xs font-mono text-zinc-400 mb-2">Sample Response</span>
                    <pre className="p-3.5 rounded-xl bg-black border border-white/10 font-mono text-[11px] text-zinc-400 overflow-x-auto max-h-72">
                      <code>{activeDoc.sampleResponse}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-black py-12 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#aff33e]" />
            <span className="text-white font-medium">CareerAgent</span>
            <span className="font-mono text-[10px]">API Reference</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-zinc-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/price" className="hover:text-white">Pricing</Link>
            <Link href="/labs" className="hover:text-white">Labs</Link>
            <Link href="/feedback" className="hover:text-white">Feedback</Link>
            <Link href="/chat" className="hover:text-white">Studio</Link>
          </div>
          <div className="font-mono text-[11px] text-zinc-600">
            &copy; {new Date().getFullYear()} CedzLabs. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

