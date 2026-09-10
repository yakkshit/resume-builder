"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Link,
  Code2,
  Plug,
  Search,
  FileText,
  Globe,
  Github,
  Linkedin,
  FileCode2,
  Copy,
  Check,
  Share2,
  Cpu,
  Bot,
  Sparkles,
  ChevronDown,
  Terminal,
  ExternalLink,
} from "lucide-react";
import {
  MCPServerConfig,
  MCPToolSchema,
  AgentHarnessConfig,
  loadMCPServers,
  saveMCPServers,
  loadAgentHarnesses,
  saveAgentHarnesses,
  deleteAgentHarnessLocal,
  discoverMCPTools,
  isToolEnabled,
  toggleToolForServer,
  setAllToolsForServer,
} from "@/lib/mcp/mcp-manager";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";

export interface MCPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onServersUpdated?: (servers: MCPServerConfig[]) => void;
}

function getToolCategory(name: string): { label: string; color: string; icon: React.ComponentType<{ className?: string }> } {
  switch (name) {
    case "generate_cover_letter_pdf":
      return { label: "Cover Letter PDF", color: "border-purple-500/30 bg-purple-500/10 text-purple-300", icon: FileText };
    case "generate_resume_pdf":
      return { label: "Resume PDF", color: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300", icon: FileText };
    case "prepare_job_application_package":
      return { label: "Application Package", color: "border-blue-500/30 bg-blue-500/10 text-blue-300", icon: FileText };
    case "search_jobs":
      return { label: "Job Search", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: Search };
    case "scrape_job_posting":
      return { label: "URL Scraper", color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300", icon: Globe };
    case "scrape_github_profile":
      return { label: "GitHub Grounding", color: "border-amber-500/30 bg-amber-500/10 text-amber-300", icon: Github };
    case "scrape_linkedin_profile":
      return { label: "LinkedIn Grounding", color: "border-sky-500/30 bg-sky-500/10 text-sky-300", icon: Linkedin };
    case "list_templates":
      return { label: "PDF Templates", color: "border-pink-500/30 bg-pink-500/10 text-pink-300", icon: FileCode2 };
    default:
      return { label: "Custom Tool", color: "border-neutral-500/30 bg-neutral-500/10 text-neutral-300", icon: Wrench };
  }
}

export function MCPDialog({ open, onOpenChange, onServersUpdated }: MCPDialogProps) {
  const [activeMainTab, setActiveMainTab] = useState<"career" | "harnesses" | "external">("career");
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [harnesses, setHarnesses] = useState<AgentHarnessConfig[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [toolSearch, setToolSearch] = useState("");
  const [expandedToolSchema, setExpandedToolSchema] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // External server form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerKey, setNewServerKey] = useState("");

  // Agent harness form state
  const [showHarnessForm, setShowHarnessForm] = useState(false);
  const [harnessName, setHarnessName] = useState("");
  const [harnessDescription, setHarnessDescription] = useState("");
  const [harnessPrompt, setHarnessPrompt] = useState("");
  const [harnessTools, setHarnessTools] = useState<string[]>(["search_jobs", "scrape_job_posting", "generate_resume_pdf"]);
  const [isSavingHarness, setIsSavingHarness] = useState(false);
  const [newServerHeaders, setNewServerHeaders] = useState("");

  // Live origin for sharing
  const [origin, setOrigin] = useState<string>("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const defaultAuthToken = "mcp-carrier-live-auth";

  useEffect(() => {
    if (open) {
      const s = loadMCPServers();
      setServers(s);
      const h = loadAgentHarnesses();
      setHarnesses(h);

      // Fetch harnesses from DB if available
      fetch("/api/mcp/harness")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data.harnesses) && data.harnesses.length > 0) {
            setHarnesses(data.harnesses);
            saveAgentHarnesses(data.harnesses);
          }
        })
        .catch(() => {});

      if (s.length > 0 && !activeTab) {
        setActiveTab(s[0].id);
      }
    }
  }, [open]);

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleToggleServer = (id: string, enabled: boolean) => {
    const updated = servers.map((s) => (s.id === id ? { ...s, enabled } : s));
    setServers(updated);
    saveMCPServers(updated);
    onServersUpdated?.(updated);
    toast.success(`${enabled ? "Enabled" : "Disabled"} server`);
  };

  const handleToggleTool = (serverId: string, toolName: string, enabled: boolean) => {
    const updated = toggleToolForServer(servers, serverId, toolName, enabled);
    setServers(updated);
    saveMCPServers(updated);
    onServersUpdated?.(updated);
    toast.success(`${enabled ? "Enabled" : "Disabled"} tool "${toolName}" for chat`);
  };

  const handleBulkToggleTools = (serverId: string, enableAll: boolean) => {
    const updated = setAllToolsForServer(servers, serverId, enableAll);
    setServers(updated);
    saveMCPServers(updated);
    onServersUpdated?.(updated);
    toast.success(enableAll ? "Enabled all tools" : "Disabled all tools");
  };

  const handleDeleteServer = (id: string) => {
    const updated = servers.filter((s) => s.id !== id);
    setServers(updated);
    saveMCPServers(updated);
    onServersUpdated?.(updated);
    toast.success("External server deleted");
  };

  const handleCreateHarness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!harnessName.trim()) {
      toast.error("Please enter a name for your agent harness");
      return;
    }

    setIsSavingHarness(true);
    try {
      const res = await fetch("/api/mcp/harness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: harnessName.trim(),
          description: harnessDescription.trim(),
          systemPrompt: harnessPrompt.trim(),
          selectedTools: harnessTools,
          isPublic: false,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create harness");

      const created: AgentHarnessConfig = {
        id: data.harness.id,
        name: data.harness.name,
        description: data.harness.description,
        slug: data.harness.slug,
        authToken: data.harness.authToken,
        systemPrompt: data.harness.systemPrompt,
        selectedTools: Array.isArray(data.harness.selectedTools) ? data.harness.selectedTools : harnessTools,
        shareableUrl: data.shareableUrl,
        createdAt: new Date().toISOString(),
      };

      const updated = [created, ...harnesses];
      setHarnesses(updated);
      saveAgentHarnesses(updated);
      setShowHarnessForm(false);
      setHarnessName("");
      setHarnessDescription("");
      setHarnessPrompt("");
      toast.success(`Agent Harness "${created.name}" created and synced to XataDB!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save agent harness");
    } finally {
      setIsSavingHarness(false);
    }
  };

  const handleDeleteHarness = async (id: string, slug: string) => {
    try {
      await fetch(`/api/mcp/harness?id=${id}`, { method: "DELETE" }).catch(() => {});
      const updated = deleteAgentHarnessLocal(id);
      setHarnesses(updated);
      toast.success("Agent harness deleted");
    } catch (err: any) {
      toast.error("Failed to delete harness");
    }
  };

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim() || !newServerUrl.trim()) {
      toast.error("Please enter a name and server URL");
      return;
    }

    let parsedHeaders = undefined;
    if (newServerHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(newServerHeaders.trim());
      } catch (e) {
        toast.error("Invalid JSON in headers");
        return;
      }
    }

    setIsTesting(true);
    const newServer: MCPServerConfig = {
      id: `custom-${Date.now()}`,
      name: newServerName.trim(),
      url: newServerUrl.trim(),
      type: "http",
      enabled: true,
      apiKey: newServerKey.trim() || undefined,
      headers: parsedHeaders,
      status: "connecting",
    };

    try {
      const tools = await discoverMCPTools(newServer);
      newServer.tools = tools;
      newServer.enabledTools = tools.map((t) => t.name);
      newServer.status = "connected";

      const updated = [...servers, newServer];
      setServers(updated);
      saveMCPServers(updated);
      onServersUpdated?.(updated);
      setActiveTab(newServer.id);
      setShowAddForm(false);
      setNewServerName("");
      setNewServerUrl("");
      setNewServerKey("");
      setNewServerHeaders("");
      toast.success(`Connected to ${newServer.name} (${tools.length} tools discovered)`);
    } catch (err: any) {
      newServer.status = "error";
      newServer.error = err.message;
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const careerServer = servers.find((s) => s.id === "builtin-career-agent" || s.id === "builtin-resume-coverletter") || servers[0];
  const careerShareUrl = `${origin}/api/mcp?token=${defaultAuthToken}`;

  const filteredTools = useMemo(() => {
    if (!careerServer?.tools) return [];
    if (!toolSearch.trim()) return careerServer.tools;
    const q = toolSearch.toLowerCase();
    return careerServer.tools.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)
    );
  }, [careerServer, toolSearch]);

  const cursorJsonConfig = JSON.stringify(
    {
      mcpServers: {
        "career-agent": {
          url: `${origin}/api/mcp`,
          headers: {
            Authorization: `Bearer ${defaultAuthToken}`,
          },
        },
      },
    },
    null,
    2
  );

  const claudeCodeCommand = `claude mcp add career-agent ${origin}/api/mcp --header "Authorization: Bearer ${defaultAuthToken}"`;

  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        "career-agent": {
          command: "npx",
          args: ["-y", "mcp-remote", `${origin}/api/mcp`, "--header", `Authorization: Bearer ${defaultAuthToken}`],
        },
      },
    },
    null,
    2
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col gap-0 p-0 overflow-hidden border-white/10 bg-neutral-950 text-neutral-100 sm:rounded-2xl">
        <DialogHeader className="p-5 border-b border-white/10 bg-neutral-900/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
                  Career Agent MCP & Multi-Agent Harness Platform
                  <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                    XataDB Synced
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Share MCP tools with Cursor, Claude Code, Windsurf, or build custom agent harnesses
                </DialogDescription>
              </div>
            </div>

            <Tabs value={activeMainTab} onValueChange={(v) => setActiveMainTab(v as any)} className="w-auto">
              <TabsList className="bg-black/50 border border-white/10 h-8 p-0.5 rounded-lg">
                <TabsTrigger value="career" className="text-xs px-3 h-7 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Career Agent MCP
                </TabsTrigger>
                <TabsTrigger value="harnesses" className="text-xs px-3 h-7 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  Agent Harnesses ({harnesses.length})
                </TabsTrigger>
                <TabsTrigger value="external" className="text-xs px-3 h-7 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">
                  External MCP
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Tab 1: Career Agent MCP (Share & Connect) */}
        {activeMainTab === "career" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Shareable Endpoint Card */}
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <h3 className="text-sm font-semibold text-white">Career Agent MCP Endpoint & Auth Token</h3>
                  </div>
                  <p className="text-xs text-indigo-200/80">
                    Use this standard Model Context Protocol (MCP) server in Cursor, Claude, or any external platform.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs">
                  Active & Ready
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-8 space-y-1">
                  <Label className="text-[11px] text-indigo-200">Shareable MCP Server URL</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={careerShareUrl}
                      className="h-8 font-mono text-xs bg-black/60 border-white/10 text-indigo-200 select-all"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleCopy(careerShareUrl, "shareUrl")}
                      className="h-8 shrink-0 bg-indigo-500 text-indigo-950 hover:bg-indigo-400 font-semibold text-xs"
                    >
                      {copiedKey === "shareUrl" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                      Copy URL
                    </Button>
                  </div>
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <Label className="text-[11px] text-indigo-200">Auth Token</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={defaultAuthToken}
                      className="h-8 font-mono text-xs bg-black/60 border-white/10 text-indigo-200 select-all"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(defaultAuthToken, "token")}
                      className="h-8 shrink-0 border-white/10 bg-white/5 text-xs text-neutral-300"
                    >
                      {copiedKey === "token" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Setup Guides for External Platforms */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                1-Click External Platform Configurations
              </h4>

              <div className="grid gap-3 sm:grid-cols-2">
                {/* Cursor */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <Code2 className="h-4 w-4 text-cyan-400" />
                      Cursor (~/.cursor/mcp.json)
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(cursorJsonConfig, "cursor")}
                      className="h-6 px-2 text-[10px] text-cyan-300 hover:bg-cyan-500/10"
                    >
                      {copiedKey === "cursor" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy Config
                    </Button>
                  </div>
                  <pre className="p-2 rounded-lg bg-black/70 border border-white/5 font-mono text-[10px] text-cyan-200 overflow-x-auto max-h-24">
                    {cursorJsonConfig}
                  </pre>
                </div>

                {/* Claude Code */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <Terminal className="h-4 w-4 text-amber-400" />
                      Claude Code CLI
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(claudeCodeCommand, "claudeCode")}
                      className="h-6 px-2 text-[10px] text-amber-300 hover:bg-amber-500/10"
                    >
                      {copiedKey === "claudeCode" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy Command
                    </Button>
                  </div>
                  <pre className="p-2 rounded-lg bg-black/70 border border-white/5 font-mono text-[10px] text-amber-200 overflow-x-auto max-h-24">
                    {claudeCodeCommand}
                  </pre>
                </div>

                {/* Claude Desktop */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <Bot className="h-4 w-4 text-purple-400" />
                      Claude Desktop (claude_desktop_config.json)
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(claudeDesktopConfig, "claudeDesktop")}
                      className="h-6 px-2 text-[10px] text-purple-300 hover:bg-purple-500/10"
                    >
                      {copiedKey === "claudeDesktop" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy Config
                    </Button>
                  </div>
                  <pre className="p-2 rounded-lg bg-black/70 border border-white/5 font-mono text-[10px] text-purple-200 overflow-x-auto max-h-24">
                    {claudeDesktopConfig}
                  </pre>
                </div>

                {/* Windsurf */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                      <Globe className="h-4 w-4 text-sky-400" />
                      Windsurf (~/.codeium/windsurf/mcp_config.json)
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(cursorJsonConfig, "windsurf")}
                      className="h-6 px-2 text-[10px] text-sky-300 hover:bg-sky-500/10"
                    >
                      {copiedKey === "windsurf" ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                      Copy Config
                    </Button>
                  </div>
                  <pre className="p-2 rounded-lg bg-black/70 border border-white/5 font-mono text-[10px] text-sky-200 overflow-x-auto max-h-24">
                    {cursorJsonConfig}
                  </pre>
                </div>
              </div>
            </div>

            {/* Callable Tools Management */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Career Agent Tools ({careerServer?.tools?.length || 0})
                </div>
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={toolSearch}
                    onChange={(e) => setToolSearch(e.target.value)}
                    placeholder="Filter tools…"
                    className="h-7.5 pl-8 text-xs bg-black/40 border-white/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredTools.map((tool) => {
                  const isEnabled = careerServer ? isToolEnabled(careerServer, tool.name) : true;
                  const category = getToolCategory(tool.name);
                  const CategoryIcon = category.icon;
                  const isExpanded = expandedToolSchema === tool.name;

                  return (
                    <div
                      key={tool.name}
                      className={`rounded-xl border p-3 transition-all ${
                        isEnabled
                          ? "border-white/10 bg-white/[0.03] hover:border-white/20"
                          : "border-white/5 bg-white/[0.01] opacity-60 hover:opacity-80"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="mt-0.5 rounded-lg border border-white/10 bg-black/40 p-1.5 text-indigo-400">
                            <CategoryIcon className="h-4 w-4" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-semibold text-white">{tool.name}</span>
                              <Badge variant="outline" className={`text-[10px] h-4.5 px-1.5 font-normal ${category.color}`}>
                                {category.label}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={`text-[9px] h-4 px-1.5 font-semibold ${
                                  isEnabled
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                    : "bg-neutral-800 text-neutral-400"
                                }`}
                              >
                                {isEnabled ? "Active" : "Disabled"}
                              </Badge>
                            </div>
                            <p className="text-xs text-neutral-400 leading-relaxed">
                              {tool.description || "No description provided."}
                            </p>
                          </div>
                        </div>

                        {careerServer && (
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleToggleTool(careerServer.id, tool.name, checked)}
                            className="data-[state=checked]:bg-indigo-500"
                          />
                        )}
                      </div>

                      {tool.inputSchema && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setExpandedToolSchema(isExpanded ? null : tool.name)}
                            className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1 font-mono transition-colors"
                          >
                            <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            {isExpanded ? "Hide schema" : "View JSON schema"}
                          </button>
                          {isExpanded && (
                            <pre className="mt-2 p-2 rounded-lg bg-black/60 border border-white/10 text-[10px] text-indigo-200 font-mono overflow-x-auto max-h-40">
                              {JSON.stringify(tool.inputSchema, null, 2)}
                            </pre>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Custom Agent Harnesses (Multi-Agent Builder) */}
        {activeMainTab === "harnesses" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Bot className="h-4 w-4 text-indigo-400" />
                  Your Custom Agentic Harnesses
                </h3>
                <p className="text-xs text-muted-foreground">
                  Build custom servers with customized tool subsets and individual shareable URLs.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowHarnessForm(!showHarnessForm)}
                className="h-8 gap-1.5 bg-indigo-500 text-indigo-950 font-semibold hover:bg-indigo-400 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Build Agent Harness
              </Button>
            </div>

            {showHarnessForm && (
              <form onSubmit={handleCreateHarness} className="rounded-2xl border border-indigo-500/30 bg-indigo-950/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-indigo-200">Configure New Agent Harness</h4>
                  <button type="button" onClick={() => setShowHarnessForm(false)} className="text-xs text-muted-foreground hover:text-white">
                    Cancel
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-indigo-200">Agent Name</Label>
                    <Input
                      value={harnessName}
                      onChange={(e) => setHarnessName(e.target.value)}
                      placeholder="e.g. Job Search & Application Agent"
                      className="h-8 bg-black/40 border-white/10 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-indigo-200">Description</Label>
                    <Input
                      value={harnessDescription}
                      onChange={(e) => setHarnessDescription(e.target.value)}
                      placeholder="e.g. Specialized in job scraping and ATS tailoring"
                      className="h-8 bg-black/40 border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-indigo-200">Custom System Persona / Instructions</Label>
                  <Textarea
                    value={harnessPrompt}
                    onChange={(e) => setHarnessPrompt(e.target.value)}
                    placeholder="e.g. You are a dedicated job search agent. Focus on extracting exact ATS keywords..."
                    className="min-h-[70px] bg-black/40 border-white/10 text-xs resize-none"
                  />
                </div>

                {/* Tool Selector */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-indigo-200">Enabled Tools for this Harness</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(careerServer?.tools || []).map((t) => {
                      const isSelected = harnessTools.includes(t.name);
                      return (
                        <div
                          key={t.name}
                          onClick={() => {
                            setHarnessTools((prev) =>
                              isSelected ? prev.filter((name) => name !== t.name) : [...prev, t.name]
                            );
                          }}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isSelected
                              ? "border-indigo-500/40 bg-indigo-500/20 text-white"
                              : "border-white/5 bg-white/[0.02] text-neutral-400 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "border-indigo-400 bg-indigo-500 text-black" : "border-white/20"}`}>
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                          <span className="font-mono truncate">{t.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSavingHarness}
                    className="h-8 bg-indigo-500 text-indigo-950 font-semibold hover:bg-indigo-400 text-xs"
                  >
                    {isSavingHarness ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Plus className="h-3.5 w-3.5 mr-1.5" />}
                    Save Harness to XataDB
                  </Button>
                </div>
              </form>
            )}

            {/* Harnesses List */}
            <div className="space-y-3">
              {harnesses.length === 0 ? (
                <div className="rounded-xl border border-white/5 p-8 text-center text-xs text-muted-foreground">
                  No custom agent harnesses yet. Click "Build Agent Harness" to create your first specialized agent server.
                </div>
              ) : (
                harnesses.map((h) => {
                  const shareUrl = `${origin}/api/mcp?harness=${encodeURIComponent(h.slug)}&token=${h.authToken}`;
                  const cursorHarnessConfig = JSON.stringify(
                    {
                      mcpServers: {
                        [h.slug]: {
                          url: `${origin}/api/mcp?harness=${h.slug}`,
                          headers: { Authorization: `Bearer ${h.authToken}` },
                        },
                      },
                    },
                    null,
                    2
                  );

                  return (
                    <div key={h.id || h.slug} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-indigo-400" />
                            <h4 className="text-sm font-semibold text-white">{h.name}</h4>
                            <Badge variant="outline" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300 font-mono text-[10px]">
                              {h.slug}
                            </Badge>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px]">
                              {h.selectedTools?.length || 0} Tools
                            </Badge>
                          </div>
                          {h.description && <p className="text-xs text-neutral-400">{h.description}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHarness(h.id, h.slug)}
                            className="h-7 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Tool Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(h.selectedTools || []).map((tool) => (
                          <Badge key={tool} variant="outline" className="border-white/10 bg-black/40 text-neutral-300 font-mono text-[10px]">
                            {tool}
                          </Badge>
                        ))}
                      </div>

                      {/* Shareable Link */}
                      <div className="space-y-1 pt-1">
                        <Label className="text-[10px] text-muted-foreground">Shareable Harness URL</Label>
                        <div className="flex items-center gap-2">
                          <Input readOnly value={shareUrl} className="h-7 font-mono text-[11px] bg-black/60 border-white/10 select-all" />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(shareUrl, `harness-url-${h.slug}`)}
                            className="h-7 shrink-0 text-xs border-white/10"
                          >
                            {copiedKey === `harness-url-${h.slug}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3 mr-1" />}
                            Copy URL
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(cursorHarnessConfig, `harness-config-${h.slug}`)}
                            className="h-7 shrink-0 text-xs border-white/10 text-cyan-300"
                          >
                            {copiedKey === `harness-config-${h.slug}` ? <Check className="h-3 w-3" /> : <Code2 className="h-3 w-3 mr-1" />}
                            Cursor Config
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: External MCP Servers */}
        {activeMainTab === "external" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Third-Party External MCP Servers</h3>
                <p className="text-xs text-muted-foreground">Connect remote MCP tools (e.g. GitHub, Notion, PostgreSQL).</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-8 gap-1.5 bg-indigo-500 text-indigo-950 font-semibold hover:bg-indigo-400 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Add External Server
              </Button>
            </div>

            {showAddForm && (
              <form onSubmit={handleAddServer} className="border border-white/10 bg-indigo-950/20 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-indigo-200">Connect New Remote MCP Server</h4>
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-4">
                    <Label className="text-[11px] text-muted-foreground">Server Name</Label>
                    <Input
                      value={newServerName}
                      onChange={(e) => setNewServerName(e.target.value)}
                      placeholder="e.g. GitHub MCP / Brave Search"
                      className="mt-1 h-8 rounded-lg border-white/10 bg-black/40 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <Label className="text-[11px] text-muted-foreground">Endpoint URL</Label>
                    <Input
                      value={newServerUrl}
                      onChange={(e) => setNewServerUrl(e.target.value)}
                      placeholder="https://... or http://localhost:8080/mcp"
                      className="mt-1 h-8 rounded-lg border-white/10 bg-black/40 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Label className="text-[11px] text-muted-foreground">API Key (optional)</Label>
                    <Input
                      type="password"
                      value={newServerKey}
                      onChange={(e) => setNewServerKey(e.target.value)}
                      placeholder="Bearer token"
                      className="mt-1 h-8 rounded-lg border-white/10 bg-black/40 text-xs"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-12">
                    <Label className="text-[11px] text-muted-foreground">Custom Headers (JSON, optional)</Label>
                    <Input
                      value={newServerHeaders}
                      onChange={(e) => setNewServerHeaders(e.target.value)}
                      placeholder='e.g. {"X-API-Key": "your-key"}'
                      className="mt-1 h-8 rounded-lg border-white/10 bg-black/40 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isTesting}
                    className="h-8 rounded-lg bg-indigo-500 text-xs font-semibold text-indigo-950 hover:bg-indigo-400"
                  >
                    {isTesting ? <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
                    Connect & Discover Tools
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {servers.filter((s) => s.type !== "builtin").length === 0 ? (
                <div className="rounded-xl border border-white/5 p-8 text-center text-xs text-muted-foreground">
                  No external MCP servers connected. Click "Add External Server" to connect third-party MCP endpoints.
                </div>
              ) : (
                servers
                  .filter((s) => s.type !== "builtin")
                  .map((s) => (
                    <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{s.name}</h4>
                          <p className="text-xs text-muted-foreground font-mono">{s.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={s.enabled}
                            onCheckedChange={(checked) => handleToggleServer(s.id, checked)}
                            className="data-[state=checked]:bg-indigo-500"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteServer(s.id)}
                            className="h-7 w-7 p-0 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(s.tools || []).map((t) => (
                          <Badge key={t.name} variant="outline" className="text-[10px] border-white/10 bg-black/40 text-neutral-300 font-mono">
                            {t.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
