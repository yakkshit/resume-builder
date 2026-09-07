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
  MessageSquarePlus,
  FileText,
  AlignLeft,
  Sun,
  Moon,
  Settings2,
  Search,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatSession, ChatSettings } from "./chat-store";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ProfileSettingsDialog, getStoredProfile } from "./profile-settings-dialog";
import { SidebarIntegrationsAccordion } from "./sidebar-integrations-accordion";
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
  onIntegrationsToast?: (variant: "default" | "success" | "error" | "warning", message: string) => void;
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
  onIntegrationsToast,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileName, setProfileName] = React.useState("");
  const [profileEmail, setProfileEmail] = React.useState("");

  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = getStoredProfile();
    setProfileName(p.name || "Your Profile");
    setProfileEmail(p.email || "Memory Vault & Settings");
  }, [profileOpen]);

  const filteredSessions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => (s.title || "").toLowerCase().includes(q));
  }, [sessions, searchQuery]);

  const groupedSessions = React.useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const past7Days = today - 86400000 * 7;

    const groups: { [key: string]: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    for (const s of filteredSessions) {
      const time = new Date(s.updatedAt).getTime();
      if (time >= today) {
        groups.Today.push(s);
      } else if (time >= yesterday) {
        groups.Yesterday.push(s);
      } else if (time >= past7Days) {
        groups["Previous 7 Days"].push(s);
      } else {
        groups.Older.push(s);
      }
    }

    return groups;
  }, [filteredSessions]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0 bg-background/60 backdrop-blur-xs",
              elevateForOnboarding ? "z-[65]" : "z-40",
            )}
            onClick={onClose}
          />

          {/* Minimal sidebar panel */}
          <motion.aside
            key="sidebar"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className={cn(
              "fixed left-2.5 top-2.5 bottom-2.5 flex w-[290px] flex-col overflow-hidden rounded-2xl",
              "border border-border/70 bg-background/95 dark:bg-neutral-900/95 backdrop-blur-2xl shadow-xl",
              elevateForOnboarding ? "z-[68]" : "z-50",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-foreground leading-none">Career Agent</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Workspace & Chat</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      aria-label="Toggle theme"
                    >
                      {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">Toggle theme</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                      aria-label="Close sidebar"
                    >
                      <X className="w-3.5 h-3.5" />
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

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3" style={{ scrollbarWidth: "none" }}>
              {/* New Chat Button */}
              <button
                type="button"
                onClick={() => { onNewSession(); onClose(); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-all shadow-xs"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>New Conversation</span>
              </button>

              {/* Navigation links */}
              <div className="space-y-0.5 pt-0.5">
                <Link
                  href="/"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Resume Builder
                  </span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                </Link>
                <Link
                  href="/cover-letter"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Cover Letter
                  </span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                </Link>
                <Link
                  href="/price"
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <AlignLeft className="w-3.5 h-3.5" /> Pricing Plans
                  </span>
                  <ChevronRight className="w-3 h-3 opacity-40" />
                </Link>
              </div>

              {/* Integrations drawer */}
              <SidebarIntegrationsAccordion
                settings={settings}
                onSettingsChange={onSettingsChange}
                onToast={onIntegrationsToast}
              />

              {/* Chat Search Box */}
              {sessions.length > 2 && (
                <div className="relative pt-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search history..."
                    className="w-full bg-muted/40 border border-border/60 rounded-lg pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              )}

              {/* Chat History */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground/80" /> History
                  </p>
                </div>

                <div className="space-y-3">
                  {Object.entries(groupedSessions).map(([period, groupItems]) => {
                    if (groupItems.length === 0) return null;
                    return (
                      <div key={period} className="space-y-1">
                        <p className="px-1 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                          {period}
                        </p>
                        <div className="space-y-0.5">
                          {groupItems.map((s) => (
                            <div key={s.id} className="group relative">
                              <button
                                onClick={() => { onSessionSelect(s.id); onClose(); }}
                                className={cn(
                                  "w-full text-left px-2.5 py-2 rounded-lg text-xs transition-all flex items-center gap-2",
                                  s.id === currentId
                                    ? "bg-primary/10 text-primary font-medium border border-primary/20"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors",
                                    s.id === currentId ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/60"
                                  )}
                                />
                                <div className="flex-1 min-w-0 pr-5">
                                  <p className="truncate text-xs">{s.title || "New Chat"}</p>
                                </div>
                              </button>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSession(s.id);
                                    }}
                                    className="absolute right-1.5 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive rounded focus:opacity-100"
                                    aria-label="Delete chat"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="text-xs">Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {filteredSessions.length === 0 && (
                    <div className="py-6 text-center text-xs text-muted-foreground/60">
                      {searchQuery ? "No matching chats" : "No chat history yet"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Export / Import & Profile Footer */}
            <div className="border-t border-border/50 p-2 space-y-1.5 bg-muted/20">
              <div className="flex gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={onExport}
                >
                  <Download className="w-3 h-3 mr-1" /> Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-[11px] font-normal text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3 h-3 mr-1" /> Import
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={onImport}
                />
              </div>

              {/* Minimal Profile Button */}
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                  {profileName ? profileName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{profileName || "Your Profile"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profileEmail || "Memory Vault & Settings"}</p>
                </div>
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
