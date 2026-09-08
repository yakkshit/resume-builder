"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Search,
  Maximize2,
  Minimize2,
  Columns,
  Rows,
  X,
  Copy,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ChromiumWebviewProps {
  initialUrl?: string;
  onClose?: () => void;
  onInjectSnippet: (text: string, sourceUrl?: string) => void;
  splitLayout: "horizontal" | "vertical" | "fullscreen";
  onToggleSplitLayout: (mode: "horizontal" | "vertical" | "fullscreen") => void;
}

const QUICK_LINKS = [
  { label: "Google Jobs", url: "https://www.google.com/search?q=senior+software+engineer+jobs&ibp=htl;jobs" },
  { label: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs" },
  { label: "Indeed", url: "https://www.indeed.com" },
  { label: "Hacker News Jobs", url: "https://news.ycombinator.com/jobs" },
  { label: "GitHub Careers", url: "https://github.com/about/careers" },
];

export function ChromiumWebview({
  initialUrl = "https://www.google.com/search?q=senior+ai+engineer+job+description",
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
  const [selectedText, setSelectedText] = useState("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const navigateTo = (target: string) => {
    let finalUrl = target.trim();
    if (!finalUrl) return;

    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      if (finalUrl.includes(".") && !finalUrl.includes(" ")) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }

    setUrlInput(finalUrl);
    setCurrentUrl(finalUrl);
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), finalUrl]);
    setHistoryIndex((prev) => prev + 1);
    setIsLoading(true);
    setSelectedText("");
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setUrlInput(prevUrl);
      setCurrentUrl(prevUrl);
      setIsLoading(true);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setUrlInput(nextUrl);
      setCurrentUrl(nextUrl);
      setIsLoading(true);
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      iframeRef.current.src = `/api/webview/proxy?url=${encodeURIComponent(currentUrl)}`;
    }
  };

  // Listen for selection inside the web container
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      const text = selection.toString().trim();
      setSelectedText(text);

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        setSelectionPosition({
          x: Math.max(10, rect.left - containerRect.left + rect.width / 2 - 80),
          y: Math.max(10, rect.top - containerRect.top - 40),
        });
      }
    } else {
      setSelectedText("");
      setSelectionPosition(null);
    }
  };

  const handleAskAIAboutSelection = () => {
    if (!selectedText) return;
    onInjectSnippet(
      `From ${currentUrl}:\n"${selectedText}"\n\nAnalyze this job description snippet or text and explain how to align my resume for it.`,
      currentUrl
    );
    setSelectedText("");
    setSelectionPosition(null);
  };

  const handleCopySelection = () => {
    if (!selectedText) return;
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const proxySrc = `/api/webview/proxy?url=${encodeURIComponent(currentUrl)}`;

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className="relative flex flex-col h-full w-full bg-background border-l border-border/80 overflow-hidden select-text"
    >
      {/* Top Browser Control Bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/40 border-b border-border/60 backdrop-blur-md">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="h-7 w-7 p-0 rounded-md"
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
            className="h-7 w-7 p-0 rounded-md"
            aria-label="Forward"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReload}
            className="h-7 w-7 p-0 rounded-md"
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
          <Globe className="h-3.5 w-3.5 absolute left-2.5 text-muted-foreground shrink-0 pointer-events-none" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Search web or enter URL (e.g. google.com/jobs)..."
            className="h-7 text-xs pl-8 pr-7 bg-background/80 border-border/70 rounded-md"
          />
          {isLoading && (
            <div className="absolute right-2.5 h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </form>

        {/* Layout & Control Actions */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onToggleSplitLayout(splitLayout === "horizontal" ? "vertical" : "horizontal")}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hidden sm:flex items-center gap-1"
            title={splitLayout === "horizontal" ? "Switch to Top/Bottom Split" : "Switch to Left/Right Split"}
          >
            {splitLayout === "horizontal" ? (
              <Rows className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Columns className="h-3.5 w-3.5 text-primary" />
            )}
            <span className="text-[10px] font-medium uppercase">{splitLayout === "horizontal" ? "Stack" : "Split"}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.open(currentUrl, "_blank")}
            className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-foreground"
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
              className="h-7 w-7 p-0 rounded-md text-muted-foreground hover:text-destructive"
              title="Close Webview"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Bookmarks Bar */}
      <div className="flex items-center gap-1 px-3 py-1 bg-muted/20 border-b border-border/40 overflow-x-auto text-[11px] scrollbar-none">
        <span className="text-[10px] text-muted-foreground font-medium mr-1 uppercase tracking-wider">Quick:</span>
        {QUICK_LINKS.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={() => navigateTo(link.url)}
            className="px-2 py-0.5 rounded-md hover:bg-background/80 border border-transparent hover:border-border/60 transition-all text-muted-foreground hover:text-foreground whitespace-nowrap text-[10px]"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Floating "Ask AI" Context Action Popover on Text Selection */}
      {selectedText && selectionPosition && (
        <div
          style={{
            position: "absolute",
            left: `${selectionPosition.x}px`,
            top: `${selectionPosition.y}px`,
            zIndex: 40,
          }}
          className="flex items-center gap-1.5 p-1 bg-neutral-900 dark:bg-neutral-800 text-white rounded-lg shadow-xl border border-white/20 animate-in fade-in zoom-in-95 duration-150"
        >
          <Button
            type="button"
            size="sm"
            onClick={handleAskAIAboutSelection}
            className="h-6 text-[11px] px-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 rounded"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            Ask Career AI
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCopySelection}
            className="h-6 px-1.5 text-white/80 hover:text-white hover:bg-white/10 text-[10px] rounded"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </Button>
        </div>
      )}

      {/* Web Content Area */}
      <div className="relative flex-1 w-full bg-white dark:bg-neutral-950 overflow-hidden">
        <iframe
          ref={iframeRef}
          src={proxySrc}
          onLoad={() => setIsLoading(false)}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          className="w-full h-full border-0 bg-background"
          title="Chromium In-App Webview"
        />
      </div>
    </div>
  );
}
