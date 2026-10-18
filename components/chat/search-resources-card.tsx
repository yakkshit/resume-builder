"use client";

import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WebSearchResponse, WebSearchResult } from "@/lib/web-search";

interface SearchResourcesCardProps {
  query: string;
  domains?: string[];
  resultsCount?: number;
  results?: WebSearchResult[];
  isLoading?: boolean;
  onOpenSourcesDrawer?: () => void;
  className?: string;
}

export function SearchResourcesCard({
  query,
  domains = [],
  resultsCount = 0,
  results = [],
  isLoading = false,
  onOpenSourcesDrawer,
  className,
}: SearchResourcesCardProps) {
  const [isExpanded, setIsExpanded] = useState(isLoading);

  const displayDomains = domains.length > 0 
    ? domains 
    : (results.length > 0 ? Array.from(new Set(results.map((r) => r.domain))) : []);

  const domainsLabel = displayDomains.length > 0 ? ` [${displayDomains.slice(0, 3).join(", ")}]` : "";

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-white/10 bg-[#161619] shadow-xl overflow-hidden transition-all duration-200",
        className
      )}
    >
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => {
          if (!isLoading && onOpenSourcesDrawer) {
            onOpenSourcesDrawer();
          } else {
            setIsExpanded((prev) => !prev);
          }
        }}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors group cursor-pointer"
        aria-label="Toggle search resources"
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <Search className="size-4 text-neutral-400 shrink-0 group-hover:text-white transition-colors" />
          <span className="text-xs sm:text-sm font-medium text-neutral-200 truncate">
            {query}
            {domainsLabel && (
              <span className="text-neutral-500 font-normal ml-1 hidden sm:inline">
                {domainsLabel}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {!isLoading && resultsCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Check className="size-3.5 stroke-[2.5]" />
              <span>{resultsCount} results</span>
            </div>
          )}

          {/* Favicons preview of top domains */}
          {displayDomains.length > 0 && (
            <div className="flex items-center -space-x-1">
              {displayDomains.slice(0, 2).map((dom) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={dom}
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(dom)}&sz=32`}
                  alt={dom}
                  className="size-4 rounded-full border border-white/10 bg-neutral-800"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
              ))}
            </div>
          )}

          {isExpanded ? (
            <ChevronUp className="size-4 text-neutral-400 group-hover:text-white transition-colors" />
          ) : (
            <ChevronDown className="size-4 text-neutral-400 group-hover:text-white transition-colors" />
          )}
        </div>
      </button>

      {/* Expanded/Loading Body (Image 1 Skeletons or Quick Cards) */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-white/5 space-y-3">
          {isLoading ? (
            <div>
              {/* Skeleton Cards Row (Matching Image 1) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-white/5 bg-[#1a1a1e] p-2.5 space-y-2.5 animate-pulse"
                  >
                    {/* Top thumbnail placeholder */}
                    <div className="h-16 w-full rounded-lg bg-white/[0.05]" />
                    {/* Title placeholder */}
                    <div className="h-2.5 w-3/4 rounded bg-white/[0.07]" />
                    {/* Snippet placeholder lines */}
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded bg-white/[0.04]" />
                      <div className="h-2 w-4/5 rounded bg-white/[0.04]" />
                    </div>
                    {/* Domain pill placeholder */}
                    <div className="h-2 w-1/3 rounded-full bg-white/[0.06]" />
                  </div>
                ))}
              </div>

              {/* Pulsing dots indicator */}
              <div className="flex items-center gap-1.5 pt-3 pl-1 text-neutral-500">
                <span className="size-1.5 rounded-full bg-neutral-400 animate-ping" />
                <span className="size-1.5 rounded-full bg-neutral-400 animate-ping delay-150" />
              </div>
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className="flex items-center justify-between pb-2 text-xs text-neutral-400">
                <span>Sources Preview</span>
                {onOpenSourcesDrawer && (
                  <button
                    type="button"
                    onClick={onOpenSourcesDrawer}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    View all in sidebar <ExternalLink className="size-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
                {results.slice(0, 4).map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-xl border border-white/5 bg-[#1b1b1f] hover:bg-[#232328] hover:border-white/10 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={r.favicon || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(r.domain)}&sz=32`}
                          alt=""
                          className="size-3.5 rounded shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="text-[11px] font-medium text-neutral-400 group-hover:text-neutral-300 truncate">
                          {r.domain}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-white line-clamp-1">
                        {r.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {r.snippet}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-1">No search results available.</p>
          )}
        </div>
      )}
    </div>
  );
}
