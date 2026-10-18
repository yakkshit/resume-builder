"use client";

import React, { useState, useEffect } from "react";
import {
  GitBranch,
  ShieldCheck,
  Lock,
  Download,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Database,
  Key,
  Flame,
  FileCode,
  Server,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  downloadSecurityTokenFile, 
  GITHUB_SYNC_STORAGE_RECORD,
  type GitHubSyncResult 
} from "@/lib/github/github-database-sync";

interface GitHubSyncCardProps {
  repoName?: string;
  branch?: string;
  githubToken?: string;
  encryptionPassphrase?: string;
  lastSyncResult?: GitHubSyncResult | null;
  onTriggerSync?: () => Promise<void>;
  className?: string;
}

export function GitHubSyncCard({
  repoName = "career-agent-database",
  branch = "main",
  githubToken = "",
  encryptionPassphrase = "",
  lastSyncResult,
  onTriggerSync,
  className,
}: GitHubSyncCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [storedSync, setStoredSync] = useState<{
    timestamp: string;
    timestampEpoch: number;
    commitSha: string;
    repo: string;
    branch: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(GITHUB_SYNC_STORAGE_RECORD);
        if (raw) setStoredSync(JSON.parse(raw));
      } catch {}
    }
  }, [lastSyncResult]);

  const handleDownloadToken = () => {
    downloadSecurityTokenFile({
      token: githubToken,
      passphrase: encryptionPassphrase,
      repo: repoName,
    });
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const handleSyncClick = async () => {
    if (!onTriggerSync) return;
    setIsSyncing(true);
    try {
      await onTriggerSync();
    } finally {
      setIsSyncing(false);
    }
  };

  const activeTimestamp = lastSyncResult?.timestamp || storedSync?.timestamp;
  const activeSha = lastSyncResult?.commitSha || storedSync?.commitSha;

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-[#141418] p-5 shadow-2xl space-y-4 text-neutral-200 select-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
            <Database className="size-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white truncate">
                Self-Managed GitHub Database
              </h3>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shrink-0 flex items-center gap-1">
                <Lock className="size-2.5" /> AES-256 Encrypted
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 truncate mt-0.5 flex items-center gap-1.5 font-mono">
              <GitBranch className="size-3 text-neutral-500" />
              <span>{repoName}</span>
              <span className="text-neutral-600">({branch})</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadToken}
            className="h-8 px-2.5 text-xs bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200 rounded-xl gap-1.5"
            title="Download Master Token & Key file (.json)"
          >
            <Download className="size-3.5" />
            <span>{downloaded ? "Downloaded!" : "Download Token File"}</span>
          </Button>

          {onTriggerSync && (
            <Button
              type="button"
              size="sm"
              disabled={isSyncing}
              onClick={handleSyncClick}
              className="h-8 px-3 text-xs bg-sky-500 hover:bg-sky-600 text-white rounded-xl gap-1.5 font-medium shadow-md shadow-sky-500/20"
            >
              <RefreshCw className={cn("size-3.5", isSyncing && "animate-spin")} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Zero-Leakage Architecture Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Firebase Private Vault */}
        <div className="p-3.5 rounded-xl border border-orange-500/20 bg-orange-500/[0.04] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-300">
            <Flame className="size-3.5 text-orange-400" />
            <span>Firebase Private Vault (SQL / Cloud)</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Personal identity (Name, Phone, Email, Location) and raw AI API keys are stored here.
            <strong> Completely excluded from GitHub commits.</strong>
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-400 font-medium">
            <ShieldCheck className="size-3" /> Zero Git Leaks Guaranteed
          </div>
        </div>

        {/* GitHub Database */}
        <div className="p-3.5 rounded-xl border border-sky-500/20 bg-sky-500/[0.04] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300">
            <Lock className="size-3.5 text-sky-400" />
            <span>Encrypted GitHub Repository</span>
          </div>
          <p className="text-[11px] text-neutral-400 leading-snug">
            Career memories, graph nodes, resume snapshots, and skill dossiers are encrypted with AES-256-GCM before pushing.
          </p>
          <div className="flex items-center gap-1.5 pt-1 text-[10px] text-sky-300 font-medium">
            <Key className="size-3" /> Client-Side Derived PBKDF2 Key
          </div>
        </div>
      </div>

      {/* Timestamp-Aware Sync Status Telemetry */}
      {activeTimestamp ? (
        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="size-3.5 shrink-0" />
            <span className="truncate">
              Commit {activeSha ? activeSha.slice(0, 7) : "verified"} • Up to date
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 shrink-0">
            <Clock className="size-3 text-neutral-500" />
            <span>
              Synced: {new Date(activeTimestamp).toLocaleDateString([], { month: "short", day: "numeric" })} at {new Date(activeTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono text-neutral-500">
          <div className="flex items-center gap-2">
            <Clock className="size-3.5" />
            <span>Timestamp status: Ready for initial sync</span>
          </div>
        </div>
      )}
    </div>
  );
}
