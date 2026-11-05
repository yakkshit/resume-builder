"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Server,
  KeyRound,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  Database,
  Globe,
  Play,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Unlock,
  Sliders,
  ExternalLink,
  Loader2,
  Code2,
  Coins,
} from "lucide-react";
import { LoadTokensDialog } from "@/components/tokens/load-tokens-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  ALL_MCP_TOOLS,
  type UserMcpConfig,
  type McpAuthType,
  type McpLogEntry,
} from "@/lib/mcp/mcp-tool-definitions";

interface DynamicMcpSettingsProps {
  userId: string;
  userName?: string;
}

export function DynamicMcpSettings({ userId, userName }: DynamicMcpSettingsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showBearerToken, setShowBearerToken] = useState(false);
  const [showOAuthSecret, setShowOAuthSecret] = useState(false);

  // Config state
  const [slug, setSlug] = useState("");
  const [authType, setAuthType] = useState<McpAuthType>("bearer");
  const [bearerToken, setBearerToken] = useState("");
  const [oauthClientId, setOauthClientId] = useState("");
  const [oauthClientSecret, setOauthClientSecret] = useState("");
  const [customHeaderName, setCustomHeaderName] = useState("x-mcp-key");
  const [customHeaderValue, setCustomHeaderValue] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(100);

  // Usage & Telemetry state
  const [stats, setStats] = useState({
    limit: 100,
    used: 0,
    remaining: 100,
    resetsAt: "",
    tokensUsed: 0,
    toolCounts: {} as Record<string, number>,
  });
  const [logs, setLogs] = useState<McpLogEntry[]>([]);

  // Interactive Tools state
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [toolSearch, setToolSearch] = useState("");
  const [testingTool, setTestingTool] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ tool: string; result: any; quota: any; status: "success" | "error" } | null>(null);

  // Active client config tab
  const [activeClientTab, setActiveClientTab] = useState<"cursor" | "claudeDesktop" | "claudeCode" | "windsurf" | "curl" | "node">("cursor");

  // Host origin
  const [origin, setOrigin] = useState("https://resume.cedzlabs.com");
  const [loadTokensOpen, setLoadTokensOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const mcpEndpointUrl = useMemo(() => `${origin}/api/mcp/${slug || userId}`, [origin, slug, userId]);
  const restEndpointUrl = useMemo(() => `${origin}/api/mcp/rest/${slug || userId}`, [origin, slug, userId]);

  // Fetch initial config and telemetry
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mcp/user-config?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setSlug(data.config.slug || userId);
          setAuthType(data.config.authType || "bearer");
          setBearerToken(data.config.bearerToken || "");
          setOauthClientId(data.config.oauthClientId || "");
          setOauthClientSecret(data.config.oauthClientSecret || "");
          setCustomHeaderName(data.config.customHeaderName || "x-mcp-key");
          setCustomHeaderValue(data.config.customHeaderValue || "");
          setIsPublic(Boolean(data.config.isPublic));
          setDailyLimit(data.config.dailyLimit || 100);
        }
        if (data.stats) {
          setStats(data.stats);
        }
        if (Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch MCP config:", e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Save config
  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/mcp/user-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          slug,
          authType,
          bearerToken,
          oauthClientId,
          oauthClientSecret,
          customHeaderName,
          customHeaderValue,
          isPublic: authType === "none" ? true : isPublic,
          dailyLimit,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        toast({
          title: "MCP Configuration Saved!",
          description: "Your custom endpoint, authorization settings, and quota are active in Firebase.",
        });
      } else {
        throw new Error("Failed to save MCP configuration");
      }
    } catch (err: any) {
      toast({
        title: "Error Saving Configuration",
        description: err.message || "Failed to update MCP settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Generate tokens
  const handleGenerateBearerToken = () => {
    const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setBearerToken(`mcp_sec_${rand}`);
    toast({ title: "New Bearer Token Generated", description: "Remember to save your configuration." });
  };

  const handleGenerateOAuthCredentials = () => {
    const idRand = Math.random().toString(36).substring(2, 10);
    const secRand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setOauthClientId(`client_${idRand}`);
    setOauthClientSecret(`sec_${secRand}`);
    toast({ title: "New OAuth Credentials Generated", description: "Remember to save your configuration." });
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast({ title: "Copied to Clipboard!" });
  };

  // Test tool via REST
  const handleTestTool = async (toolName: string) => {
    setTestingTool(toolName);
    setTestResult(null);

    let sampleArgs: any = {};
    if (toolName === "search_jobs") sampleArgs = { query: "Senior Full Stack Engineer", location: "Remote" };
    else if (toolName === "search_web") sampleArgs = { query: "React 19 Server Components" };
    else if (toolName === "ask_career_coach") sampleArgs = { question: "What are the top 3 strengths I should emphasize in my next interview?" };
    else if (toolName === "draft_outreach_email") sampleArgs = { recipientName: "Jane Doe", company: "Anthropic", goal: "coffee_chat" };
    else if (toolName === "generate_interview_questions") sampleArgs = { roleTitle: "Staff Software Engineer" };
    else if (toolName === "translate_career_document") sampleArgs = { text: "Proven track record in high-scale systems.", targetLanguage: "German" };
    else if (toolName === "tailor_resume_for_job") sampleArgs = { jobTitle: "AI Platform Engineer", companyName: "TechCorp", jobDescription: "TypeScript, Python, and cloud infrastructure experience required." };
    else if (toolName === "analyze_resume_ats_match") sampleArgs = { jobDescription: "Senior Software Engineer with deep React, Node, and TypeScript experience." };

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authType === "bearer" && bearerToken) {
        headers["Authorization"] = `Bearer ${bearerToken}`;
      } else if (authType === "oauth" && oauthClientId && oauthClientSecret) {
        headers["Authorization"] = `Basic ${btoa(`${oauthClientId}:${oauthClientSecret}`)}`;
      } else if (authType === "custom_header" && customHeaderName && customHeaderValue) {
        headers[customHeaderName] = customHeaderValue;
      }

      const res = await fetch(restEndpointUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ tool: toolName, args: sampleArgs }),
      });

      const data = await res.json();
      if (res.ok) {
        setTestResult({ tool: toolName, result: data.result, quota: data.quota, status: "success" });
        if (data.quota) {
          setStats((prev) => ({
            ...prev,
            used: data.quota.used,
            remaining: data.quota.remaining,
            limit: data.quota.limit,
          }));
        }
        // Refresh logs
        fetchConfig();
      } else {
        setTestResult({ tool: toolName, result: data.error || data.message || "Failed to execute tool", quota: null, status: "error" });
      }
    } catch (e: any) {
      setTestResult({ tool: toolName, result: e.message || "Network error", quota: null, status: "error" });
    } finally {
      setTestingTool(null);
    }
  };

  // Filter tools
  const filteredTools = useMemo(() => {
    return ALL_MCP_TOOLS.filter((t) => {
      const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
      const matchesSearch = !toolSearch || t.name.toLowerCase().includes(toolSearch.toLowerCase()) || t.description.toLowerCase().includes(toolSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, toolSearch]);

  const usedPercentage = Math.min(100, Math.round((stats.used / (stats.limit || 100)) * 100));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ── CARD 1: DYNAMIC ENDPOINTS HEADER ────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#16161a] p-5 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Dynamic User MCP & REST Server</h2>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono">
                  Live in Firebase
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Your dedicated Model Context Protocol and REST endpoints. Shares your live Memory Vault, resumes, and career tools.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchConfig}
              disabled={loading}
              className="h-8 text-xs border-white/[0.08] bg-white/[0.03] text-neutral-300 hover:text-white"
            >
              <RefreshCw className={`h-3 w-3 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveConfig}
              disabled={saving}
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <CheckCircle2 className="h-3 w-3 mr-1.5" />}
              Save Settings
            </Button>
          </div>
        </div>

        {/* Endpoints Display & Slug Customization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* MCP Endpoint */}
          <div className="p-3 rounded-lg border border-white/[0.06] bg-[#111114]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Custom MCP Server (JSON-RPC 2.0)
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">Cursor / Claude / Windsurf</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0c0c0e] border border-white/[0.08] rounded-md px-2.5 py-1.5">
              <code className="text-xs text-primary font-mono truncate flex-1">{mcpEndpointUrl}</code>
              <button
                type="button"
                onClick={() => handleCopy(mcpEndpointUrl, "mcp-url")}
                className="p-1 hover:text-white text-neutral-400 rounded transition-colors"
                title="Copy MCP Endpoint"
              >
                {copiedKey === "mcp-url" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* REST Endpoint */}
          <div className="p-3 rounded-lg border border-white/[0.06] bg-[#111114]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-neutral-300 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-sky-400" />
                Custom REST Tool Endpoint
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">cURL / Fetch / HTTP</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#0c0c0e] border border-white/[0.08] rounded-md px-2.5 py-1.5">
              <code className="text-xs text-sky-400 font-mono truncate flex-1">{restEndpointUrl}</code>
              <button
                type="button"
                onClick={() => handleCopy(restEndpointUrl, "rest-url")}
                className="p-1 hover:text-white text-neutral-400 rounded transition-colors"
                title="Copy REST Endpoint"
              >
                {copiedKey === "rest-url" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Custom Slug Input */}
        <div className="mt-3 flex items-center gap-3 pt-3 border-t border-white/[0.06]">
          <Label className="text-xs text-neutral-400 shrink-0">Custom Endpoint Slug:</Label>
          <div className="flex items-center gap-2 max-w-sm flex-1">
            <span className="text-xs text-neutral-500 font-mono">/api/mcp/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"))}
              placeholder="your-custom-slug"
              className="h-7 text-xs bg-[#0c0c0e] border-white/[0.08] text-white font-mono"
            />
          </div>
          <span className="text-[11px] text-neutral-500 hidden sm:inline">Unique identifier for personal endpoints.</span>
        </div>
      </div>

      {/* ── CARD 2: DAILY QUOTA & TELEMETRY METER (100 REQUESTS/DAY) ──────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#16161a] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">Daily Admin Quota & Token Meter</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-400">
              <strong className="text-white font-mono">{stats.remaining}</strong> / {stats.limit} requests left today
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setLoadTokensOpen(true)}
              className="h-7 px-2.5 text-xs gap-1.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-primary/20 border border-amber-500/35 text-amber-200 hover:text-white hover:border-amber-500/50 rounded-lg shadow-sm"
            >
              <Coins className="size-3.5 text-amber-400" />
              <span>Load Tokens</span>
              <span className="text-[9px] font-mono uppercase bg-amber-500/25 text-amber-300 px-1 py-0.2 rounded font-bold">Coming Soon...</span>
            </Button>
            <Badge variant="outline" className="text-[10px] bg-white/5 text-neutral-300 font-mono">
              Resets 00:00 UTC
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#0c0c0e] rounded-full h-3 p-0.5 border border-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              usedPercentage > 90
                ? "bg-rose-500"
                : usedPercentage > 65
                ? "bg-amber-500"
                : "bg-gradient-to-r from-emerald-500 to-primary"
            }`}
            style={{ width: `${usedPercentage}%` }}
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/[0.06] text-center">
          <div className="p-2.5 rounded-lg bg-[#111114] border border-white/[0.04]">
            <div className="text-[10px] text-neutral-500 font-medium">Daily Allowance</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{stats.limit} req/day</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#111114] border border-white/[0.04]">
            <div className="text-[10px] text-neutral-500 font-medium">Used Today</div>
            <div className="text-base font-bold text-primary font-mono mt-0.5">{stats.used}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#111114] border border-white/[0.04]">
            <div className="text-[10px] text-neutral-500 font-medium">Tokens Processed</div>
            <div className="text-base font-bold text-neutral-200 font-mono mt-0.5">{stats.tokensUsed.toLocaleString()}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-[#111114] border border-white/[0.04]">
            <div className="text-[10px] text-neutral-500 font-medium">Firestore Persistence</div>
            <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center justify-center gap-1">
              <Database className="h-3 w-3" /> Synced
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD 3: CUSTOMIZABLE AUTHENTICATION SETTINGS ─────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#16161a] p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Endpoint Authorization Models
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Choose how clients authenticate against your personal endpoints. If you prefer open access with no auth token, you can set it to Public.
          </p>
        </div>

        {/* Auth Type Radio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Public / None */}
          <button
            type="button"
            onClick={() => setAuthType("none")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              authType === "none"
                ? "bg-emerald-500/10 border-emerald-500/40 text-white shadow-sm"
                : "bg-[#111114] border-white/[0.06] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                Public / None
              </span>
              {authType === "none" && <Badge className="bg-emerald-500 text-[10px] px-1.5 py-0 h-4">Active</Badge>}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              No auth headers or tokens required. Open to any local or remote tool.
            </p>
          </button>

          {/* Bearer Token */}
          <button
            type="button"
            onClick={() => setAuthType("bearer")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              authType === "bearer"
                ? "bg-primary/10 border-primary/40 text-white shadow-sm"
                : "bg-[#111114] border-white/[0.06] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                Bearer Token
              </span>
              {authType === "bearer" && <Badge className="bg-primary text-[10px] px-1.5 py-0 h-4">Active</Badge>}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Standard Bearer header or <code className="text-neutral-300">x-api-key</code> for secure client access.
            </p>
          </button>

          {/* OAuth Client */}
          <button
            type="button"
            onClick={() => setAuthType("oauth")}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              authType === "oauth"
                ? "bg-amber-500/10 border-amber-500/40 text-white shadow-sm"
                : "bg-[#111114] border-white/[0.06] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.02]"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                OAuth Client
              </span>
              {authType === "oauth" && <Badge className="bg-amber-500 text-[10px] px-1.5 py-0 h-4">Active</Badge>}
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Client ID & Secret via Basic Auth or <code className="text-neutral-300">x-client-id</code> headers.
            </p>
          </button>
        </div>

        {/* Credential Inputs based on Auth Type */}
        {authType === "bearer" && (
          <div className="p-3.5 rounded-xl bg-[#111114] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-neutral-300">Secret Bearer Token:</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateBearerToken}
                className="h-6 text-[11px] text-primary hover:text-primary/80 px-2"
              >
                Generate New Token
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type={showBearerToken ? "text" : "password"}
                value={bearerToken}
                onChange={(e) => setBearerToken(e.target.value)}
                placeholder="mcp_sec_..."
                className="h-8 text-xs bg-[#0c0c0e] border-white/[0.08] text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowBearerToken(!showBearerToken)}
                className="p-2 text-neutral-400 hover:text-white rounded border border-white/[0.08] bg-[#0c0c0e]"
                title={showBearerToken ? "Hide Token" : "Show Token"}
              >
                {showBearerToken ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(bearerToken, "bearer-token")}
                className="p-2 text-neutral-400 hover:text-white rounded border border-white/[0.08] bg-[#0c0c0e]"
                title="Copy Token"
              >
                {copiedKey === "bearer-token" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}

        {authType === "oauth" && (
          <div className="p-3.5 rounded-xl bg-[#111114] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-300">OAuth Client Credentials:</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateOAuthCredentials}
                className="h-6 text-[11px] text-amber-400 hover:text-amber-300 px-2"
              >
                Regenerate Credentials
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-neutral-400">Client ID</Label>
                <div className="flex items-center gap-1.5 mt-1">
                  <Input
                    value={oauthClientId}
                    onChange={(e) => setOauthClientId(e.target.value)}
                    className="h-8 text-xs bg-[#0c0c0e] border-white/[0.08] font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(oauthClientId, "client-id")}
                    className="p-2 text-neutral-400 hover:text-white rounded border border-white/[0.08] bg-[#0c0c0e]"
                  >
                    {copiedKey === "client-id" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-neutral-400">Client Secret</Label>
                <div className="flex items-center gap-1.5 mt-1">
                  <Input
                    type={showOAuthSecret ? "text" : "password"}
                    value={oauthClientSecret}
                    onChange={(e) => setOauthClientSecret(e.target.value)}
                    className="h-8 text-xs bg-[#0c0c0e] border-white/[0.08] font-mono text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOAuthSecret(!showOAuthSecret)}
                    className="p-2 text-neutral-400 hover:text-white rounded border border-white/[0.08] bg-[#0c0c0e]"
                  >
                    {showOAuthSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(oauthClientSecret, "client-secret")}
                    className="p-2 text-neutral-400 hover:text-white rounded border border-white/[0.08] bg-[#0c0c0e]"
                  >
                    {copiedKey === "client-secret" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {authType === "none" && (
          <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-neutral-300 flex items-start gap-2.5">
            <Unlock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-300">Open Access Enabled</p>
              <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                Your endpoint is public. Claude Desktop, Cursor, or your scripts can execute any tool without passing authorization headers or tokens.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD 4: ONE-CLICK CLIENT CONFIGURATIONS ──────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#16161a] p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-sky-400" />
            Client Setup Configurations
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Copy and paste into your editor or terminal to connect immediately.
          </p>
        </div>

        {/* Client Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#111114] rounded-lg border border-white/[0.06] overflow-x-auto no-scrollbar">
          {(["cursor", "claudeDesktop", "claudeCode", "windsurf", "curl", "node"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveClientTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                activeClientTab === tab ? "bg-[#242429] text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {tab === "cursor" && "Cursor"}
              {tab === "claudeDesktop" && "Claude Desktop"}
              {tab === "claudeCode" && "Claude Code"}
              {tab === "windsurf" && "Windsurf"}
              {tab === "curl" && "cURL (REST)"}
              {tab === "node" && "Node / Python"}
            </button>
          ))}
        </div>

        {/* Code Snippet Box */}
        <div className="relative rounded-lg border border-white/[0.08] bg-[#0c0c0e] p-3.5 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              let snippet = "";
              if (activeClientTab === "cursor") {
                snippet = JSON.stringify({ mcpServers: { [slug || "career-agent"]: { url: mcpEndpointUrl, headers: authType === "none" ? {} : { Authorization: `Bearer ${bearerToken}` } } } }, null, 2);
              } else if (activeClientTab === "claudeDesktop") {
                snippet = JSON.stringify({ mcpServers: { [slug || "career-agent"]: { command: "npx", args: authType === "none" ? ["-y", "mcp-remote", mcpEndpointUrl] : ["-y", "mcp-remote", mcpEndpointUrl, "--header", `Authorization: Bearer ${bearerToken}`] } } }, null, 2);
              } else if (activeClientTab === "claudeCode") {
                snippet = authType === "none" ? `claude mcp add ${slug || "career-agent"} ${mcpEndpointUrl}` : `claude mcp add ${slug || "career-agent"} ${mcpEndpointUrl} --header "Authorization: Bearer ${bearerToken}"`;
              } else if (activeClientTab === "windsurf") {
                snippet = JSON.stringify({ mcpServers: { [slug || "career-agent"]: { serverUrl: mcpEndpointUrl, headers: authType === "none" ? {} : { Authorization: `Bearer ${bearerToken}` } } } }, null, 2);
              } else if (activeClientTab === "curl") {
                snippet = `curl -X POST ${restEndpointUrl} \\\n  -H "Content-Type: application/json" \\\n  ${authType === "none" ? "" : `-H "Authorization: Bearer ${bearerToken}" \\\n  `}-d '{"tool": "get_memory_vault", "args": {}}'`;
              } else if (activeClientTab === "node") {
                snippet = `const res = await fetch("${restEndpointUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    ${authType === "none" ? "" : `"Authorization": "Bearer ${bearerToken}",`}\n  },\n  body: JSON.stringify({ tool: "get_memory_vault", args: {} }),\n});\nconst data = await res.json();\nconsole.log(data);`;
              }
              handleCopy(snippet, `snippet-${activeClientTab}`);
            }}
            className="absolute top-2.5 right-2.5 p-1.5 rounded bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Copy Config"
          >
            {copiedKey === `snippet-${activeClientTab}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>

          <pre className="overflow-x-auto text-neutral-300 pr-10">
            {activeClientTab === "cursor" && (
              `// Add to ~/.cursor/mcp.json:\n` +
              JSON.stringify(
                {
                  mcpServers: {
                    [slug || "career-agent"]: {
                      url: mcpEndpointUrl,
                      headers: authType === "none" ? {} : { Authorization: `Bearer ${bearerToken}` },
                    },
                  },
                },
                null,
                2
              )
            )}
            {activeClientTab === "claudeDesktop" && (
              `// Add to ~/Library/Application Support/Claude/claude_desktop_config.json:\n` +
              JSON.stringify(
                {
                  mcpServers: {
                    [slug || "career-agent"]: {
                      command: "npx",
                      args: authType === "none"
                        ? ["-y", "mcp-remote", mcpEndpointUrl]
                        : ["-y", "mcp-remote", mcpEndpointUrl, "--header", `Authorization: Bearer ${bearerToken}`],
                    },
                  },
                },
                null,
                2
              )
            )}
            {activeClientTab === "claudeCode" && (
              `# Run in terminal:\n` +
              (authType === "none"
                ? `claude mcp add ${slug || "career-agent"} ${mcpEndpointUrl}`
                : `claude mcp add ${slug || "career-agent"} ${mcpEndpointUrl} --header "Authorization: Bearer ${bearerToken}"`)
            )}
            {activeClientTab === "windsurf" && (
              `// Add to ~/.codeium/windsurf/mcp_config.json:\n` +
              JSON.stringify(
                {
                  mcpServers: {
                    [slug || "career-agent"]: {
                      serverUrl: mcpEndpointUrl,
                      headers: authType === "none" ? {} : { Authorization: `Bearer ${bearerToken}` },
                    },
                  },
                },
                null,
                2
              )
            )}
            {activeClientTab === "curl" && (
              `# Direct REST invocation:\n` +
              `curl -X POST ${restEndpointUrl} \\\n  -H "Content-Type: application/json" \\\n  ` +
              (authType === "none" ? "" : `-H "Authorization: Bearer ${bearerToken}" \\\n  `) +
              `-d '{"tool": "get_memory_vault", "args": {}}'`
            )}
            {activeClientTab === "node" && (
              `// Node.js or browser fetch:\n` +
              `const res = await fetch("${restEndpointUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    ` +
              (authType === "none" ? "" : `"Authorization": "Bearer ${bearerToken}",\n    `) +
              `},\n  body: JSON.stringify({ tool: "get_memory_vault", args: {} }),\n});\nconst data = await res.json();\nconsole.log(data);`
            )}
          </pre>
        </div>
      </div>

      {/* ── CARD 5: INTERACTIVE TOOLS CATALOG (38+ TOOLS) ───────────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#16161a] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              Available Tools ({ALL_MCP_TOOLS.length} Tools)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Click &quot;Run Test&quot; to execute live against your REST endpoint and verify your Memory Vault &amp; tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder="Search tools..."
              className="h-8 text-xs w-44 bg-[#111114] border-white/[0.08] text-white"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: "all", label: "All Tools" },
            { id: "vault", label: "Memory Vault" },
            { id: "resume", label: "Resumes" },
            { id: "coverletter", label: "Cover Letters" },
            { id: "jobs", label: "Jobs & Intel" },
            { id: "browser", label: "Browser Automation" },
            { id: "coaching", label: "Coaching & Outreach" },
            { id: "system", label: "Telemetry" },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-[#111114] text-neutral-400 hover:text-white border border-white/[0.04]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Live Test Result Callout if available */}
        {testResult && (
          <div className={`p-4 rounded-xl border text-xs ${
            testResult.status === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-neutral-200"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 font-semibold">
                {testResult.status === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
                <span>Live Execution: <code className="font-mono text-white">{testResult.tool}</code></span>
              </div>
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                Dismiss
              </button>
            </div>
            <pre className="p-2.5 rounded bg-[#0c0c0e] border border-white/[0.06] text-[11px] font-mono overflow-x-auto max-h-48 text-neutral-300">
              {JSON.stringify(testResult.result, null, 2)}
            </pre>
            {testResult.quota && (
              <div className="mt-2 text-[10px] text-neutral-400 flex items-center justify-between font-mono">
                <span>Quota used: {testResult.quota.used}/{testResult.quota.limit}</span>
                <span>Remaining today: {testResult.quota.remaining}</span>
              </div>
            )}
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto no-scrollbar pr-1">
          {filteredTools.map((tool) => (
            <div
              key={tool.name}
              className="p-3 rounded-lg border border-white/[0.06] bg-[#111114] hover:border-white/[0.12] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <code className="text-xs font-semibold text-primary font-mono">{tool.name}</code>
                  <Badge variant="outline" className="text-[9px] uppercase px-1.5 py-0 bg-white/5 text-neutral-400 border-white/[0.06]">
                    {tool.category}
                  </Badge>
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between">
                <span className="text-[10px] text-neutral-500 font-mono">
                  {Object.keys(tool.inputSchema.properties || {}).length} inputs
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTestTool(tool.name)}
                  disabled={testingTool === tool.name}
                  className="h-6 text-[11px] text-neutral-300 hover:text-white px-2 hover:bg-white/10"
                >
                  {testingTool === tool.name ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Play className="h-3 w-3 mr-1 text-emerald-400" />
                  )}
                  Run Test
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CARD 6: FIREBASE TOOL USAGE & AUDIT LOGS ─────────────────────────────────── */}
      <div className="rounded-xl border border-white/[0.08] bg-[#16161a] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              Firebase Execution Audit Trail
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live log of MCP and REST tool requests stored in your Firebase collection.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchConfig}
            className="h-7 text-xs text-neutral-400 hover:text-white"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Refresh Logs
          </Button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-500 bg-[#111114] rounded-lg border border-white/[0.04]">
            No recent tool executions logged today. Use the &quot;Run Test&quot; button above or connect your MCP client to start logging!
          </div>
        ) : (
          <div className="rounded-lg border border-white/[0.06] bg-[#111114] overflow-hidden">
            <div className="max-h-60 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0c0c0e] text-[10px] text-neutral-500 uppercase font-mono border-b border-white/[0.06]">
                  <tr>
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Tool</th>
                    <th className="py-2 px-3">Protocol</th>
                    <th className="py-2 px-3">Auth Used</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.02] text-neutral-300">
                      <td className="py-2 px-3 text-neutral-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-white font-semibold">{log.tool}</td>
                      <td className="py-2 px-3 uppercase text-[10px] text-neutral-400">{log.protocol}</td>
                      <td className="py-2 px-3 text-neutral-400">{log.authType}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${
                            log.status === "success"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : log.status === "rate_limited"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-neutral-400">{log.durationMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <LoadTokensDialog open={loadTokensOpen} onOpenChange={setLoadTokensOpen} />
    </div>
  );
}

