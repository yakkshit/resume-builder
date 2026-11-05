"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Server,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const V2_CACHE_FLAG = "career-agent-v2-migrated-v1";

export function V2MigrationBar() {
  const [isDismissed, setIsDismissed] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanedDone, setCleanedDone] = useState(false);
  const [preserveKeys, setPreserveKeys] = useState(true);
  const [cleanedCount, setCleanedCount] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const migrated = localStorage.getItem(V2_CACHE_FLAG);
    // Show banner if not yet migrated in this browser
    if (!migrated) {
      setIsDismissed(false);
    }
  }, []);

  const handleOpenModal = () => {
    setModalOpen(true);
    setCleanedDone(false);
  };

  const handlePerformMigration = async () => {
    setCleaning(true);

    try {
      // 1. Stash important keys if preserve is requested
      let stashedKeys: string | null = null;
      let stashedProfile: string | null = null;
      let stashedAuth: string | null = null;

      if (preserveKeys && typeof window !== "undefined") {
        stashedKeys = localStorage.getItem("career_agent_api_keys") || localStorage.getItem("cv_provider_keys");
        stashedProfile = localStorage.getItem("career_agent_profile") || localStorage.getItem("chat_profile_settings");
        stashedAuth = localStorage.getItem("career_auth_user");
      }

      // Simulate step-by-step cleanup visual
      await new Promise((r) => setTimeout(r, 600));

      let count = 0;
      if (typeof window !== "undefined") {
        // Collect all localStorage keys
        const allKeys = Object.keys(localStorage);
        allKeys.forEach((k) => {
          if (k !== V2_CACHE_FLAG) {
            localStorage.removeItem(k);
            count++;
          }
        });

        // Restore stashed keys if requested
        if (preserveKeys) {
          if (stashedKeys) localStorage.setItem("cv_provider_keys", stashedKeys);
          if (stashedProfile) localStorage.setItem("chat_profile_settings", stashedProfile);
          if (stashedAuth) localStorage.setItem("career_auth_user", stashedAuth);
        }

        // Mark v2 as migrated
        localStorage.setItem(V2_CACHE_FLAG, new Date().toISOString());

        // Clear sessionStorage
        try {
          sessionStorage.clear();
        } catch {}
      }

      setCleanedCount(count);
      setCleanedDone(true);
      await new Promise((r) => setTimeout(r, 1200));

      // Reload window for fresh clean v2 state
      window.location.reload();
    } catch (e) {
      console.warn("Cache reset notice:", e);
      setCleaning(false);
    }
  };

  if (isDismissed) return null;

  return (
    <>
      {/* ── TOP ANNOUNCEMENT BAR ──────────────────────────────────────────────── */}
      <div className="relative isolate z-50 bg-gradient-to-r from-amber-500/20 via-primary/20 to-cyan-500/20 border-b border-amber-500/30 px-3 py-2 text-foreground backdrop-blur-md">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 text-xs max-w-7xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-5 items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-2 text-[10px] font-bold text-amber-300 uppercase tracking-wide shrink-0">
              <Zap className="h-3 w-3 animate-pulse" />
              v2.0 Upgrade
            </span>
            <p className="truncate text-neutral-200">
              <strong className="text-white font-medium">Notice:</strong> Moving to Career Agent v2.0 with Dynamic MCP &amp; RAG. Clear legacy cache to avoid data conflicts and unlock your 100 req/day quota!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              onClick={handleOpenModal}
              className="h-6 px-2.5 text-[11px] font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-xs rounded-md flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear Cache &amp; Upgrade</span>
            </Button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── CACHE RESET CONFIRMATION MODAL ────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-[#16161a] border-white/[0.1] text-white p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-1">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              Clean Cache &amp; Upgrade to v2.0
            </DialogTitle>
            <DialogDescription className="text-xs text-neutral-400 leading-relaxed">
              We have migrated to **CareerAgent v2.0** with personalized dynamic MCP endpoints, 38+ career tools, and 100 requests/day daily quotas. Stale localStorage schemas from v1 can cause UI glitches or desynced sessions.
            </DialogDescription>
          </DialogHeader>

          {!cleanedDone ? (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-lg bg-[#111114] border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="font-medium flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    Preserve API keys &amp; identity
                  </span>
                  <input
                    type="checkbox"
                    checked={preserveKeys}
                    onChange={(e) => setPreserveKeys(e.target.checked)}
                    className="rounded bg-black border-white/20 text-primary focus:ring-0 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 leading-normal">
                  Keeps your saved Google/Gemini, OpenAI, Anthropic keys and profile name while wiping outdated cache and broken state.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-neutral-300 space-y-1">
                <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-emerald-400" />
                  What you get in v2.0:
                </div>
                <ul className="text-[10px] text-neutral-400 space-y-0.5 list-disc pl-4">
                  <li>Your personal dynamic MCP endpoint: <code className="text-white font-mono">/api/mcp/[slug]</code></li>
                  <li>Direct REST tool runner: <code className="text-white font-mono">/api/mcp/rest/[slug]</code></li>
                  <li>100 requests every day to any tool (Firebase tracked)</li>
                  <li>Full Memory Vault sharing with Cursor, Claude, &amp; Windsurf</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center space-y-3">
              <div className="inline-flex size-12 rounded-full bg-emerald-500/20 text-emerald-400 items-center justify-center border border-emerald-500/30 animate-bounce">
                <CheckCircle2 className="size-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Cache Successfully Flushed!</h4>
              <p className="text-xs text-neutral-400">
                Removed legacy state. Reloading into CareerAgent v2.0 in a moment...
              </p>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between gap-2 pt-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={cleaning}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handlePerformMigration}
              disabled={cleaning}
              className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4"
            >
              {cleaning ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Cleaning Cache...
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Confirm &amp; Reload v2.0
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

