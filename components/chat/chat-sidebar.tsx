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
  Sparkles,
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
      {/* New Chat Button */}
      <div className="p-3 sm:p-4">
        <Button
          onClick={handleNewSession}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:scale-[1.01] hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:shadow-blue-500/30 sm:h-12 sm:rounded-2xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          New chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 min-h-0 px-2 sm:px-3 [&>[data-radix-scroll-area-viewport]]:scroll-smooth">
        <div className="space-y-1 pb-4 pt-1">
          <div className="sticky top-0 z-[1] -mx-1 mb-2 flex items-center gap-2 rounded-xl border border-border/60 bg-background/95 px-3 py-2.5 shadow-sm backdrop-blur-md sm:py-2 dark:border-white/5 dark:bg-gradient-to-b dark:from-neutral-900/95 dark:to-neutral-900/80 dark:shadow-none">
            <MessageSquare className="h-4 w-4 shrink-0 text-primary dark:text-[#4da5fc]/80" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs dark:text-white/55">
              Recent Chats
            </p>
          </div>
          {!mounted ? (
            <div className="px-3 py-8 text-center">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/25 border-t-primary dark:border-white/20 dark:border-t-white/60" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40 dark:text-white/20" />
              <p className="text-sm text-muted-foreground dark:text-white/40">No chats yet</p>
              <p className="mt-1 text-xs text-muted-foreground/80 dark:text-white/30">Start a conversation above</p>
            </div>
          ) : (
            <div className="space-y-1">
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
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Section - Context & Settings */}
      <div className="space-y-3 border-t border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm sm:p-4">
        <ContextWindow
          value={context}
          onChange={handleContextChange}
        />
        
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="w-full justify-between h-11 px-4 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <span className="flex items-center gap-2.5 font-medium">
                <Settings className="h-4 w-4" />
                Settings
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", settingsOpen && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 pt-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-white/60 uppercase tracking-wide">Model</Label>
                <Select value={selectedModel} onValueChange={(v) => onModelChange(v as AIModel)}>
                  <SelectTrigger className="mt-1.5 h-11 bg-white/5 border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900/95 backdrop-blur-xl border-white/10">
                    {Object.entries(CHAT_MODELS_BY_PROVIDER).map(([provider, ids]) => (
                      <div key={provider}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-white/40 uppercase tracking-wide">{provider}</div>
                        {(ids as readonly string[]).map((id) => (
                          <SelectItem key={id} value={id} className="text-white/90 focus:bg-white/10">
                            {id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold text-white/60 uppercase tracking-wide">API Key</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-xs text-white/50 hover:text-white/90 hover:bg-white/10 rounded-lg" 
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? "Hide" : "Show"}
                  </Button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    className="h-11 pl-10 bg-white/5 border-white/10 text-white font-mono text-sm placeholder:text-white/30 rounded-xl hover:bg-white/10 focus:bg-white/10 transition-colors backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Export/Import */}
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-10 bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:text-white rounded-xl transition-all backdrop-blur-sm" 
                  onClick={handleDownloadJson}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleUploadJson} />
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-10 bg-white/5 border-white/10 text-white/90 hover:bg-white/10 hover:text-white rounded-xl transition-all backdrop-blur-sm" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
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
        "fixed left-3 top-[4.5rem] z-50 flex w-[min(calc(100vw-1.5rem),18rem)] flex-col sm:left-4 sm:top-20 sm:w-80",
        "h-[calc(100dvh-5.5rem)] max-h-[calc(100dvh-5.5rem)] rounded-2xl sm:h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-6rem)] sm:rounded-3xl",
        "overflow-hidden border border-border bg-card/95 text-card-foreground shadow-xl backdrop-blur-2xl",
        "dark:border-white/10 dark:bg-gradient-to-br dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-neutral-950/95 dark:text-white",
        "dark:shadow-2xl dark:shadow-black/50",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-primary/5 before:to-transparent sm:before:rounded-3xl",
        "dark:before:from-white/5",
        className
      )}
    >
      {/* Header */}
      <div className="relative border-b border-border bg-muted/40 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-white/[0.07] sm:px-5 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 sm:h-11 sm:w-11 sm:rounded-2xl">
            <MessageSquare className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-foreground sm:text-lg dark:text-white">Career Chat</h2>
            <p className="text-[11px] font-medium text-muted-foreground sm:text-xs dark:text-white/50">Resumes & jobs</p>
          </div>
        </div>
      </div>
      
      {/* Content */}
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
              "fixed top-20 z-[60] hidden h-10 w-10 rounded-2xl lg:flex",
              "border border-border bg-card text-foreground shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105",
              "dark:border-white/10 dark:bg-neutral-900/90 dark:text-white dark:shadow-xl dark:shadow-black/20",
              "hover:bg-muted dark:hover:bg-neutral-900",
              isSidebarVisible ? "left-[calc(1rem+20rem+0.35rem)]" : "left-4"
            )}
            aria-label={isSidebarVisible ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarVisible ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </Button>
        )}
        {isSidebarVisible && <div className="hidden lg:block">{sidebarPanel}</div>}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="fixed left-4 top-24 z-40 lg:hidden rounded-2xl border-white/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl shadow-xl"
              aria-label="Open menu"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(100vw-1rem,22rem)] max-w-[90vw] border-0 bg-gradient-to-br from-neutral-950/98 via-neutral-900/95 to-neutral-950/98 p-0 backdrop-blur-2xl sm:w-[min(100vw-2rem,24rem)]"
          >
            <SheetHeader className="border-b border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent px-4 py-4 sm:px-5 sm:py-5">
              <SheetTitle className="text-left text-lg font-bold text-white">Career Chat</SheetTitle>
              <p className="text-left text-xs font-medium text-white/45">History & settings</p>
            </SheetHeader>
            <div className="h-[calc(100dvh-5rem)] min-h-0 overflow-hidden sm:h-[calc(100vh-5.5rem)]">
              {sidebarContent}
            </div>
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
      className={cn(
        "group relative flex items-start gap-1.5 rounded-xl px-2 py-2 text-left transition-all duration-200 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2.5",
        isActive
          ? "bg-primary/12 shadow-md ring-1 ring-primary/25 dark:bg-gradient-to-r dark:from-blue-500/25 dark:to-blue-600/10 dark:shadow-blue-500/15 dark:ring-blue-400/20"
          : "hover:bg-muted/80 hover:shadow-sm dark:hover:bg-white/[0.08] dark:hover:shadow-md dark:hover:shadow-black/10"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-h-[44px] flex-1 min-w-0 touch-manipulation text-left sm:min-h-0"
      >
        <span
          className={cn(
            "line-clamp-2 text-sm font-medium leading-snug transition-colors sm:line-clamp-1 sm:truncate",
            isActive ? "text-blue-200" : "text-white/90"
          )}
          title={title}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-[10px] font-medium text-white/40 sm:text-[11px]">{timeLabel}</span>
      </button>
      {onDelete && (hover || isActive) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-xl opacity-70 hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete session"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}