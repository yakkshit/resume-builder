"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Lightbulb,
  FileText,
  ChevronDown,
  Check,
  Sparkles,
  Zap,
  Brain,
  Bolt,
  Github,
  ArrowUp,
  Square,
} from "lucide-react";

// TYPES
interface Model {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

// FIGMA ICON
function FigmaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M8 24C10.208 24 12 22.208 12 20V16H8C5.792 16 4 17.792 4 20C4 22.208 5.792 24 8 24Z"
        fill="currentColor"
      />
      <path
        d="M4 12C4 9.792 5.792 8 8 8H12V16H8C5.792 16 4 14.208 4 12Z"
        fill="currentColor"
      />
      <path d="M4 4C4 1.792 5.792 0 8 0H12V8H8C5.792 8 4 6.208 4 4Z" fill="currentColor" />
      <path d="M12 0H16C18.208 0 20 1.792 20 4C20 6.208 18.208 8 16 8H12V0Z" fill="currentColor" />
      <path
        d="M20 12C20 14.208 18.208 16 16 16C13.792 16 12 14.208 12 12C12 9.792 13.792 8 16 8C18.208 8 20 9.792 20 12Z"
        fill="currentColor"
      />
    </svg>
  );
}

// MODEL SELECTOR - uses project's models
export interface BoltModel {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

export function ModelSelector({
  models,
  selectedModelId,
  onModelChange,
  className,
}: {
  models: BoltModel[];
  selectedModelId: string;
  onModelChange?: (model: BoltModel) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = models.find((m) => m.id === selectedModelId) || models[0];

  const handleSelect = (model: BoltModel) => {
    setIsOpen(false);
    onModelChange?.(model);
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95"
      >
        {selected.icon}
        <span>{selected.name}</span>
        <ChevronDown
          className={`size-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} aria-hidden />
          <div className="absolute bottom-full left-0 mb-2 z-50 min-w-[220px] max-h-[min(280px,70vh)] overflow-y-auto rounded-xl border border-border bg-popover/95 text-popover-foreground shadow-lg backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 dark:border-white/10 dark:bg-[#1a1a1e]/95 dark:shadow-black/50">
            <div className="p-1.5">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Select Model
              </div>
              {models.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleSelect(model)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-all duration-150 ${
                    selected.id === model.id
                      ? "bg-muted text-foreground dark:bg-white/10 dark:text-white"
                      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground dark:text-[#a0a0a5] dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <div className="flex-shrink-0">{model.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{model.name}</span>
                      {model.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            model.badge === "Pro"
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{model.description}</span>
                  </div>
                  {selected.id === model.id && (
                    <Check className="size-4 text-blue-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// CHAT INPUT
export interface AttachedFile {
  name: string;
  type: string;
  data: string; // base64 or text
  isImage?: boolean;
}

export interface BoltChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  isLoading?: boolean;
  onStop?: () => void;
  models: BoltModel[];
  selectedModelId: string;
  onModelChange: (model: BoltModel) => void;
  compact?: boolean;
  attachedFiles?: AttachedFile[];
  /** Prefer `setState` so multi-file uploads merge correctly (no stale closure). */
  onFilesChange?: React.Dispatch<React.SetStateAction<AttachedFile[]>>;
}

export function BoltChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = "What do you want to build?",
  isLoading = false,
  onStop,
  models,
  selectedModelId,
  onModelChange,
  compact = false,
  attachedFiles = [],
  onFilesChange,
}: BoltChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const minH = compact ? 56 : 80;

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !onFilesChange) return;
    const pdfOnly = Array.from(files).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfOnly.length === 0) {
      e.target.value = "";
      return;
    }
    const newItems: AttachedFile[] = new Array(pdfOnly.length);
    let pending = pdfOnly.length;

    const finishOne = () => {
      pending -= 1;
      if (pending === 0) {
        const ok = newItems.filter((x): x is AttachedFile => x != null);
        onFilesChange((prev) => [...prev, ...ok]);
      }
    };

    pdfOnly.forEach((f, index) => {
      const r = new FileReader();
      r.onload = () => {
        const raw = String(r.result);
        newItems[index] = {
          name: f.name,
          type: f.type || "application/pdf",
          data: raw.includes("base64,") ? raw.split("base64,")[1] ?? raw : raw,
          isImage: false,
        };
        finishOne();
      };
      r.onerror = () => {
        finishOne();
      };
      r.readAsDataURL(f);
    });
    e.target.value = "";
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, compact ? 120 : 200)}px`;
    }
  }, [value, compact]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && (value.trim() || attachedFiles.length > 0)) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className="relative mx-auto w-full max-w-[min(100%,48rem)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handlePdfUpload}
      />
      <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-b from-white/10 to-transparent dark:from-white/[0.06]" />
      <div className="relative rounded-[28px] border border-neutral-200/90 bg-white text-neutral-900 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.04] dark:border-neutral-700 dark:bg-[#2f2f2f] dark:text-neutral-100 dark:ring-white/[0.08] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border/60 px-3 py-2.5 dark:border-white/10">
            {attachedFiles.map((f, i) => (
              <span
                key={`${f.name}-${i}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-primary/35 bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm dark:border-[#1488fc]/35 dark:bg-[#1488fc]/12 dark:text-white/95"
              >
                <FileText className="size-3.5 shrink-0 text-[#d97757] dark:text-[#7ab8ff]" aria-hidden />
                <span className="min-w-0 truncate" title={f.name}>
                  {f.name}
                </span>
                {onFilesChange && (
                  <button
                    type="button"
                    onClick={() => onFilesChange((prev) => prev.filter((_, j) => j !== i))}
                    className="shrink-0 rounded-md px-1 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                    aria-label="Remove"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            className={cn(
              "w-full resize-none bg-transparent text-[15px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 dark:placeholder:text-neutral-500",
              compact ? "px-3.5 pt-2.5 pb-1.5 max-h-[96px]" : "px-5 pt-5 pb-3 max-h-[200px]"
            )}
            style={{ minHeight: compact ? 36 : 80, height: compact ? 36 : 80 }}
          />
        </div>

        <div className={cn("flex items-center justify-between pt-1", compact ? "px-2.5 pb-1.5" : "px-3 pb-3")}>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative flex items-center justify-center rounded-full border border-transparent text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-white",
                compact ? "size-8" : "size-9"
              )}
              aria-label={attachedFiles.length ? `${attachedFiles.length} PDF(s) attached` : "Attach PDF resume"}
              title="PDF only"
            >
              <Plus className="size-5" />
              {attachedFiles.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-0.5 text-[10px] font-bold text-white dark:bg-[#10a37f]">
                  {attachedFiles.length}
                </span>
              )}
            </button>
            <ModelSelector
              models={models}
              selectedModelId={selectedModelId}
              onModelChange={onModelChange}
            />
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 rounded-full text-xs font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground dark:hover:bg-white/5 dark:hover:text-white",
                compact ? "px-2 py-1.5" : "px-3 py-2"
              )}
            >
              <Lightbulb className="size-4" />
              <span className="hidden sm:inline">Plan</span>
            </button>

            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                className={cn(
                  "flex items-center gap-2 rounded-full bg-rose-600 text-sm font-medium text-white transition-all hover:bg-rose-500 active:scale-95",
                  compact ? "px-3 py-1.5" : "px-4 py-2"
                )}
              >
                <span className="hidden sm:inline">Stop</span>
                <Square className="size-3.5 sm:size-4" strokeWidth={2.5} aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!value.trim() && attachedFiles.length === 0}
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-neutral-900",
                  "sm:size-10"
                )}
                aria-label="Send"
              >
                <ArrowUp className="size-5" strokeWidth={2.25} />
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

// Ray Background (light + dark)
export function RayBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 h-full w-full select-none overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-sky-50/90 via-background to-muted/30 dark:hidden" />
      <div className="absolute inset-0 hidden bg-[#0f0f0f] dark:block" />
      <div
        className="absolute left-1/2 hidden h-[1800px] w-[4000px] -translate-x-1/2 dark:block sm:w-[6000px]"
        style={{
          background: `radial-gradient(circle at center 800px, rgba(20, 136, 252, 0.8) 0%, rgba(20, 136, 252, 0.35) 14%, rgba(20, 136, 252, 0.18) 18%, rgba(20, 136, 252, 0.08) 22%, rgba(17, 17, 20, 0.2) 25%)`,
        }}
      />
      <div
        className="absolute left-1/2 top-[175px] hidden h-[1600px] w-[1600px] dark:block sm:top-1/2 sm:h-[2865px] sm:w-[3043px]"
        style={{ transform: "translate(-50%) rotate(180deg)" }}
      >
        <div
          className="absolute w-full h-full rounded-full -mt-[13px]"
          style={{
            background:
              "radial-gradient(43.89% 25.74% at 50.02% 97.24%, #111114 0%, #0f0f0f 100%)",
            border: "16px solid white",
            transform: "rotate(180deg)",
            zIndex: 5,
          }}
        />
        <div
          className="absolute w-full h-full rounded-full bg-[#0f0f0f] -mt-[11px]"
          style={{ border: "23px solid #b7d7f6", transform: "rotate(180deg)", zIndex: 4 }}
        />
        <div
          className="absolute w-full h-full rounded-full bg-[#0f0f0f] -mt-[8px]"
          style={{ border: "23px solid #8fc1f2", transform: "rotate(180deg)", zIndex: 3 }}
        />
        <div
          className="absolute w-full h-full rounded-full bg-[#0f0f0f] -mt-[4px]"
          style={{ border: "23px solid #64acf6", transform: "rotate(180deg)", zIndex: 2 }}
        />
        <div
          className="absolute w-full h-full rounded-full bg-[#0f0f0f]"
          style={{
            border: "20px solid #1172e2",
            boxShadow: "0 -15px 24.8px rgba(17, 114, 226, 0.6)",
            transform: "rotate(180deg)",
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

// ANNOUNCEMENT BADGE
export function AnnouncementBadge({
  text,
  href,
}: {
  text: string;
  href?: string;
}) {
  const content = (
    <>
      <span
        className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none opacity-70 mix-blend-overlay"
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.15) 0%, transparent 70%)",
        }}
      />
      <span
        className="absolute -top-px left-1/2 -translate-x-1/2 h-[2px] w-[100px] opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(37, 119, 255, 0.8) 20%, rgba(126, 93, 225, 0.8) 50%, rgba(59, 130, 246, 0.8) 80%, transparent 100%)",
          filter: "blur(0.5px)",
        }}
      />
      <Bolt className="size-4 relative z-10 text-white" />
      <span className="relative z-10 text-white font-medium">{text}</span>
    </>
  );

  const className =
    "relative inline-flex items-center gap-2 px-5 py-2 min-h-[40px] rounded-full text-sm overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer";
  const style = {
    background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
    backdropFilter: "blur(20px) saturate(140%)",
    boxShadow:
      "inset 0 1px rgba(255,255,255,0.2), inset 0 -1px rgba(0,0,0,0.1), 0 8px 32px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.08)",
  };

  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style}>
      {content}
    </a>
  ) : (
    <span className={className} style={style}>
      {content}
    </span>
  );
}

// IMPORT BUTTONS
export function ImportButtons({ onImport }: { onImport?: (source: string) => void }) {
  return (
    <div className="flex items-center gap-4 justify-center flex-wrap">
      <span className="text-sm text-[#6a6a6f]">or import from</span>
      <div className="flex gap-2">
        {[
          { id: "figma", name: "Figma", icon: <FigmaIcon className="size-4" /> },
          { id: "github", name: "GitHub", icon: <Github className="size-4" /> },
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onImport?.(option.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-[#0f0f0f] hover:bg-[#1a1a1e] text-[#8a8a8f] hover:text-white transition-all duration-200 active:scale-95"
          >
            {option.icon}
            <span>{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
