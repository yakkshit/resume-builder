"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Users,
  Code2,
  FolderKanban,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
  Trash2,
  MoreHorizontal,
  Sun,
  Moon,
  FileText,
  Layers,
  Wrench,
  BarChart3,
  Plug,
  ExternalLink,
  Globe,
  BookMarked,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChatSession, ChatSettings } from "./chat-store";
import Link from "next/link";
import { useTheme } from "next-themes";
import { ProfileSettingsDialog, getStoredProfile } from "./profile-settings-dialog";
import { SidebarUserControls, SidebarCompactUserControls } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean; // on mobile: drawer open
  onClose: () => void;
  isCollapsed: boolean; // on desktop: icon rail mode
  onToggleCollapse: () => void;
  sessions: ChatSession[];
  currentId: string;
  settings: ChatSettings;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onExport?: () => void;
  onImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
  onIntegrationsToast?: (variant: "default" | "success" | "error" | "warning", message: string) => void;
  onOpenWebview?: () => void;
  webviewOpen?: boolean;
  onOpenMcp?: () => void;
  onOpenGuide?: () => void;
  onOpenSettings?: () => void;
}

export function ChatSidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  sessions,
  currentId,
  settings,
  onSessionSelect,
  onNewSession,
  onDeleteSession,
  onSettingsChange,
  onOpenWebview,
  webviewOpen,
  onOpenMcp,
  onOpenGuide,
  onOpenSettings,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState("Yakkshit");
  const [profileEmail, setProfileEmail] = useState("AI Engineer");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [allChatsExpanded, setAllChatsExpanded] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p = getStoredProfile();
    setProfileName(p.name || "Yakkshit");
    setProfileEmail(p.email || "AI Studio");
  }, [profileOpen]);

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setProfileOpen(true);
    }
  };

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
    const past30Days = today - 86400000 * 30;

    const groups: { [key: string]: ChatSession[] } = {
      Today: [],
      Yesterday: [],
      "Previous 7 days": [],
      "Previous 30 days": [],
    };

    for (const s of filteredSessions) {
      const time = new Date(s.updatedAt).getTime();
      if (time >= today) {
        groups.Today.push(s);
      } else if (time >= yesterday) {
        groups.Yesterday.push(s);
      } else if (time >= past7Days) {
        groups["Previous 7 days"].push(s);
      } else {
        groups["Previous 30 days"].push(s);
      }
    }

    return groups;
  }, [filteredSessions]);

  // Desktop Collapsed Icon Rail
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={150}>
        <aside className="hidden md:flex flex-col items-center justify-between w-14 h-full bg-[#141416] border-r border-white/5 py-3 z-30 shrink-0 select-none">
          {/* Top Action Icons */}
          <div className="flex flex-col items-center gap-2.5 w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="size-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Expand Sidebar"
                >
                  <PanelLeft className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Expand Sidebar</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onNewSession}
                  className="size-9 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="New Chat"
                >
                  <Plus className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">New Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    onToggleCollapse();
                    setSearchOpen(true);
                  }}
                  className="size-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Search Chats"
                >
                  <Search className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Search Chats</TooltipContent>
            </Tooltip>

            <div className="w-8 h-px bg-white/5 my-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className="size-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="My Library & Resumes"
                >
                  <BookOpen className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">My Library</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/cover-letter"
                  className="size-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Cover Letters"
                >
                  <FileText className="size-4" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">Cover Letters</TooltipContent>
            </Tooltip>

            {onOpenWebview && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenWebview}
                    className={cn(
                      "size-9 rounded-xl flex items-center justify-center transition-colors",
                      webviewOpen
                        ? "bg-indigo-600 text-white"
                        : "text-neutral-400 hover:text-white hover:bg-white/10"
                    )}
                    aria-label="In-App Web Browser"
                  >
                    <Globe className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  {webviewOpen ? "Close In-App Browser" : "Open Chromium Browser"}
                </TooltipContent>
              </Tooltip>
            )}

            {onOpenMcp && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onOpenMcp}
                    className="size-9 rounded-xl flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="MCP Tools & Servers"
                  >
                    <Plug className="size-4 text-indigo-400" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">MCP Tools</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Bottom Avatar & Clerk User Controls */}
          <div className="flex flex-col items-center gap-2">
            <SidebarCompactUserControls onOpenSettings={handleOpenSettings} />
          </div>

          <ProfileSettingsDialog
            open={profileOpen}
            onOpenChange={setProfileOpen}
            settings={settings}
            onSettingsChange={onSettingsChange}
          />
        </aside>
      </TooltipProvider>
    );
  }

  // Desktop Expanded Sidebar & Mobile Drawer
  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={cn(
          "flex flex-col justify-between w-64 h-full bg-[#141416] border-r border-white/5 z-30 shrink-0 select-none transition-all duration-200",
          "fixed md:relative inset-y-0 left-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Top Header & Navigation Section */}
        <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
          {/* Brand & Collapse Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                <Sparkles className="size-3.5" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">Career Studio</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Collapse Sidebar"
                >
                  <PanelLeftClose className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Collapse Sidebar</TooltipContent>
            </Tooltip>
          </div>

          {/* Scrollable Navigation Items */}
          <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 scrollbar-thin">
            {/* Primary Action Buttons */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onNewSession();
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-all group border border-white/5"
              >
                <Plus className="size-4 text-neutral-400 group-hover:text-white transition-colors" />
                <span>New Chat</span>
              </button>

              {/* Search Trigger / Input */}
              {searchOpen ? (
                <div className="relative px-1 py-0.5">
                  <Search className="size-3.5 absolute left-3.5 top-2.5 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    autoFocus
                    className="w-full h-8 pl-8 pr-3 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 text-xs font-normal transition-colors"
                >
                  <Search className="size-3.5" />
                  <span>Search Chats</span>
                </button>
              )}

              {/* My Library with Thumbnail Previews */}
              <div className="pt-2">
                <div className="flex items-center justify-between px-3 py-1 text-xs text-neutral-400">
                  <span className="flex items-center gap-2 text-neutral-300 font-medium text-xs">
                    <BookOpen className="size-3.5" /> My Library
                  </span>
                </div>
                {/* Visual Thumbnail Cards */}
                <div className="grid grid-cols-3 gap-1.5 px-2.5 pt-1.5">
                  <Link
                    href="/"
                    className="group flex flex-col items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center"
                    title="Resume Builder"
                  >
                    <div className="size-9 rounded bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-white mb-1 shadow-2xs">
                      <FileText className="size-4 text-indigo-400" />
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 truncate w-full">Resumes</span>
                  </Link>

                  <Link
                    href="/cover-letter"
                    className="group flex flex-col items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center"
                    title="Cover Letters"
                  >
                    <div className="size-9 rounded bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-white mb-1 shadow-2xs">
                      <FileText className="size-4 text-sky-400" />
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 truncate w-full">Letters</span>
                  </Link>

                  <Link
                    href="/price"
                    className="group flex flex-col items-center p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-center"
                    title="Pricing & Templates"
                  >
                    <div className="size-9 rounded bg-neutral-800 flex items-center justify-center text-neutral-300 group-hover:text-white mb-1 shadow-2xs">
                      <Layers className="size-4 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-neutral-400 group-hover:text-neutral-200 truncate w-full">Plans</span>
                  </Link>
                </div>
              </div>

              {/* Tools & Links */}
              <div className="pt-2 space-y-0.5">
                {onOpenWebview && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenWebview();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors",
                      webviewOpen
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Globe className="size-3.5 text-indigo-400" />
                      <span>In-App Web Browser</span>
                    </div>
                    {webviewOpen && (
                      <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded font-medium">Active</span>
                    )}
                  </button>
                )}

                {onOpenMcp && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenMcp();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 text-xs transition-colors"
                  >
                    <Plug className="size-3.5 text-neutral-400" />
                    <span>MCP Tools & Agents</span>
                  </button>
                )}

                {onOpenGuide && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGuide();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 text-xs transition-colors"
                  >
                    <BookMarked className="size-3.5 text-neutral-400" />
                    <span>Interactive Guide</span>
                  </button>
                )}

                <Link
                  href="/"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 text-xs transition-colors"
                >
                  <Users className="size-3.5 text-neutral-400" />
                  <span>Community & Templates</span>
                </Link>
              </div>

              {/* Projects Collapsible Group */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setProjectsExpanded(!projectsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  <span className="text-[11px] font-medium text-neutral-400">Projects</span>
                  <ChevronDown className={cn("size-3 transition-transform", !projectsExpanded && "-rotate-90")} />
                </button>
                {projectsExpanded && (
                  <div className="pl-3 pt-1 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        onNewSession();
                        onClose();
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1 rounded text-neutral-400 hover:text-white text-xs hover:bg-white/5 transition-colors"
                    >
                      <Plus className="size-3" />
                      <span>New Project</span>
                    </button>
                  </div>
                )}
              </div>

              {/* All Chats Section */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setAllChatsExpanded(!allChatsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  <span className="text-[11px] font-medium text-neutral-400">All chats</span>
                  <ChevronDown className={cn("size-3 transition-transform", !allChatsExpanded && "-rotate-90")} />
                </button>

                {allChatsExpanded && (
                  <div className="pt-1.5 space-y-3">
                    {Object.entries(groupedSessions).map(([groupTitle, list]) => {
                      if (list.length === 0) return null;
                      return (
                        <div key={groupTitle} className="space-y-1">
                          <p className="px-3 text-[10px] font-semibold text-neutral-400 tracking-wider">
                            {groupTitle}
                          </p>
                          {list.map((s) => {
                            const isActive = s.id === currentId;
                            return (
                              <div
                                key={s.id}
                                className={cn(
                                  "group relative flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer",
                                  isActive
                                    ? "bg-white/10 text-white font-medium"
                                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                                )}
                                onClick={() => {
                                  onSessionSelect(s.id);
                                  onClose();
                                }}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {isActive && (
                                    <span className="size-1.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
                                  )}
                                  <span className="truncate">{s.title || "New Conversation"}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSession(s.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-destructive transition-all rounded"
                                  title="Delete conversation"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom User Profile Section with Clerk Credentials */}
        <div className="p-3 border-t border-white/5 shrink-0">
          <SidebarUserControls onOpenSettings={handleOpenSettings} />
        </div>

        <ProfileSettingsDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          settings={settings}
          onSettingsChange={onSettingsChange}
        />
      </aside>
    </TooltipProvider>
  );
}
