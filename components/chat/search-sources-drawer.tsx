"use client";

import React from "react";
import { Search, X, Check, BookOpen, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebSearchResult } from "@/lib/web-search";

interface SearchSourcesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  results: WebSearchResult[];
  onFeedbackClick?: () => void;
  className?: string;
}

export function SearchSourcesDrawer({
  isOpen,
  onClose,
  query,
  results,
  onFeedbackClick,
  className,
}: SearchSourcesDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex pointer-events-none animate-in fade-in duration-200">
      {/* Mobile background backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm sm:hidden pointer-events-auto"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right Drawer Panel */}
      <aside
        className={cn(
          "relative ml-auto w-full sm:w-96 md:w-[440px] h-full border-l border-white/10 bg-[#121215] flex flex-col z-50 pointer-events-auto shadow-2xl shrink-0 select-none animate-in slide-in-from-right duration-300",
          className
        )}
      >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#16161a]">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-white">Search</h2>
        </div>

        <div className="flex items-center gap-2">
          {onFeedbackClick && (
            <button
              type="button"
              onClick={onFeedbackClick}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors"
            >
              Feedback
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close search sources drawer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Query Search Chip Header (Matching Image 2) */}
      <div className="p-3.5 border-b border-white/5 bg-[#141418]">
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#1d1d23] border border-white/10 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Search className="size-3.5 text-neutral-400 shrink-0" />
            <span className="font-medium text-neutral-200 truncate">
              {query || "Search Query"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
            <Check className="size-3.5 stroke-[2.5]" />
            <span>{results.length} results</span>
          </div>
        </div>
      </div>

      {/* Section Header: Sources */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-[#121215]">
        <BookOpen className="size-3.5 text-neutral-400" />
        <span>Sources</span>
      </div>

      {/* Free Scroll List of Source Cards (Completely Hidden Scrollbar) */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-6 space-y-2.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {results.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 text-xs">
            No live sources retrieved yet.
          </div>
        ) : (
          results.map((item, idx) => (
            <a
              key={item.id || idx}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="block p-3.5 rounded-2xl border border-white/5 bg-[#19191e] hover:bg-[#202026] hover:border-white/15 transition-all group"
            >
              <div className="flex items-start gap-3">
                {/* Domain Favicon / Logo */}
                <div className="size-6 rounded-full bg-[#25252b] border border-white/10 flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.domain)}&sz=64`}
                    alt=""
                    className="size-4 rounded-full"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <h3 className="text-xs font-semibold text-neutral-200 group-hover:text-white transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  {item.snippet && (
                    <blockquote className="text-[11px] text-neutral-400 border-l-2 border-neutral-700 pl-2 line-clamp-3 leading-relaxed">
                      &gt; {item.snippet}
                    </blockquote>
                  )}

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[10px] text-neutral-500 hover:text-neutral-400 flex items-center gap-1 truncate">
                      {item.domain}
                      <ExternalLink className="size-2.5 opacity-60" />
                    </span>
                    {item.provider && (
                      <span className="text-[9px] uppercase tracking-wider text-neutral-600 bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {item.provider}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </aside>
    </div>
  );
}
