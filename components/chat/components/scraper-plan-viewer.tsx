"use client";

import React, { useState } from "react";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ScraperExecutionPlan } from "@/lib/scrapers/resilient-scraper";

interface ScraperPlanViewerProps {
  plan: ScraperExecutionPlan;
  onRetry?: () => void;
  className?: string;
}

export function ScraperPlanViewer({ plan, onRetry, className }: ScraperPlanViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"insights" | "raw" | "pipeline">("insights");
  const [isRetrying, setIsRetrying] = useState(false);

  const handleCopy = () => {
    if (!plan.extractedData?.content) return;
    navigator.clipboard.writeText(plan.extractedData.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetryClick = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const isDirect = plan.chosenProvider === "direct";
  const isFirecrawl = plan.chosenProvider === "firecrawl";
  const isTavily = plan.chosenProvider === "tavily";

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#141418] p-5 shadow-2xl space-y-4 text-neutral-200 select-none",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "size-9 rounded-xl flex items-center justify-center shrink-0 border",
              isDirect
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                : isFirecrawl
                ? "bg-orange-500/10 border-orange-500/25 text-orange-400"
                : "bg-sky-500/10 border-sky-500/25 text-sky-400"
            )}
          >
            <Globe className="size-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">
                {plan.extractedData?.title || "Web Scraper Plan & Intel"}
              </h3>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0",
                  isDirect
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : isFirecrawl
                    ? "bg-orange-500/15 border-orange-500/30 text-orange-300"
                    : "bg-sky-500/15 border-sky-500/30 text-sky-300"
                )}
              >
                {isDirect ? "Direct HTTP" : isFirecrawl ? "Firecrawl Engine" : "Tavily AI Search"}
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
              Target: <span className="text-neutral-300 font-mono">{plan.url}</span>
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRetrying}
              onClick={handleRetryClick}
              className="h-8 px-2.5 text-xs bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 rounded-xl"
            >
              <RefreshCw className={cn("size-3.5 mr-1.5", isRetrying && "animate-spin")} />
              Retry
            </Button>
          )}

          <a
            href={plan.url}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-colors"
            title="Open Target URL"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Multi-Tier Execution Plan Timeline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-neutral-300 flex items-center gap-1.5">
            <Cpu className="size-3.5 text-neutral-400" /> Multi-Tier Fallback Execution Plan
          </span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {plan.totalDurationMs}ms total latency
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {plan.steps.map((s, idx) => (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-xl border text-xs transition-all",
                s.status === "success"
                  ? "bg-emerald-500/[0.07] border-emerald-500/25 text-emerald-200"
                  : s.status === "fallback"
                  ? "bg-amber-500/[0.06] border-amber-500/20 text-amber-200"
                  : "bg-white/[0.02] border-white/10 text-neutral-400"
              )}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="size-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                    {s.stepNumber}
                  </span>
                  {s.name}
                </span>
                <span className="text-[10px] font-mono opacity-80">{s.latencyMs}ms</span>
              </div>
              <p className="text-[11px] mt-1.5 line-clamp-2 opacity-90 leading-snug">
                {s.details}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Keywords Chips */}
      {plan.extractedData?.keywords?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mr-1">
            Keywords:
          </span>
          {plan.extractedData.keywords.map((kw, i) => (
            <span
              key={i}
              className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300"
            >
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* Content Tabs (Insights vs Raw vs Pipeline) */}
      <div className="border border-white/10 rounded-xl overflow-hidden bg-[#18181e]">
        <div className="flex items-center justify-between border-b border-white/10 bg-[#1e1e26] px-3 py-1.5 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("insights")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                activeTab === "insights"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Extracted Insights
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-medium transition-colors",
                activeTab === "raw"
                  ? "bg-white/10 text-white"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Raw Body ({plan.extractedData?.wordCount || 0} words)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded-md hover:bg-white/10 transition-colors"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="p-4 text-xs font-mono leading-relaxed max-h-48 overflow-y-auto text-neutral-300">
          {activeTab === "insights" ? (
            <p className="whitespace-pre-wrap">{plan.extractedData?.summary || "No summary available."}</p>
          ) : (
            <pre className="whitespace-pre-wrap text-[11px] text-neutral-400">
              {plan.extractedData?.content || "No raw body content extracted."}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
