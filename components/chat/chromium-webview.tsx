"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Search,
  Cloud,
  Maximize2,
  Minimize2,
  Columns,
  Rows,
  X,
  Copy,
  Check,
  ShieldCheck,
  Bot,
  UserCheck,
  Play,
  Pause,
  Code2,
  Terminal,
  MousePointer,
  AlertCircle,
  Briefcase,
  FileText,
  Send,
  SlidersHorizontal,
  Crosshair,
  Layers,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Persona } from "@/components/ai-elements/persona";

export interface AgentBrowserAction {
  step: number;
  action: "navigate" | "click" | "type" | "scroll" | "extract" | "handoff";
  url?: string;
  selector?: string;
  value?: string;
  desc?: string;
  timestamp: string;
}

interface ChromiumWebviewProps {
  initialUrl?: string;
  onClose?: () => void;
  onInjectSnippet: (text: string, sourceUrl?: string) => void;
  splitLayout: "horizontal" | "vertical" | "fullscreen";
  onToggleSplitLayout: (mode: "horizontal" | "vertical" | "fullscreen") => void;
}

interface AgentCursorState {
  x: number;
  y: number;
  isVisible: boolean;
  actionText: string;
  isClicking: boolean;
}

interface InspectedElementState {
  tag: string;
  text: string;
  html: string;
  x: number;
  y: number;
}

const QUICK_LINKS = [
  { label: "Google", url: "https://www.google.com" },
  { label: "Cedzlabs", url: "https://cedzlabs.com" },
  { label: "GitHub", url: "https://github.com" },
  { label: "Wikipedia", url: "https://wikipedia.org" },
  { label: "Hacker News", url: "https://news.ycombinator.com" },
  { label: "LinkedIn", url: "https://www.linkedin.com" },
];

