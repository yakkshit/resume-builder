"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Download,
  Upload,
  Key,
  PanelLeft,
  MessageSquare,
  Trash2,
  Settings,
  ChevronDown,
  PanelLeftClose,
} from "lucide-react";
import { CHAT_MODELS_BY_PROVIDER } from "@/lib/chat-models";
import type { AIModel } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  getChatSessions,
  saveChatSession,
  exportChatHistoryAsJson,
  importChatHistoryFromJson,
  generateSessionId,
  getSessionTitle,
  type ChatSession,
} from "@/lib/chat-history";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ContextWindow, getStoredContext, setStoredContext } from "./context-window";

interface ChatSidebarProps {
  selectedModel: AIModel;
  onModelChange: (model: AIModel) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onImportHistory: (json: string) => void;
  contextValue?: string;
  onContextChange?: (value: string) => void;
  currentMessages?: Array<{
    id: string;
    role: string;
    content?: string;
    parts?: Array<{ type: string; text?: string }>;
    createdAt?: number;
  }>;
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession?: (sessionId: string) => void;
  className?: string;
  collapsible?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatSidebar({
  selectedModel,
  onModelChange,
  apiKey,
  onApiKeyChange,
  onImportHistory,
  contextValue,
  onContextChange,
  currentMessages = [],
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  className,
  collapsible = true,
  open: sidebarOpen,
  onOpenChange: onSidebarOpenChange,
}: ChatSidebarProps) {
  const { toast } = useToast();
  const [showApiKey, setShowApiKey] = useState(false);
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [context, setContext] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mounted) setContext(contextValue ?? getStoredContext());
  }, [mounted, contextValue]);

  const handleContextChange = (v: string) => {
    setContext(v);
    setStoredContext(v);
    onContextChange?.(v);
  };

  useEffect(() => setMounted(true), []);

  const savedSessions = mounted ? getChatSessions() : [];
  const sessions =
    mounted &&
    currentSessionId &&
    currentMessages.length > 0 &&
    !savedSessions.some((s) => s.id === currentSessionId)
      ? [
          {
            id: currentSessionId,
            title: getSessionTitle(currentMessages, "New chat"),
            messages: currentMessages.map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant" | "system",
              content: m.content ?? "",
              parts: m.parts,
              createdAt: m.createdAt ?? 0,
            })),
            createdAt: 0,
            updatedAt: 0,
          } as ChatSession,
          ...savedSessions,
        ]
      : savedSessions;

  const handleDownloadJson = () => {
    try {
      const json = exportChatHistoryAsJson(currentMessages);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: "Chat history exported." });
    } catch {
      toast({ title: "Error", description: "Export failed.", variant: "destructive" });
    }
  };

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = String(reader.result);
        importChatHistoryFromJson(json);
        onImportHistory(json);
        toast({ title: "Imported", description: "History loaded." });
        setOpen(false);
      } catch {
        toast({ title: "Invalid file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleNewSession = () => {
    onNewSession();
    setOpen(false);
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          onClick={handleNewSession}
          className="w-full rounded-xl bg-[#1172e2] hover:bg-[#1a94ff] text-white shadow-lg shadow-[#1172e2]/30 h-11 font-medium"
        >
          <Plus className="h-4 w-4 mr-2" />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 min-h-0">
        <div className="space-y-1 pb-4">
          <p className="px-2 py-2 text-xs font-medium text-[#5a5a5f] uppercase tracking-wider">
            History
          </p>
          {!mounted ? (
            <p className="px-2 py-4 text-sm text-[#8a8a8f]">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="px-2 py-4 text-sm text-[#8a8a8f]">No sessions yet</p>
          ) : (
            <>
              {sessions.map((s) => (
                <SessionItem
                  key={s.id}
                  session={s}
                  isActive={s.id === currentSessionId}
                  onSelect={() => {
                    onSessionSelect(s.id);
                    setOpen(false);
                  }}
                  onDelete={
                    onDeleteSession
                      ? () => {
                          onDeleteSession(s.id);
                          toast({ title: "Deleted", description: "Session removed." });
                        }
                      : undefined
                  }
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-white/10 dark:border-neutral-700/50 p-3 space-y-2">
        <ContextWindow
          value={context}
          onChange={handleContextChange}
        />
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-10 px-3 text-white hover:bg-white/10">
              <span className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", settingsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 pt-3">
              <div>
                <Label className="text-xs text-[#8a8a8f]">Model</Label>
                <Select value={selectedModel} onValueChange={(v) => onModelChange(v as AIModel)}>
                  <SelectTrigger className="mt-1.5 h-9 bg-[#0f0f0f] border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHAT_MODELS_BY_PROVIDER).map(([provider, ids]) => (
                      <div key={provider}>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{provider}</div>
                        {(ids as readonly string[]).map((id) => (
                          <SelectItem key={id} value={id}>
                            {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Label className="text-xs text-[#8a8a8f]">API Key</Label>
                  <Button variant="ghost" size="sm" className="h-6 px-1 text-xs text-[#8a8a8f] hover:text-white" onClick={() => setShowApiKey(!showApiKey)}>
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
                <Input
                  type={showApiKey ? "text" : "password"}
                  placeholder="API key"
                  value={apiKey}
                  onChange={(e) => onApiKeyChange(e.target.value)}
                  className="h-9 bg-[#0f0f0f] border-white/10 text-white font-mono text-sm placeholder:text-[#5a5a5f]"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 h-9" onClick={handleDownloadJson}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleUploadJson} />
                <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Import
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );

  const sidebarPanel = (
    <aside
      className={cn(
        "fixed left-4 top-20 z-50 flex h-[calc(100vh-6rem)] max-h-[calc(100vh-6rem)] flex-col w-64 sm:w-72 rounded-2xl border border-white/10",
        "bg-[#1a1a1e]/95 backdrop-blur-xl shadow-2xl shadow-black/40",
        "text-white",
        className
      )}
    >
      <div className="p-4 border-b border-white/20 dark:border-neutral-700/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1172e2] text-white">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-white truncate">Career Chat</h2>
            <p className="text-xs text-[#8a8a8f]">Resumes & jobs</p>
          </div>
        </div>
        {onSidebarOpenChange && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSidebarOpenChange(false)}
            className="shrink-0 h-8 w-8 rounded-lg lg:flex hidden"
            aria-label="Close sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{sidebarContent}</div>
    </aside>
  );

  if (collapsible) {
    const isSidebarVisible = sidebarOpen !== false;
    return (
      <>
        {onSidebarOpenChange && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSidebarOpenChange(!isSidebarVisible)}
            className={cn(
              "fixed top-20 z-[60] hidden lg:flex h-9 w-9 rounded-xl border border-white/10 bg-[#1a1a1e]/95 hover:bg-[#1a1a1e] text-white shadow-lg transition-all",
              isSidebarVisible ? "left-[296px]" : "left-4"
            )}
            aria-label={isSidebarVisible ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarVisible ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
        )}
        {isSidebarVisible && <div className="hidden lg:block">{sidebarPanel}</div>}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed left-4 top-24 z-40 lg:hidden rounded-xl border-white/20 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-lg"
              aria-label="Open menu"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[300px] p-0 border-0 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl"
          >
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Career Chat</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-5rem)] overflow-hidden">{sidebarContent}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return sidebarPanel;
}

function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  const title = getSessionTitle(session.messages, "New chat");
  const [hover, setHover] = useState(false);
  const timeLabel = new Date(session.updatedAt || session.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
              className="group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/10 text-[#e0e0e5]"
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex-1 min-w-0 text-sm truncate text-left rounded-lg py-1.5 px-2 -mx-2 -my-1.5 transition-colors",
            isActive && "bg-[#1172e2]/20 text-[#6eb3f7] font-medium"
        )}
      >
        <span className="block truncate">{title}</span>
        <span className="block text-[10px] text-[#8a8a8f] mt-0.5">{timeLabel}</span>
      </button>
      {onDelete && (hover || isActive) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-lg opacity-70 hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-600"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete session"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
