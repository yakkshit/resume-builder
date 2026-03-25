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
          className="h-10 w-full rounded-lg border border-neutral-200 bg-white text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-transparent dark:text-white dark:hover:bg-neutral-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          New chat
        </Button>
      </div>

      {/* Chat History */}
      <ScrollArea className="flex-1 min-h-0 px-2 sm:px-3 [&>[data-radix-scroll-area-viewport]]:scroll-smooth">
        <div className="space-y-1 pb-4 pt-1">
          <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
            Your chats
          </p>
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
      <div className="space-y-3 border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-[#171717] sm:p-4">
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
        "fixed left-0 top-14 z-50 flex w-[min(100vw,280px)] flex-col border-r border-neutral-200 bg-[#f9f9f9] text-neutral-900 dark:border-neutral-800 dark:bg-[#171717] dark:text-neutral-100",
        "h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)]",
        className
      )}
    >
      {/* Header */}
      <div className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
            <MessageSquare className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold tracking-tight">Chats</h2>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Resume & career</p>
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
              "fixed top-[calc(3.5rem+0.5rem)] z-[60] hidden h-9 w-9 rounded-lg border border-neutral-200 bg-white text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 lg:flex dark:border-neutral-700 dark:bg-[#2f2f2f] dark:text-neutral-200 dark:hover:bg-neutral-800",
              isSidebarVisible ? "left-[calc(280px+10px)]" : "left-3"
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
              className="fixed left-3 top-[calc(3.5rem+0.5rem)] z-40 h-9 w-9 rounded-lg border-neutral-200 bg-white dark:border-neutral-700 dark:bg-[#2f2f2f] lg:hidden"
              aria-label="Open menu"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(100vw,300px)] max-w-[90vw] border-r border-neutral-800 bg-[#171717] p-0 sm:w-[min(100vw-2rem,300px)]"
          >
            <SheetHeader className="border-b border-neutral-800 px-4 py-4">
              <SheetTitle className="text-left text-base font-semibold text-white">Chats</SheetTitle>
              <p className="text-left text-xs text-neutral-500">History & settings</p>
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
        "group relative flex items-start gap-1.5 rounded-lg px-2 py-2 text-left transition-colors sm:gap-2 sm:px-2.5 sm:py-2",
        isActive
          ? "bg-neutral-200/90 dark:bg-neutral-800"
          : "hover:bg-neutral-200/70 dark:hover:bg-neutral-800/80"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className="min-h-[44px] flex-1 min-w-0 touch-manipulation text-left sm:min-h-0"
      >
        <span
          className={cn(
            "line-clamp-2 text-[13px] font-medium leading-snug sm:line-clamp-1 sm:truncate",
            isActive ? "text-neutral-900 dark:text-white" : "text-neutral-700 dark:text-neutral-200"
          )}
          title={title}
        >
          {title}
        </span>
        <span className="mt-0.5 block text-[10px] text-neutral-500 sm:text-[11px]">{timeLabel}</span>
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