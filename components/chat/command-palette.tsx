"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";
import {
  MessageSquare,
  PlusCircle,
  FileText,
  Layers,
  Globe,
  Plug,
  Sparkles,
  Settings,
  SunMoon,
  Clock,
  ArrowRight,
  ExternalLink,
  UserRound,
} from "lucide-react";
import type { ChatSession } from "./chat-store";
import { useTheme } from "next-themes";

interface ChatCommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: ChatSession[];
  currentId?: string | null;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  onOpenWebview?: () => void;
  onOpenMcp?: () => void;
  onOpenGuide?: () => void;
  onOpenSettings?: () => void;
  onToggleSplitPanel?: () => void;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return "";
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ChatCommandPalette({
  open,
  onOpenChange,
  sessions,
  currentId,
  onSessionSelect,
  onNewSession,
  onOpenWebview,
  onOpenMcp,
  onOpenGuide,
  onOpenSettings,
}: ChatCommandPaletteProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [sessions]);

  const handleSelectSession = (id: string) => {
    onSessionSelect(id);
    onOpenChange(false);
  };

  const handleNewChat = () => {
    onNewSession();
    onOpenChange(false);
  };

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    router.push(path);
  };

  const handleAction = (fn?: () => void) => {
    if (fn) {
      fn();
      onOpenChange(false);
    }
  };

  const handleToggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      contentClassName="bg-[#18181c]/95 border-white/10 text-neutral-100 shadow-2xl backdrop-blur-2xl sm:max-w-2xl rounded-2xl"
    >
      <CommandInput
        placeholder="Type a command or search chat history..."
        className="text-neutral-100 placeholder:text-neutral-500"
      />
      <CommandList className="max-h-[360px] sm:max-h-[420px] overflow-y-auto no-scrollbar py-2 px-1">
        <CommandEmpty className="py-6 text-center text-xs text-neutral-400">
          No matching chats or actions found.
        </CommandEmpty>

        {/* Primary Action */}
        <CommandGroup heading="Quick Actions" className="text-neutral-400">
          <CommandItem
            onSelect={handleNewChat}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
          >
            <div className="size-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <PlusCircle className="size-3.5" />
            </div>
            <span className="font-medium">New Chat Session</span>
            <CommandShortcut className="text-[10px] text-neutral-500 font-mono">⌘N</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator className="my-1.5 bg-white/5" />

        {/* Chat History Search */}
        {sortedSessions.length > 0 && (
          <CommandGroup heading="Chat History" className="text-neutral-400">
            {sortedSessions.map((session) => {
              const isCurrent = session.id === currentId;
              const timeStr = formatRelativeTime(session.updatedAt);
              return (
                <CommandItem
                  key={session.id}
                  value={`${session.title} ${session.id}`}
                  onSelect={() => handleSelectSession(session.id)}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare
                      className={`size-3.5 shrink-0 ${
                        isCurrent ? "text-indigo-400" : "text-neutral-500 group-hover:text-neutral-300"
                      }`}
                    />
                    <span className={`truncate font-normal ${isCurrent ? "font-semibold text-white" : ""}`}>
                      {session.title || "Untitled Chat"}
                    </span>
                    {isCurrent && (
                      <span className="shrink-0 text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded-full font-medium">
                        Current
                      </span>
                    )}
                  </div>
                  {timeStr && (
                    <div className="flex items-center gap-1 shrink-0 text-[10px] text-neutral-500">
                      <Clock className="size-2.5" />
                      <span>{timeStr}</span>
                    </div>
                  )}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator className="my-1.5 bg-white/5" />

        {/* App Navigation & Tools */}
        <CommandGroup heading="Navigation & Tools" className="text-neutral-400">
          <CommandItem
            onSelect={() => handleNavigate("/")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
          >
            <FileText className="size-3.5 text-indigo-400 shrink-0" />
            <span className="flex-1">Open Resume Builder</span>
            <ExternalLink className="size-3 text-neutral-500" />
          </CommandItem>

          <CommandItem
            onSelect={() => handleNavigate("/cover-letter")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
          >
            <FileText className="size-3.5 text-sky-400 shrink-0" />
            <span className="flex-1">Open Cover Letter Studio</span>
            <ExternalLink className="size-3 text-neutral-500" />
          </CommandItem>

          <CommandItem
            onSelect={() => handleNavigate("/price")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
          >
            <Layers className="size-3.5 text-emerald-400 shrink-0" />
            <span className="flex-1">View Plans & Templates</span>
            <ExternalLink className="size-3 text-neutral-500" />
          </CommandItem>

          <CommandItem
            onSelect={() => handleNavigate("/profile")}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
          >
            <UserRound className="size-3.5 text-indigo-400 shrink-0" />
            <span className="flex-1">Profile & Memory Vault Dashboard</span>
            <ExternalLink className="size-3 text-neutral-500" />
          </CommandItem>

          {onOpenWebview && (
            <CommandItem
              onSelect={() => handleAction(onOpenWebview)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
            >
              <Globe className="size-3.5 text-teal-400 shrink-0" />
              <span className="flex-1">In-App Web Browser</span>
              <CommandShortcut className="text-[10px] text-neutral-500 font-mono">⌘B</CommandShortcut>
            </CommandItem>
          )}

          {onOpenMcp && (
            <CommandItem
              onSelect={() => handleAction(onOpenMcp)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
            >
              <Plug className="size-3.5 text-purple-400 shrink-0" />
              <span className="flex-1">MCP Tools & Agents</span>
              <CommandShortcut className="text-[10px] text-neutral-500 font-mono">⌘M</CommandShortcut>
            </CommandItem>
          )}

          {onOpenGuide && (
            <CommandItem
              onSelect={() => handleAction(onOpenGuide)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
            >
              <Sparkles className="size-3.5 text-amber-400 shrink-0" />
              <span className="flex-1">Interactive Guide & Tour</span>
              <CommandShortcut className="text-[10px] text-neutral-500 font-mono">⌘G</CommandShortcut>
            </CommandItem>
          )}

          {onOpenSettings && (
            <CommandItem
              onSelect={() => handleAction(onOpenSettings)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
            >
              <Settings className="size-3.5 text-neutral-400 shrink-0" />
              <span className="flex-1">Settings & Memory Vault</span>
              <CommandShortcut className="text-[10px] text-neutral-500 font-mono">⌘,</CommandShortcut>
            </CommandItem>
          )}

          <CommandItem
            onSelect={handleToggleTheme}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:text-white cursor-pointer data-[selected=true]:bg-white/10 data-[selected=true]:text-white transition-colors"
          >
            <SunMoon className="size-3.5 text-amber-300 shrink-0" />
            <span className="flex-1">Toggle Theme ({theme === "dark" ? "Light Mode" : "Dark Mode"})</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Footer shortcut bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 bg-black/20 text-[11px] text-neutral-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">esc</kbd> Close
          </span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-mono text-[10px]">⌘K</kbd> Toggle
        </div>
      </div>
    </CommandDialog>
  );
}
