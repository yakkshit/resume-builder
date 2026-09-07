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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  ToggleLeft,
  ToggleRight,
  ChevronDown,
} from "lucide-react";
import {
  MCPServerConfig,
  MCPToolSchema,
  loadMCPServers,
  saveMCPServers,
  discoverMCPTools,
  isToolEnabled,
  toggleToolForServer,
  setAllToolsForServer,
} from "@/lib/mcp/mcp-manager";
import { toast } from "sonner";

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
  const [servers, setServers] = useState<MCPServerConfig[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [newServerName, setNewServerName] = useState("");
  const [newServerUrl, setNewServerUrl] = useState("");
  const [newServerKey, setNewServerKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toolSearch, setToolSearch] = useState("");
  const [expandedToolSchema, setExpandedToolSchema] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const s = loadMCPServers();
      setServers(s);
      if (s.length > 0 && !activeTab) {
        setActiveTab(s[0].id);
      }
    }
  }, [open]);

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

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim() || !newServerUrl.trim()) {
      toast.error("Please enter a name and server URL");
      return;
    }

    setIsTesting(true);
    const newServer: MCPServerConfig = {
      id: `custom-${Date.now()}`,
      name: newServerName.trim(),
      url: newServerUrl.trim(),
      type: "http",
      enabled: true,
      apiKey: newServerKey.trim() || undefined,
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
      toast.success(`Connected to ${newServer.name} (${tools.length} tools discovered)`);
    } catch (err: any) {
      newServer.status = "error";
      newServer.error = err.message;
      toast.error(`Connection failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeleteServer = (id: string) => {
    const updated = servers.filter((s) => s.id !== id);
    setServers(updated);
    saveMCPServers(updated);
    onServersUpdated?.(updated);
    if (activeTab === id && updated.length > 0) {
      setActiveTab(updated[0].id);
    }
    toast.success("Server removed");
  };

  const handleRefreshServer = async (server: MCPServerConfig) => {
    setIsTesting(true);
    try {
      const tools = await discoverMCPTools(server);
      const updated = servers.map((s) =>
        s.id === server.id ? { ...s, tools, status: "connected" as const, error: undefined } : s
      );
      setServers(updated);
      saveMCPServers(updated);
      onServersUpdated?.(updated);
      toast.success(`Refreshed ${server.name}: ${tools.length} tools available`);
    } catch (err: any) {
      const updated = servers.map((s) =>
        s.id === server.id ? { ...s, status: "error" as const, error: err.message } : s
      );
      setServers(updated);
      toast.error(`Failed to refresh tools: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const currentServer = servers.find((s) => s.id === activeTab) || servers[0];

  const filteredTools = useMemo(() => {
    if (!currentServer?.tools) return [];
    if (!toolSearch.trim()) return currentServer.tools;
    const q = toolSearch.toLowerCase();
    return currentServer.tools.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)
    );
  }, [currentServer, toolSearch]);

  const activeToolCount = useMemo(() => {
    if (!currentServer?.tools) return 0;
    return currentServer.tools.filter((t) => isToolEnabled(currentServer, t.name)).length;
  }, [currentServer]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden border-white/10 bg-neutral-950 text-neutral-100 sm:rounded-2xl">
        <DialogHeader className="p-5 border-b border-white/10 bg-neutral-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                <Plug className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-white">
                  Model Context Protocol (MCP) Servers & Tools
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Activate, customize, and configure individual tools for real-time AI chat execution
                </DialogDescription>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-8 gap-1.5 rounded-xl bg-indigo-500 text-xs font-semibold text-indigo-950 hover:bg-indigo-400"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Custom Server
            </Button>
          </div>
        </DialogHeader>

        {showAddForm && (
          <form onSubmit={handleAddServer} className="border-b border-white/10 bg-indigo-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-indigo-200">Connect New MCP Server</h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-muted-foreground hover:text-white"
              >
                Cancel
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <Label className="text-[11px] text-muted-foreground">Server Name</Label>
                <Input
                  value={newServerName}
                  onChange={(e) => setNewServerName(e.target.value)}
                  placeholder="e.g. GitHub MCP / Notion MCP"
                  className="mt-1 h-8 rounded-lg border-white/10 bg-black/40 text-xs"
                />
              </div>
              <div className="sm:col-span-5">
                <Label className="text-[11px] text-muted-foreground">Endpoint URL (HTTP/JSON-RPC)</Label>
                <Input
                  value={newServerUrl}
                  onChange={(e) => setNewServerUrl(e.target.value)}
                  placeholder="https://... or http://localhost:8080/mcp"
                  className="mt-1 h-8 rounded-lg border-white/10 bg-black/40 text-xs"
                />
              </div>
              <div className="sm:col-span-3">
                <Label className="text-[11px] text-muted-foreground">API Key / Token (optional)</Label>
                <Input
                  type="password"
                  value={newServerKey}
                  onChange={(e) => setNewServerKey(e.target.value)}
                  placeholder="Bearer token"
                  className="mt-1 h-8 rounded-lg border-white/10 bg-black/40 text-xs"
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

        <div className="grid flex-1 sm:grid-cols-12 overflow-hidden min-h-[420px]">
          {/* Server List Sidebar */}
          <div className="sm:col-span-4 border-r border-white/10 bg-black/20 p-3 space-y-1.5 overflow-y-auto">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Connected MCP Servers
            </div>
            {servers.map((server) => {
              const isSelected = server.id === currentServer?.id;
              const serverActiveCount = server.tools?.filter((t) => isToolEnabled(server, t.name)).length || 0;
              return (
                <div
                  key={server.id}
                  onClick={() => setActiveTab(server.id)}
                  className={`group flex items-center justify-between rounded-xl p-2.5 cursor-pointer transition-all border ${
                    isSelected
                      ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                      : "border-white/5 bg-white/[0.02] text-neutral-400 hover:border-white/10 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Server className={`h-4 w-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-neutral-500"}`} />
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate">{server.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {serverActiveCount}/{server.tools?.length || 0} tools active
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={server.enabled}
                      onCheckedChange={(checked) => handleToggleServer(server.id, checked)}
                      className="scale-75 data-[state=checked]:bg-indigo-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Server Details & Interactive Per-Tool Control */}
          <div className="sm:col-span-8 p-4 overflow-y-auto space-y-4">
            {currentServer ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      {currentServer.name}
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          currentServer.enabled
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-neutral-500/30 bg-neutral-500/10 text-neutral-400"
                        }`}
                      >
                        {currentServer.enabled ? `${activeToolCount} Tools Active` : "Server Disabled"}
                      </Badge>
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{currentServer.url}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isTesting}
                      onClick={() => handleRefreshServer(currentServer)}
                      className="h-7 border-white/10 bg-white/5 text-[11px] text-neutral-300 hover:bg-white/10"
                    >
                      <RefreshCw className={`mr-1.5 h-3 w-3 ${isTesting ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    {currentServer.type !== "builtin" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteServer(currentServer.id)}
                        className="h-7 text-[11px] text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tool Search & Bulk Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={toolSearch}
                      onChange={(e) => setToolSearch(e.target.value)}
                      placeholder="Search tools by name or description…"
                      className="h-7.5 pl-8 text-xs bg-black/40 border-white/10"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkToggleTools(currentServer.id, true)}
                      className="h-7 px-2 text-[11px] text-indigo-300 hover:bg-indigo-500/10"
                    >
                      Enable All
                    </Button>
                    <span className="text-muted-foreground text-xs">|</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleBulkToggleTools(currentServer.id, false)}
                      className="h-7 px-2 text-[11px] text-neutral-400 hover:bg-white/5"
                    >
                      Disable All
                    </Button>
                  </div>
                </div>

                {/* Interactive Tool Cards with Individual Toggle Switches */}
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider px-1">
                    Callable Tools for AI Chat ({filteredTools.length})
                  </div>
                  {filteredTools.map((tool) => {
                    const isEnabled = isToolEnabled(currentServer, tool.name);
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
                                <span className="font-mono text-xs font-semibold text-white">
                                  {tool.name}
                                </span>
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
                                  {isEnabled ? "Active in Chat" : "Disabled"}
                                </Badge>
                              </div>
                              <p className="text-xs text-neutral-400 leading-relaxed">
                                {tool.description || "No description provided."}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={(checked) => handleToggleTool(currentServer.id, tool.name, checked)}
                              className="data-[state=checked]:bg-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Schema Details toggle */}
                        {tool.inputSchema && (
                          <div className="mt-2 pt-2 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => setExpandedToolSchema(isExpanded ? null : tool.name)}
                              className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1 font-mono transition-colors"
                            >
                              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              {isExpanded ? "Hide input schema" : "View input schema"}
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
            ) : (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No MCP servers connected. Click "Add Custom Server" to connect.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
