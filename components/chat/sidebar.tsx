"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Sparkles,
  Clock,
  Download,
  Upload,
  Trash2,
  User,
  MessageSquarePlus,
  FileText,
  AlignLeft,
  Sun,
  Moon,
  Settings2,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatSession, ChatSettings } from "./chat-store";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ProfileSettingsDialog, getStoredProfile } from "./profile-settings-dialog";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /** Lift above onboarding dim layer so the panel stays readable during the tour */
  elevateForOnboarding?: boolean;
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentId: string;
  settings: ChatSettings;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
}

export function ChatSidebar({
  elevateForOnboarding = false,
  isOpen,
  onClose,
  sessions,
  currentId,
  settings,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onExport,
  onImport,
  onSettingsChange,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileName, setProfileName] = React.useState("");
  const [profileEmail, setProfileEmail] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = getStoredProfile();
    setProfileName(p.name || "Your profile");
    setProfileEmail(p.email || "Click to edit");
  }, [profileOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 bg-black/40 backdrop-blur-sm",
              elevateForOnboarding ? "z-[65]" : "z-40",
            )}
            onClick={onClose}
          />

          {/* Sidebar panel */}
          <motion.aside
            key="sidebar"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className={cn(
              "fixed left-3 top-3 bottom-3 flex w-[310px] flex-col overflow-hidden rounded-2xl shadow-2xl",
              elevateForOnboarding ? "z-[68]" : "z-50",
            )}
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {/* Glow blobs */}
            <div className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProfileOpen(true)}
                  className="group flex min-w-0 flex-1 items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 transition-colors"
                  aria-label="Open global profile and settings"
                >
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-sm font-semibold text-foreground truncate">{profileName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{profileEmail}</p>
                  </div>
                  <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                      aria-label="What is global profile?"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    collisionPadding={16}
                    className="z-[200] w-[min(calc(100vw-2rem),17rem)] rounded-xl border border-border/80 bg-popover p-3 text-popover-foreground shadow-xl"
                  >
                    <p className="text-xs font-semibold text-foreground">Global profile</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      Opens contact info, HR email provider, default model, and career context. Data stays in this browser only (not synced to a server).
                    </p>
                    <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                      Extra fields for OpenAI-compatible or Hugging Face appear only when those models are selected.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="h-8 w-8 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Light / dark theme</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-foreground"
                  aria-label="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Close</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <ProfileSettingsDialog
              open={profileOpen}
              onOpenChange={setProfileOpen}
              settings={settings}
              onSettingsChange={onSettingsChange}
            />

            {/* Scrollable settings + history */}
            <div className="relative z-10 flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
              
              {/* App Navigation section */}
              <div className="px-4 py-3 border-b border-white/10 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2 font-semibold">
                  <AlignLeft className="w-3.5 h-3.5 text-cyan-400" /> App Navigation
                </p>
                <div className="flex flex-col gap-1.5">
                  <Link href="/" className="text-xs group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all border border-transparent hover:border-white/10">
                    <FileText className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" /> Resume Builder
                  </Link>
                  <Link href="/chat" className="text-xs flex items-center gap-3 px-3 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-white shadow-[0_0_15px_rgba(99,102,241,0.1)] transition-all">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> Career Assistant
                  </Link>
                  <Link href="/cover-letter" className="text-xs group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all border border-transparent hover:border-white/10">
                    <FileText className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" /> Cover Letter
                  </Link>
                  <Link href="/price" className="text-xs group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-white transition-all border border-transparent hover:border-white/10">
                    <AlignLeft className="w-4 h-4 text-muted-foreground group-hover:text-cyan-400 transition-colors" /> Pricing
                  </Link>
                </div>
              </div>

            {/* Settings moved to profile popup */}

              {/* Chat history header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> History
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] font-semibold text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg transition-all shadow-sm"
                  onClick={() => { onNewSession(); onClose(); }}
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 mr-1" /> New
                </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">Start a fresh conversation</TooltipContent>
                </Tooltip>
              </div>

              {/* Session list */}
              <div className="px-3 py-3 space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="group relative">
                    <button
                      onClick={() => { onSessionSelect(s.id); onClose(); }}
                      className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-start gap-3 shadow-none ${
                        s.id === currentId
                          ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                          : "bg-black/20 hover:bg-white/10 border border-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 shadow-sm transition-colors ${s.id === currentId ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]" : "bg-white/20 group-hover:bg-white/50"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`truncate text-xs font-semibold pr-6 transition-colors ${s.id === currentId ? "text-indigo-50" : "text-muted-foreground group-hover:text-white"}`}>
                          {s.title || "New Chat"}
                        </p>
                        <p className={`text-[10px] mt-1 font-medium transition-colors ${s.id === currentId ? "text-indigo-200/60" : "text-muted-foreground/50"}`}>
                          {new Date(s.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onDeleteSession(s.id)}
                      className="absolute right-2 top-3 opacity-0 group-hover:opacity-100 transition-all p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg focus:opacity-100"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">Delete this chat</TooltipContent>
                    </Tooltip>
                  </div>
                ))}
                {sessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                    <MessageSquarePlus className="w-8 h-8 mb-2 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground font-medium">No chat history yet</p>
                  </div>
                )}
              </div>
            </div>

             {/* Export / Import */}
             <div className="px-4 py-3 border-b border-white/10 flex gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-[11px] font-semibold bg-white/5 border border-white/10 hover:bg-indigo-500/20 hover:text-indigo-200 hover:border-indigo-500/30 transition-all rounded-lg"
                  onClick={onExport}
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    Download chats, profile, settings, and resume as JSON (no API keys).
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-[11px] font-semibold bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:text-cyan-200 hover:border-cyan-500/30 transition-all rounded-lg"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" /> Import
                </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    Restore from an export file created here.
                  </TooltipContent>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={onImport}
                />
              </div>

            {/* User profile at bottom */}
            {/* <div className="relative z-10 px-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">You</p>
                  <p className="text-[10px] text-muted-foreground">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</p>
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
            </div>  */}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