export function ChromiumWebview({
  initialUrl = "https://www.google.com",
  onClose,
  onInjectSnippet,
  splitLayout,
  onToggleSplitLayout,
}: ChromiumWebviewProps) {
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);

  // Inspector & Selection Assistant Mode
  const [isInspectorMode, setIsInspectorMode] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<InspectedElementState | null>(null);

  // Autonomous Agent Control & Human-in-the-Loop Mode
  const [isAgentAutopilot, setIsAgentAutopilot] = useState(false);
  const [isUserTakingOver, setIsUserTakingOver] = useState(false);
  const [agentLogs, setAgentLogs] = useState<AgentBrowserAction[]>([
    {
      step: 1,
      action: "navigate",
      url: initialUrl,
      desc: "Initial web session started",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [showJsonlSheet, setShowJsonlSheet] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Live Agent Visual Cursor
  const [agentCursor, setAgentCursor] = useState<AgentCursorState>({
    x: 100,
    y: 120,
    isVisible: false,
    actionText: "Ready",
    isClicking: false,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cloud Browser (Playwright) State
  const [isCloudMode, setIsCloudMode] = useState(false);
  const [cloudSessionId, setCloudSessionId] = useState<string | null>(null);
  const [cloudImageBase64, setCloudImageBase64] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState("");

  const [iframeBlockReason, setIframeBlockReason] = useState("");

  const navigateTo = useCallback(
    (target: string, fromAgent = false) => {
      let finalUrl = target.trim();
      if (!finalUrl) return;

      if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
        if (finalUrl.includes(".") && !finalUrl.includes(" ")) {
          finalUrl = `https://${finalUrl}`;
        } else {
          // It's a search query — route through proxy search engine
          finalUrl = `/api/webview/proxy?url=${encodeURIComponent(finalUrl)}`;
        }
      }

      const displayUrl = finalUrl.startsWith("/api/webview/proxy")
        ? new URLSearchParams(finalUrl.split("?")[1] || "").get("url") || finalUrl
        : finalUrl;
      setUrlInput(displayUrl);
      setCurrentUrl(finalUrl);

      if (isCloudMode) {
        handleCloudAction({ action: "navigate", url: finalUrl });
        return;
      }

      setIframeBlocked(false);
      setIframeBlockReason("");
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), finalUrl]);
      setHistoryIndex((prev) => prev + 1);
      setIsLoading(true);
      setSelectedText("");
      setInspectedElement(null);

      // Preflight check: if site blocks direct iframe embedding, silently fall back to proxy
      // The proxy fetches the page server-side (no X-Frame-Options restriction) and serves it
      if (finalUrl.startsWith("http://") || finalUrl.startsWith("https://")) {
        fetch(`/api/webview/check-headers?url=${encodeURIComponent(finalUrl)}`)
          .then((r) => r.json())
          .then((data: { canEmbed: boolean; reason: string }) => {
            if (!data.canEmbed) {
              // Fall back to proxy instead of showing blocked UI
              const proxyUrl = `/api/webview/proxy?url=${encodeURIComponent(finalUrl)}`;
              setCurrentUrl(proxyUrl);
              // Don't change urlInput so address bar still shows the real URL
            }
          })
          .catch(() => {
            // If check fails, optimistically keep direct load
          });
      }

      setAgentLogs((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          action: "navigate",
          url: finalUrl,
          desc: fromAgent ? `Agent navigated to ${finalUrl}` : `User navigated to ${finalUrl}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    },
    [historyIndex, isCloudMode, cloudSessionId]
  );

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      const displayUrl = prevUrl.startsWith("/api/webview/proxy") ? new URLSearchParams(prevUrl.split("?")[1] || "").get("url") || prevUrl : prevUrl;
      setUrlInput(displayUrl);
      setCurrentUrl(prevUrl);
      if (isCloudMode) {
        handleCloudAction({ action: "back" });
      } else {
        setIframeBlocked(false);
        setIsLoading(true);
      }
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      const displayUrl = nextUrl.startsWith("/api/webview/proxy") ? new URLSearchParams(nextUrl.split("?")[1] || "").get("url") || nextUrl : nextUrl;
      setUrlInput(displayUrl);
      setCurrentUrl(nextUrl);
      if (isCloudMode) {
        handleCloudAction({ action: "forward" });
      } else {
        setIframeBlocked(false);
        setIsLoading(true);
      }
    }
  };

  const handleReload = () => {
    if (isCloudMode) {
      handleCloudAction({ action: "navigate", url: currentUrl });
      return;
    }
    if (iframeRef.current) {
      setIsLoading(true);
      setIframeBlocked(false);
      // Force reload by briefly setting blank then restoring
      const src = iframeRef.current.src;
      iframeRef.current.src = "about:blank";
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src;
      }, 50);
    }
  };

  const toggleInspectorMode = () => {
    const next = !isInspectorMode;
    setIsInspectorMode(next);
    setInspectedElement(null);
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "SET_INSPECTOR_MODE", active: next }, "*");
    } catch {}
  };

  // Helper: extract display URL from a possibly-proxy URL
  const toDisplayUrl = useCallback((url: string): string => {
    if (!url) return "";
    try {
      if (url.includes("/api/webview/proxy?")) {
        const params = new URLSearchParams(url.split("?")[1] || "");
        return params.get("url") || url;
      }
    } catch {}
    return url;
  }, []);

  // --- Cloud Browser Logic ---
  useEffect(() => {
    let active = true;
    if (isCloudMode && !cloudSessionId) {
      setIsLoading(true);
      fetch("/api/webview/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_session", url: currentUrl }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!active) return;
          if (data.success) {
            setCloudSessionId(data.sessionId);
            if (data.imageBase64) setCloudImageBase64(data.imageBase64);
            if (data.url) setUrlInput(data.url);
          } else {
            setCloudError(data.error || "Failed to start cloud browser");
          }
          setIsLoading(false);
        })
        .catch((e) => {
          if (active) {
            setCloudError(e.message);
            setIsLoading(false);
          }
        });
    }

    return () => {
      active = false;
      if (!isCloudMode && cloudSessionId) {
        // We're leaving cloud mode, destroy session
        fetch("/api/webview/browser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "destroy_session", sessionId: cloudSessionId }),
        }).catch(() => {});
        setCloudSessionId(null);
        setCloudImageBase64(null);
      }
    };
  }, [isCloudMode, cloudSessionId, currentUrl]);

  const handleCloudAction = async (payload: any) => {
    if (!cloudSessionId) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/webview/browser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: cloudSessionId, ...payload }),
      });
      const data = await res.json();
      if (data.success && data.imageBase64) {
        setCloudImageBase64(data.imageBase64);
        if (data.url) setUrlInput(data.url);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const onCloudClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    // Playwright viewport is 1280x900. We scale the click coordinates.
    const scaleX = 1280 / rect.width;
    const scaleY = 900 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    handleCloudAction({ action: "click", x, y });
  };

  const onCloudScroll = (e: React.WheelEvent<HTMLImageElement>) => {
    handleCloudAction({ action: "scroll", deltaY: e.deltaY });
  };
  // -------------------------

  // Listen to postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === "WEBVIEW_PAGE_LOADED") {
        setIsLoading(false);
        // Update address bar with the real URL the iframe landed on
        if (e.data.url) {
          const realUrl = toDisplayUrl(e.data.url);
          if (realUrl && realUrl !== "about:blank") {
            setUrlInput(realUrl);
          }
        }
      } else if (e.data.type === "WEBVIEW_TEXT_SELECTED") {
        setSelectedText(e.data.text);
        setSelectionPosition({
          x: Math.max(10, Math.min(e.data.clientX || 120, 320)),
          y: Math.max(10, Math.min(e.data.clientY || 120, 400)),
        });
      } else if (e.data.type === "WEBVIEW_ELEMENT_INSPECTED") {
        setInspectedElement({
          tag: e.data.tag,
          text: e.data.text,
          html: e.data.html,
          x: Math.max(10, Math.min(e.data.clientX || 120, 320)),
          y: Math.max(10, Math.min(e.data.clientY || 120, 400)),
        });
      } else if (e.data.type === "WEBVIEW_NAVIGATE_REQUEST") {
        if (e.data.url) {
          // Update address bar immediately so user sees where they're going
          setUrlInput(toDisplayUrl(e.data.url));
          navigateTo(e.data.url);
        }
      } else if (e.data.type === "ASK_AI_ABOUT_URL") {
        onInjectSnippet(e.data.text || `Analyze this page: ${e.data.url}`, e.data.url || currentUrl);
      } else if (e.data.type === "AGENT_EXTRACTED_DATA") {
        onInjectSnippet(
          `From ${currentUrl} (${e.data.title || "Webpage"}):\n\n${e.data.text.slice(0, 3000)}\n\nAnalyze this content, extract key requirements or components, and provide recommendations.`,
          currentUrl
        );
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [currentUrl, navigateTo, onInjectSnippet, toDisplayUrl]);


  // Parallel Agent Assistance with Animated Visual Cursor
  const triggerAgentAction = (actionType: "find_jobs" | "extract_desc" | "match_resume" | "custom", prompt?: string) => {
    setIsAgentAutopilot(true);
    setIsUserTakingOver(false);

    const container = containerRef.current?.getBoundingClientRect();
    const targetX = container ? Math.min(container.width * 0.45, 240) : 180;
    const targetY = container ? Math.min(container.height * 0.35, 180) : 140;

    setAgentCursor({
      x: targetX,
      y: targetY,
      isVisible: true,
      actionText:
        actionType === "find_jobs"
          ? "Scanning job listings..."
          : actionType === "extract_desc"
          ? "Extracting job requirements..."
          : actionType === "match_resume"
          ? "Comparing with Resume..."
          : "Analyzing webpage...",
      isClicking: false,
    });

    setTimeout(() => {
      setAgentCursor((prev) => ({ ...prev, isClicking: true, actionText: "Highlighting requirements..." }));
      try {
        iframeRef.current?.contentWindow?.postMessage({ type: "AGENT_SCROLL", top: 250 }, "*");
        iframeRef.current?.contentWindow?.postMessage({ type: "AGENT_EXTRACT_TEXT" }, "*");
      } catch {}
    }, 800);

    setTimeout(() => {
      setAgentCursor((prev) => ({ ...prev, isClicking: false, actionText: "Sent to Career AI!" }));
      setAgentLogs((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          action: "extract",
          url: currentUrl,
          desc: `Autonomous agent scanned and extracted content from ${currentUrl}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      if (actionType === "find_jobs") {
        onInjectSnippet(
          `I am on ${currentUrl}. Scan this page and extract all relevant Software Engineer / AI Engineer job openings with titles, company names, and requirements.`,
          currentUrl
        );
      } else if (actionType === "extract_desc") {
        onInjectSnippet(
          `Extract the full job description, required technical stack, qualifications, and responsibilities from ${currentUrl}.`,
          currentUrl
        );
      } else if (actionType === "match_resume") {
        onInjectSnippet(
          `Compare the job role on ${currentUrl} against my saved master resume. Calculate my CV match score and list the top 3 gaps to address.`,
          currentUrl
        );
      } else if (prompt) {
        onInjectSnippet(prompt, currentUrl);
      }

      setTimeout(() => {
        setAgentCursor((prev) => ({ ...prev, isVisible: false }));
        setIsAgentAutopilot(false);
      }, 1500);
    }, 1800);
  };

  // Specific AI actions on selected element / text
  const handleGenerateReactComponent = (html: string, text: string) => {
    onInjectSnippet(
      `From ${currentUrl}:\nConvert this UI element into a clean, modern, responsive React component using Tailwind CSS and TypeScript:\n\n\`\`\`html\n${html.slice(0, 2000)}\n\`\`\`\n\nMake sure it includes interactive states, Lucide icons, and full component props.`,
      currentUrl
    );
    setInspectedElement(null);
    setSelectedText("");
  };

  const handleAutofillForm = (html: string, text: string) => {
    onInjectSnippet(
      `From ${currentUrl}:\nI am filling out this form on the webpage:\n\n\`\`\`html\n${html.slice(0, 2000)}\n\`\`\`\n\nAnalyze every input field and draft the exact responses, answers, and profile details to fill it out accurately based on my master resume and profile.`,
      currentUrl
    );
    setInspectedElement(null);
    setSelectedText("");
  };

  const handleAskAIAboutSelection = (promptType: "explain" | "match" | "cover_letter") => {
    if (!selectedText) return;
    if (promptType === "explain") {
      onInjectSnippet(
        `From ${currentUrl}:\n"${selectedText}"\n\nExplain what this section / concept means and how it applies to my career or tech stack.`,
        currentUrl
      );
    } else if (promptType === "match") {
      onInjectSnippet(
        `From ${currentUrl}:\n"${selectedText}"\n\nCompare these requirements against my saved resume and provide tailored bullet points to add.`,
        currentUrl
      );
    } else if (promptType === "cover_letter") {
      onInjectSnippet(
        `From ${currentUrl}:\n"${selectedText}"\n\nDraft a targeted Cover Letter paragraph focusing specifically on these selected qualifications.`,
        currentUrl
      );
    }
    setSelectedText("");
    setSelectionPosition(null);
  };

  const handleCopySelection = () => {
    if (!selectedText) return;
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const handleUserTakeover = () => {
    setIsUserTakingOver(true);
    setIsAgentAutopilot(false);
    setAgentLogs((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        action: "handoff",
        desc: "User took manual cursor control of the browser",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleResumeAgent = () => {
    setIsUserTakingOver(false);
    setIsAgentAutopilot(true);
    setAgentLogs((prev) => [
      ...prev,
      {
        step: prev.length + 1,
        action: "extract",
        desc: "Autonomous agent resumed control after human takeover",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    triggerAgentAction("extract_desc");
  };

  const jsonlFeed = agentLogs.map((l) => JSON.stringify(l)).join("\n");

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(jsonlFeed);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 1500);
  };

  // These hosts set X-Frame-Options: SAMEORIGIN/DENY — always load via proxy (server-side fetch bypasses it)
  const ALWAYS_PROXY_HOSTS = [
    "google.com", "www.google.com",
    "linkedin.com", "www.linkedin.com",
    "twitter.com", "x.com", "www.twitter.com",
    "facebook.com", "www.facebook.com",
    "instagram.com", "www.instagram.com",
    "reddit.com", "www.reddit.com",
    "nytimes.com", "www.nytimes.com",
  ];

  const shouldUseProxy = (url: string): boolean => {
    if (url.startsWith("/api/webview/proxy") || url === "about:blank") return true;
    if (!url.startsWith("http")) return true;
    try {
      const host = new URL(url).hostname;
      return ALWAYS_PROXY_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
    } catch {
      return false;
    }
  };

  // Compute final iframe src — use proxy for known blocked sites + search/home, direct URL otherwise
  const iframeSrc = shouldUseProxy(currentUrl)
    ? currentUrl.startsWith("/api/webview/proxy")
      ? currentUrl
      : `/api/webview/proxy?url=${encodeURIComponent(currentUrl === "about:blank" ? "https://www.google.com" : currentUrl)}`
    : currentUrl;


  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full w-full bg-[#121215] border-l border-white/10 overflow-hidden select-text"
    >
      {/* Autonomous Agent Control Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141416] border-b border-white/5 text-white text-xs shrink-0">
        <div className="flex items-center gap-2">
          <Persona
            state={isUserTakingOver ? "asleep" : (isAgentAutopilot ? "speaking" : "idle")}
            variant="obsidian"
            className="size-5 shrink-0"
          />
          <Badge
            variant={isUserTakingOver ? "destructive" : isAgentAutopilot ? "default" : "secondary"}
            className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full"
          >
            {isUserTakingOver ? (
              <span className="flex items-center gap-1 text-amber-300">
                <MousePointer className="size-3" /> Manual Browsing
              </span>
            ) : isAgentAutopilot ? (
              <span className="flex items-center gap-1 text-emerald-300">
                <Bot className="size-3 animate-pulse" /> Agent Assisting
              </span>
            ) : (
              <span className="flex items-center gap-1 text-neutral-300">
                <Globe className="size-3" /> Standard Browser
              </span>
            )}
          </Badge>

          <span className="hidden sm:inline text-[11px] text-neutral-400 truncate max-w-[180px]">
            {isInspectorMode ? "Click any element on the page" : "Browse freely or select to ask AI"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Element Inspector Trigger */}
          <Button
            type="button"
            size="sm"
            variant={isInspectorMode ? "secondary" : "outline"}
            onClick={toggleInspectorMode}
            className={`h-6 text-[11px] px-2 flex items-center gap-1 border transition-all ${
              isInspectorMode
                ? "bg-purple-600 text-white border-purple-500 font-semibold"
                : "border-white/10 bg-white/5 hover:bg-white/10 text-purple-300"
            }`}
            title="Inspect any element on webpage to replicate as React component or fill form"
          >
            <Crosshair className="size-3" />
            <span>{isInspectorMode ? "Selecting..." : "Inspect Element"}</span>
          </Button>

          {isUserTakingOver ? (
            <Button
              type="button"
              size="sm"
              onClick={handleResumeAgent}
              className="h-6 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow-xs"
            >
              <Play className="size-3" />
              <span>Resume Agent</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUserTakeover}
              className="h-6 text-[11px] px-2 border-white/10 bg-white/5 hover:bg-white/10 text-amber-300 font-medium flex items-center gap-1"
            >
              <MousePointer className="size-3" />
              <span>Manual Control</span>
            </Button>
          )}

          <Button
            type="button"
            size="sm"
            variant={isCloudMode ? "secondary" : "outline"}
            onClick={() => setIsCloudMode(!isCloudMode)}
            className={`h-6 text-[11px] px-2 flex items-center gap-1 border transition-all ${
              isCloudMode
                ? "bg-blue-600 text-white border-blue-500 font-semibold"
                : "border-white/10 bg-white/5 hover:bg-white/10 text-blue-300"
            }`}
            title="Toggle Cloud Browser (Playwright Backend) to bypass iframe restrictions"
          >
            <Cloud className="size-3" />
            <span className="hidden sm:inline">{isCloudMode ? "Cloud Mode: ON" : "Cloud Mode"}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowJsonlSheet(true)}
            className="h-6 text-[11px] px-1.5 text-neutral-300 hover:text-white hover:bg-white/10"
            title="View MCP JSONL Actions"
          >
            <Terminal className="size-3.5 mr-1" />
            <span className="hidden sm:inline font-mono text-[10px]">JSONL</span>
          </Button>
        </div>
      </div>

      {/* Top Navigation & Address Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181b] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="h-7 w-7 p-0 rounded-md text-neutral-300 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="h-7 w-7 p-0 rounded-md text-neutral-300 hover:text-white"
            aria-label="Forward"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReload}
            className="h-7 w-7 p-0 rounded-md text-neutral-300 hover:text-white"
            aria-label="Reload"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Address & Search Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigateTo(urlInput);
          }}
          className="flex-1 flex items-center relative min-w-0"
        >
          <Search className="h-3.5 w-3.5 absolute left-2.5 text-neutral-400 shrink-0 pointer-events-none" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search Google/Web or type any URL..."
            className="h-7 text-xs pl-8 pr-7 bg-[#121215] border-white/10 text-white placeholder:text-neutral-500 rounded-lg focus:border-indigo-500"
          />
          {isLoading && (
            <div className="absolute right-2.5 h-3 w-3 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          )}
        </form>

        {/* Layout & Control Actions */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleSplitLayout(splitLayout === "horizontal" ? "vertical" : "horizontal")}
            className="h-7 px-2 text-xs text-neutral-300 hover:text-white hidden sm:flex items-center gap-1"
            title={splitLayout === "horizontal" ? "Switch to Vertical Split" : "Switch to Horizontal Split"}
          >
            {splitLayout === "horizontal" ? (
              <Rows className="h-3.5 w-3.5 text-indigo-400" />
            ) : (
              <Columns className="h-3.5 w-3.5 text-indigo-400" />
            )}
            <span className="text-[10px] font-medium uppercase">{splitLayout === "horizontal" ? "Stack" : "Split"}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.open(currentUrl, "_blank")}
            className="h-7 w-7 p-0 rounded-md text-neutral-300 hover:text-white"
            title="Open in new browser tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 rounded-md text-neutral-300 hover:text-destructive"
              title="Close Webview"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-1 px-3 py-1 bg-[#141416] border-b border-white/5 overflow-x-auto text-[11px] scrollbar-none shrink-0">
        <span className="text-[10px] text-neutral-500 font-medium mr-1 uppercase tracking-wider">Quick:</span>
        {QUICK_LINKS.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={() => navigateTo(link.url)}
            className="px-2 py-0.5 rounded-md hover:bg-white/10 border border-transparent hover:border-white/10 transition-all text-neutral-400 hover:text-white whitespace-nowrap text-[10px]"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Parallel Agent Assist Bar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/40 border-b border-indigo-500/20 overflow-x-auto text-xs shrink-0 scrollbar-none">
        <div className="flex items-center gap-1 text-indigo-300 font-semibold text-[11px] mr-1 shrink-0">
          <Sparkles className="size-3.5 text-amber-300" />
          <span>Ask Agent:</span>
        </div>
        <button
          type="button"
          onClick={() => triggerAgentAction("find_jobs")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 hover:text-white text-[10px] font-medium transition-all shrink-0 shadow-xs"
        >
          <Briefcase className="size-3 text-indigo-300" />
          <span>Find Jobs on this Page</span>
        </button>
        <button
          type="button"
          onClick={() => triggerAgentAction("extract_desc")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 hover:text-white text-[10px] font-medium transition-all shrink-0 shadow-xs"
        >
          <FileText className="size-3 text-sky-300" />
          <span>Extract Job Requirements</span>
        </button>
        <button
          type="button"
          onClick={() => triggerAgentAction("match_resume")}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/30 text-emerald-200 hover:text-white text-[10px] font-medium transition-all shrink-0 shadow-xs"
        >
          <Sparkles className="size-3 text-emerald-300" />
          <span>Match with My Resume</span>
        </button>
      </div>

      {/* Inspector Mode Banner */}
      {isInspectorMode && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-purple-950/80 border-b border-purple-500/40 text-purple-200 text-xs shrink-0 animate-pulse">
          <div className="flex items-center gap-2">
            <Crosshair className="size-4 text-purple-400" />
            <span>
              <strong>Inspector Active:</strong> Hover and click any component or form on the webpage to ask Career AI to generate React code or autofill!
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={toggleInspectorMode}
            className="h-6 text-[11px] px-2 text-purple-300 hover:text-white hover:bg-purple-900/50"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Inspected Element AI Action Popover */}
      {inspectedElement && (
        <div
          style={{
            position: "absolute",
            left: `${inspectedElement.x}px`,
            top: `${inspectedElement.y}px`,
            zIndex: 45,
          }}
          className="flex flex-col gap-2 p-3 bg-[#18181b] text-white rounded-xl shadow-2xl border border-purple-500/40 animate-in fade-in zoom-in-95 duration-150 max-w-sm"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
            <span className="text-[11px] font-mono text-purple-400 font-semibold truncate">
              &lt;{inspectedElement.tag}&gt; Selected
            </span>
            <button
              type="button"
              onClick={() => setInspectedElement(null)}
              className="text-neutral-400 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              size="sm"
              onClick={() => handleGenerateReactComponent(inspectedElement.html, inspectedElement.text)}
              className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-start gap-1.5 rounded-lg"
            >
              <Code2 className="size-3.5 text-amber-300" />
              <span>Generate React Component</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => handleAutofillForm(inspectedElement.html, inspectedElement.text)}
              className="h-7 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 flex items-center justify-start gap-1.5 rounded-lg"
            >
              <Wand2 className="size-3.5 text-emerald-400" />
              <span>Fill / Assist with this Form</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                onInjectSnippet(
                  `From ${currentUrl}:\nAnalyze this selected UI element:\n\`\`\`html\n${inspectedElement.html.slice(0, 1500)}\n\`\`\`\nExplain its purpose and recommend how to use it.`,
                  currentUrl
                );
                setInspectedElement(null);
              }}
              className="h-7 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-neutral-300 flex items-center justify-start gap-1.5 rounded-lg"
            >
              <Sparkles className="size-3.5 text-sky-400" />
              <span>Ask AI About this Section</span>
            </Button>
          </div>
        </div>
      )}

      {/* Floating "Ask AI" Context Action Popover on Text Selection */}
      {selectedText && selectionPosition && !inspectedElement && (
        <div
          style={{
            position: "absolute",
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            zIndex: 40,
          }}
          className="flex items-center gap-1.5 p-1.5 bg-[#1c1c21] text-white rounded-xl shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-150"
        >
          <Button
            type="button"
            size="sm"
            onClick={() => handleAskAIAboutSelection("match")}
            className="h-6.5 text-[11px] px-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 rounded-lg"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            Match with Resume
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleAskAIAboutSelection("explain")}
            className="h-6.5 text-[11px] px-2 border-white/10 bg-white/5 hover:bg-white/10 text-neutral-200 rounded-lg"
          >
            Explain
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCopySelection}
            className="h-6.5 px-1.5 text-white/80 hover:text-white hover:bg-white/10 text-[10px] rounded-lg"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>
          <button
            type="button"
            onClick={() => {
              setSelectedText("");
              setSelectionPosition(null);
            }}
            className="text-neutral-400 hover:text-white p-1"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      {/* Web Content Area */}
      <div className="relative flex-1 w-full bg-[#0f0f12] overflow-hidden">
        {/* Shimmer Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0f0f12]/85 backdrop-blur-xs text-neutral-300 pointer-events-none"
            >
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#1c1c21] border border-white/10 shadow-xl">
                <div className="size-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                <span className="text-xs font-medium tracking-wide">Navigating securely...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Visual Agent Cursor Simulation */}
        <AnimatePresence>
          {agentCursor.isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: agentCursor.x, y: agentCursor.y }}
              animate={{ opacity: 1, scale: 1, x: agentCursor.x, y: agentCursor.y }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", damping: 24, stiffness: 180 }}
              className="pointer-events-none absolute z-50 flex items-start gap-1.5"
              style={{ left: 0, top: 0 }}
            >
              <div className="relative">
                <svg
                  className="size-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(99,102,241,0.9)]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.879z" />
                </svg>

                {agentCursor.isClicking && (
                  <motion.div
                    initial={{ scale: 0.4, opacity: 1 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    transition={{ duration: 0.7, repeat: 2 }}
                    className="absolute -left-2 -top-2 size-10 rounded-full border-2 border-indigo-400 bg-indigo-500/30"
                  />
                )}
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#18181b]/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md text-white text-[11px] font-semibold whitespace-nowrap animate-pulse">
                <Bot className="size-3.5 text-indigo-400" />
                <span>{agentCursor.actionText}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isCloudMode ? (
          <div className="w-full h-full relative bg-white flex justify-center items-center overflow-hidden">
            {cloudImageBase64 ? (
              <img
                ref={imgRef}
                src={`data:image/jpeg;base64,${cloudImageBase64}`}
                alt="Cloud Browser View"
                onClick={onCloudClick}
                onWheel={onCloudScroll}
                tabIndex={0}
                onKeyDown={(e) => {
                  e.preventDefault();
                  // Basic key mapping
                  const key = e.key.length === 1 ? e.key : e.key;
                  handleCloudAction({ action: "key", key });
                }}
                className="w-full h-full object-contain cursor-crosshair focus:outline-none"
              />
            ) : (
              <div className="flex w-full h-full items-center justify-center text-neutral-400">
                {cloudError ? (
                  <span className="text-red-400">{cloudError}</span>
                ) : (
                  <span>Initializing cloud session...</span>
                )}
              </div>
            )}
          </div>
        ) : iframeBlocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0f0f12] text-neutral-300 gap-5 p-8">
            <div className="flex flex-col items-center gap-3 max-w-md text-center">
              <div className="text-4xl">🔒</div>
              <h3 className="text-sm font-semibold text-white">Site cannot be embedded</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                <strong className="text-neutral-200">{urlInput}</strong> uses security headers
                {iframeBlockReason ? <span className="font-mono text-amber-400"> ({iframeBlockReason})</span> : ""} that
                prevent embedding in any in-app browser — including Chrome extensions. This is enforced by the browser itself.
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setIsCloudMode(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all"
                >
                  <Cloud className="size-3.5" /> Try Cloud Mode
                </button>
                <button
                  type="button"
                  onClick={() => window.open(urlInput.startsWith("http") ? urlInput : `https://${urlInput}`, "_blank")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                >
                  <ExternalLink className="size-3.5" /> Open in New Tab
                </button>
                <button
                  type="button"
                  onClick={() => { setIframeBlocked(false); navigateTo("https://www.google.com"); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-all"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            onLoad={(e) => {
              setIsLoading(false);
              // Detect if iframe loaded a blocked/error page
              try {
                const iframe = e.currentTarget as HTMLIFrameElement;
                if (iframe.contentDocument) {
                  const title = iframe.contentDocument.title;
                  // Blocked pages have empty or error titles when cross-origin
                }
              } catch {
                // Cross-origin: normal, site loaded fine
              }
            }}
            onError={() => {
              setIsLoading(false);
              setIframeBlocked(true);
            }}
            allow="autoplay; camera; microphone; fullscreen; payment; geolocation"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-modals"
            className="w-full h-full border-0 bg-white"
            title="Chromium In-App Webview"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      {/* JSONL Action Stream Drawer */}
      <Sheet open={showJsonlSheet} onOpenChange={setShowJsonlSheet}>
        <SheetContent side="right" className="w-[360px] sm:w-[480px] bg-[#0f0f12] text-neutral-200 p-4 font-mono text-xs">
          <SheetHeader className="mb-3 space-y-1">
            <SheetTitle className="text-sm text-white flex items-center gap-2">
              <Terminal className="size-4 text-emerald-400" />
              Chromium MCP Action Log (JSONL)
            </SheetTitle>
            <SheetDescription className="text-[11px] text-neutral-400">
              Live protocol commands executed by autonomous AI agent and user cursor handoffs.
            </SheetDescription>
          </SheetHeader>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider">{agentLogs.length} Events Logged</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopyLogs}
              className="h-6 text-[10px] px-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              {copiedLogs ? <Check className="size-3 text-emerald-400 mr-1" /> : <Copy className="size-3 mr-1" />}
              {copiedLogs ? "Copied" : "Copy JSONL"}
            </Button>
          </div>

          <div className="p-3 rounded-xl bg-black border border-white/10 text-emerald-400 max-h-[70vh] overflow-y-auto space-y-2 text-[11px]">
            {agentLogs.map((log) => (
              <div key={log.step} className="p-2 rounded bg-neutral-900/60 border border-white/5">
                <span className="text-neutral-500">[{log.timestamp}]</span>{" "}
                <span className="text-indigo-400 font-semibold">{log.action.toUpperCase()}</span>{" "}
                <span className="text-neutral-300">{log.desc || log.url}</span>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
