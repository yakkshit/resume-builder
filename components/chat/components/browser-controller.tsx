"use client";

import React, { useState } from "react";
import {
  Globe,
  Play,
  Pause,
  UserCheck,
  Bot,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Copy,
  Check,
  MousePointer,
  ChevronRight,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Persona } from "@/components/ai-elements/persona";
import { cn } from "@/lib/utils";

export interface BrowserStep {
  step: number;
  action: "navigate" | "click" | "type" | "scroll" | "extract" | "handoff" | "wait";
  url?: string;
  selector?: string;
  value?: string;
  desc?: string;
  status?: "pending" | "executing" | "completed" | "paused" | "failed";
  timestamp?: string;
}

export interface BrowserControllerData {
  title?: string;
  currentUrl?: string;
  mode?: "agent" | "human_takeover" | "completed";
  steps?: BrowserStep[];
  extractedData?: Record<string, unknown> | string;
  reasonForHandoff?: string;
}

interface BrowserControllerProps {
  data?: BrowserControllerData;
  onSendMessage?: (msg: string) => void;
  onOpenWebview?: (url: string) => void;
}

export function BrowserController({
  data,
  onSendMessage,
  onOpenWebview,
}: BrowserControllerProps) {
  const currentUrl = data?.currentUrl || data?.steps?.[0]?.url || "https://www.google.com/search?q=senior+ai+engineer+jobs";
  const [activeMode, setActiveMode] = useState<"agent" | "human_takeover" | "completed">(
    data?.mode || (data?.reasonForHandoff ? "human_takeover" : "agent")
  );
  const [steps, setSteps] = useState<BrowserStep[]>(
    data?.steps || [
      { step: 1, action: "navigate", url: currentUrl, desc: `Navigated to ${currentUrl}`, status: "completed" },
      { step: 2, action: "extract", desc: "Extracting job listings and requirements", status: "completed" },
      { step: 3, action: "handoff", desc: "Awaiting user interaction or 2FA login verification", status: "paused" },
    ]
  );
  const [copiedJsonl, setCopiedJsonl] = useState(false);
  const [viewJsonl, setViewJsonl] = useState(false);

  // Generate JSONL representation
  const jsonlOutput = steps
    .map((s) =>
      JSON.stringify({
        step: s.step,
        action: s.action,
        url: s.url,
        selector: s.selector,
        value: s.value,
        desc: s.desc,
        status: s.status,
      })
    )
    .join("\n");

  const completedCount = steps.filter((s) => s.status === "completed").length;

  const handleTakeOver = () => {
    setActiveMode("human_takeover");
    setSteps((prev) =>
      prev.map((s) => (s.action === "handoff" ? { ...s, status: "executing" } : s))
    );
  };

  const handleResumeAgent = () => {
    setActiveMode("agent");
    setSteps((prev) =>
      prev.map((s) => (s.status === "paused" ? { ...s, status: "completed" } : s))
    );
    if (onSendMessage) {
      onSendMessage(`Human takeover complete for ${currentUrl}. Resuming autonomous browsing workflow.`);
    }
  };

  const handleCopyJsonl = () => {
    navigator.clipboard.writeText(jsonlOutput);
    setCopiedJsonl(true);
    setTimeout(() => setCopiedJsonl(false), 1500);
  };

  return (
    <div className="w-full rounded-2xl border border-border/80 bg-gradient-to-b from-background via-background/95 to-muted/20 backdrop-blur-xl shadow-xl overflow-hidden text-xs transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-muted/40 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <Persona
            state={activeMode === "human_takeover" ? "asleep" : "speaking"}
            variant="obsidian"
            className="size-7"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {data?.title || "Autonomous Chromium Browser MCP"}
              </span>
              <Badge
                variant={activeMode === "human_takeover" ? "destructive" : "outline"}
                className={cn(
                  "text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full transition-all",
                  activeMode === "human_takeover"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                )}
              >
                {activeMode === "human_takeover" ? "👤 You're in Control" : "🤖 Agent Navigating"}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground truncate max-w-[280px] sm:max-w-md block">
              {currentUrl}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setViewJsonl((v) => !v)}
            className="h-7 px-2.5 text-[11px] rounded-full flex items-center gap-1.5 border-border/70 hover:bg-muted"
          >
            <Code2 className="size-3.5 text-primary" />
            <span>{viewJsonl ? "Visual View" : "JSONL Stream"}</span>
          </Button>

          {activeMode === "human_takeover" ? (
            <Button
              type="button"
              size="sm"
              onClick={handleResumeAgent}
              className="h-7 px-3 text-[11px] rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Play className="size-3 fill-current" />
              <span>Resume Agent</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTakeOver}
              className="h-7 px-3 text-[11px] rounded-full border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <MousePointer className="size-3 text-amber-500" />
              <span>Take Over (Cursor)</span>
            </Button>
          )}

          {onOpenWebview && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenWebview(currentUrl)}
              className="h-7 w-7 p-0 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              title="Open Webview Panel"
            >
              <ExternalLink className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Friendly Human Takeover Notice Banner */}
      {activeMode === "human_takeover" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 px-4 py-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border-b border-amber-500/25 text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <div className="size-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
              <HeartHandshake className="size-3.5" />
            </div>
            <div>
              <p className="text-xs font-semibold">
                {data?.reasonForHandoff || "I paused here so you can interact directly with the browser."}
              </p>
              <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
                Click links, solve CAPTCHAs, or sign in. Click <strong>Resume Agent</strong> when you're done!
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleResumeAgent}
            className="h-7 text-xs px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-full shadow-sm shrink-0"
          >
            Hand Back to Agent
          </Button>
        </div>
      )}

      {/* Progress & Step Tracker */}
      <div className="px-4 py-2 bg-muted/20 border-b border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="font-medium">
          Progress: <strong className="text-foreground">{completedCount} of {steps.length} steps</strong> completed
        </span>
        <div className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase font-mono tracking-wider">Live MCP Session</span>
        </div>
      </div>

      {/* JSONL / Action Steps View */}
      {viewJsonl ? (
        <div className="p-3 bg-neutral-950 font-mono text-[11px] text-emerald-400 max-h-56 overflow-y-auto relative rounded-b-xl">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCopyJsonl}
            className="absolute top-2 right-2 h-6 px-2 text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 text-[10px] rounded-md"
          >
            {copiedJsonl ? <Check className="size-3 text-emerald-400 mr-1" /> : <Copy className="size-3 mr-1" />}
            {copiedJsonl ? "Copied" : "Copy JSONL"}
          </Button>
          <pre className="whitespace-pre-wrap leading-relaxed pr-16">{jsonlOutput}</pre>
        </div>
      ) : (
        <div className="p-3 space-y-2 max-h-60 overflow-y-auto">
          {steps.map((step) => (
            <div
              key={step.step}
              className={cn(
                "flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200",
                step.status === "completed"
                  ? "bg-muted/30 border-border/50 text-foreground"
                  : step.status === "paused"
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300"
                  : "bg-background border-border/70"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={cn(
                    "size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    step.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.step}
                </span>
                <Badge variant="outline" className="text-[10px] font-mono capitalize px-1.5 py-0 shrink-0">
                  {step.action}
                </Badge>
                <span className="text-xs truncate font-medium">
                  {step.desc || step.url || step.selector}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 ml-2">
                {step.status === "completed" ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                    <CheckCircle2 className="size-3.5" /> Done
                  </span>
                ) : step.status === "paused" ? (
                  <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium animate-pulse">
                    <Pause className="size-3.5" /> Paused for you
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">Queued</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friendly Footer */}
      <div className="px-4 py-2.5 bg-muted/30 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" />
          Seamless bidirectional cursor handoff & MCP command dispatch
        </span>
        <span className="text-[10px] font-medium text-muted-foreground">Ready whenever you are ✨</span>
      </div>
    </div>
  );
}
