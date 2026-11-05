"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Copy, Check, Terminal, ChevronDown, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadTokensDialog } from "@/components/tokens/load-tokens-dialog";

interface ToolOption {
  id: string;
  name: string;
  label: string;
  defaultArg: string;
  response: Record<string, any>;
}

const TOOLS: ToolOption[] = [
  {
    id: "memory_vault_inspector",
    name: "memory_vault_inspector",
    label: "Memory Vault (Grounded RAG)",
    defaultArg: "Staff Software Engineer • Distributed Systems",
    response: {
      jsonrpc: "2.0",
      id: 1,
      result: {
        status: "grounded",
        nodesCount: 14,
        topCompetencies: ["Next.js App Router", "Kubernetes", "Vector Embeddings", "Kafka P95 Latency"],
        verifiedMetrics: ["$25M+ monthly volume", "48% latency cut", "60% cold-start drop"],
        source: "Master Career Memory Vault (AES-256)",
      },
    },
  },
  {
    id: "tailor_resume_section",
    name: "tailor_resume_section",
    label: "Tailor Bullet Points (Action+Metric)",
    defaultArg: "Led multi-region distributed cache optimization",
    response: {
      jsonrpc: "2.0",
      id: 2,
      result: {
        score: "98/100 ATS",
        tailoredBullet: "Architected distributed Redis multi-tier caching layer across 4 AWS regions, slashing P95 client API latency by 48% under 100k req/s load.",
        characterBudget: "142 / 160 chars",
        zodValidated: true,
      },
    },
  },
  {
    id: "calculate_ats_score",
    name: "calculate_ats_score",
    label: "Calculate ATS Compliance Score",
    defaultArg: "Senior AI Engineer — Cedzlabs (Target Role)",
    response: {
      jsonrpc: "2.0",
      id: 3,
      result: {
        score: 96,
        matchingKeywords: ["LangChain", "RAG", "MCP Protocol", "Postgres", "Zod"],
        missingKeywords: ["Go (minor)"],
        readabilityIndex: "Single-page vector verified",
      },
    },
  },
];

export function McpBentoCard() {
  const [selectedToolId, setSelectedToolId] = useState<string>("memory_vault_inspector");
  const currentTool = TOOLS.find((t) => t.id === selectedToolId) || TOOLS[0];
  const [argumentValue, setArgumentValue] = useState<string>(currentTool.defaultArg);
  const [isExecuting, setIsExecuting] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(true);
  const [copied, setCopied] = useState(false);
  const [loadTokensOpen, setLoadTokensOpen] = useState(false);

  const handleToolChange = (id: string) => {
    setSelectedToolId(id);
    const tool = TOOLS.find((t) => t.id === id);
    if (tool) setArgumentValue(tool.defaultArg);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setHasExecuted(false);
    setTimeout(() => {
      setIsExecuting(false);
      setHasExecuted(true);
    }, 400);
  };

  const copyCurl = () => {
    const curl = `curl -X POST https://resume.cedzlabs.com/api/mcp/rest/user_alex \\\n  -H "Authorization: Bearer mcp_live_token" \\\n  -H "Content-Type: application/json" \\\n  -d '{"tool":"${currentTool.name}","query":"${argumentValue}"}'`;
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#060608] p-6 flex flex-col justify-between transition-all duration-300 hover:border-white/20 relative overflow-hidden group">
      {/* Top Header: Jimo Minimalist */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {/* Subtle Volt Lime Live Pulse Dot */}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#aff33e] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#aff33e]" />
            </span>
            <span className="text-xs font-mono font-medium text-white tracking-wide">
              Dynamic MCP Server
            </span>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-white/10 bg-white/[0.03] text-zinc-400 py-0 px-2"
            >
              100 req/day
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyCurl}
              className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              {copied ? <Check className="size-3 text-[#aff33e]" /> : <Copy className="size-3" />}
              <span>{copied ? "Copied" : "cURL"}</span>
            </button>
            <button
              type="button"
              onClick={() => setLoadTokensOpen(true)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-colors"
            >
              Tokens: 100/100
            </button>
          </div>
        </div>

        {/* Middle: Clean Minimal Input */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedToolId} onValueChange={handleToolChange}>
              <SelectTrigger className="h-9 text-xs bg-[#0b0b0e] border-white/10 text-white rounded-xl sm:w-[220px] focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0e0e12] border-white/10 text-white rounded-xl">
                {TOOLS.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs focus:bg-white/10">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 flex gap-2">
              <Input
                value={argumentValue}
                onChange={(e) => setArgumentValue(e.target.value)}
                placeholder="Enter prompt or argument..."
                className="h-9 text-xs bg-[#0b0b0e] border-white/10 text-white placeholder:text-zinc-600 rounded-xl focus-visible:ring-1 focus-visible:ring-white/20"
              />
              <Button
                size="sm"
                onClick={handleExecute}
                disabled={isExecuting}
                className="h-9 px-4 text-xs font-semibold rounded-xl bg-white text-black hover:bg-zinc-200 transition-all shrink-0 shadow-sm"
              >
                {isExecuting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Execute</span>
                    <ArrowRight className="size-3" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Sleek Sliding Response Drawer */}
      <div className="mt-4">
        <AnimatePresence mode="wait">
          {hasExecuted && (
            <motion.div
              key={selectedToolId + argumentValue}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-xl border border-white/10 bg-[#040406] p-3 text-[11px] font-mono overflow-hidden"
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 pb-2 mb-2 border-b border-white/5">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="size-1.5 rounded-full bg-[#aff33e]" />
                  <span>POST /api/mcp/rest/user_alex</span>
                </span>
                <span className="text-[#aff33e]">200 OK • 22ms</span>
              </div>
              <pre className="text-zinc-300 overflow-x-auto leading-relaxed max-h-[140px] no-scrollbar">
                {JSON.stringify(currentTool.response, null, 2)}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <LoadTokensDialog open={loadTokensOpen} onOpenChange={setLoadTokensOpen} />
    </div>
  );
}

