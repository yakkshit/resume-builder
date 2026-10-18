"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Database,
  Check,
  Copy,
  ExternalLink,
  Info,
  ChevronRight,
  TrendingUp,
  Network,
  RotateCcw,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { VectorRagQueryResult, SimilaritySearchResult } from "@/lib/vector-rag/types";

interface VectorRagViewerProps {
  data?: Partial<VectorRagQueryResult> & {
    onSwitchToGraph?: () => void;
  };
  onDockToStage?: () => void;
  onSendMessage?: (text: string) => void;
  className?: string;
}

export function VectorRagViewer({
  data,
  onDockToStage,
  onSendMessage,
  className,
}: VectorRagViewerProps) {
  const [copied, setCopied] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<SimilaritySearchResult | null>(
    data?.retrievedChunks?.[0] || null
  );

  const query = data?.query || "Candidate skills and career qualifications";
  const chunks = data?.retrievedChunks || [];
  const avgConfidence = data?.averageConfidence ?? 88;
  const rating = data?.confidenceRating || (avgConfidence >= 85 ? "Very High" : "High");
  const insights = data?.insights || [];

  const handleCopySummary = () => {
    if (data?.summary) {
      navigator.clipboard.writeText(data.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAlternateToGraph = () => {
    if (onSendMessage) {
      onSendMessage(`Alternate to Neo4j Graphical RAG: Explore the multi-hop career graph and relationships for "${query}".`);
    } else if (data?.onSwitchToGraph) {
      data.onSwitchToGraph();
    }
  };

  const getConfidenceColor = (conf: number) => {
    if (conf >= 88) return "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
    if (conf >= 75) return "text-teal-400 bg-teal-500/15 border-teal-500/30";
    if (conf >= 55) return "text-amber-400 bg-amber-500/15 border-amber-500/30";
    return "text-rose-400 bg-rose-500/15 border-rose-500/30";
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0f0f14] text-white overflow-hidden shadow-2xl flex flex-col",
        className || "h-[540px]"
      )}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-[#14141b]/90">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-teal-500/20 border border-indigo-500/30 flex items-center justify-center text-teal-300 shadow-sm">
            <Layers className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">LangChain Vector RAG</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                Cosine Similarity Search
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate max-w-[280px] sm:max-w-md">
              Grounding: <span className="text-neutral-200 font-medium">"{query}"</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Alternating Engine Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleAlternateToGraph}
            className="h-7 px-2.5 text-[11px] bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)] rounded-lg transition-all"
            title="Alternate between LangChain Vector RAG and Neo4j Graphical RAG"
          >
            <Network className="size-3 text-emerald-400" />
            <span className="font-medium">Alternate to Graph RAG</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopySummary}
            className="h-7 px-2 text-[11px] text-neutral-400 hover:text-white"
          >
            {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          </Button>
        </div>
      </div>

      {/* Confidence & Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-[#121218]">
        {/* Metric 1: Confidence Score */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="size-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold text-xs">
            {avgConfidence}%
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
              Match Confidence
            </div>
            <div className="text-xs font-semibold text-white flex items-center gap-1">
              {rating}
              <TrendingUp className="size-3 text-teal-400" />
            </div>
          </div>
        </div>

        {/* Metric 2: Retrieved Chunks */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="size-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
            {chunks.length}
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
              Vector Chunks
            </div>
            <div className="text-xs font-semibold text-white">Top-K Scored</div>
          </div>
        </div>

        {/* Metric 3: Top Cosine Score */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="size-8 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400 font-mono font-bold text-xs">
            {(data?.topScore ?? 0.88).toFixed(2)}
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
              Top Similarity
            </div>
            <div className="text-xs font-semibold text-white">Cosine Vector</div>
          </div>
        </div>

        {/* Metric 4: Alternating Engine */}
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Zap className="size-4" />
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
              Engine Redundancy
            </div>
            <div className="text-xs font-semibold text-emerald-300">Neo4j Backup Ready</div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
        {/* Left: Ranked Vector Chunks List */}
        <div className="md:col-span-5 overflow-y-auto p-3 space-y-2 no-scrollbar bg-[#0d0d12]">
          <div className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider px-1">
            Ranked Semantic Chunks ({chunks.length})
          </div>

          {chunks.map((item, idx) => {
            const isSelected = selectedChunk?.chunk.id === item.chunk.id;
            return (
              <div
                key={item.chunk.id || idx}
                onClick={() => setSelectedChunk(item)}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none group",
                  isSelected
                    ? "bg-teal-500/[0.12] border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
                    : "bg-[#16161e]/70 border-white/[0.06] hover:bg-[#1a1a24] hover:border-white/15"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-white/[0.06] text-neutral-300 border border-white/10">
                    #{item.rank}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border",
                      getConfidenceColor(item.confidencePercent)
                    )}
                  >
                    {item.confidencePercent}% Confidence
                  </span>
                </div>

                <div className="text-xs font-semibold text-white group-hover:text-teal-200 transition-colors line-clamp-1">
                  {item.chunk.metadata.title}
                </div>

                <div className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                  {item.chunk.text}
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.06] text-[10px] text-neutral-500 font-mono">
                  <span>{item.chunk.category}</span>
                  <span>Sim: {item.score}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Detailed Chunk Inspector & Insights */}
        <div className="md:col-span-7 flex flex-col h-full overflow-hidden bg-[#101017]">
          {selectedChunk ? (
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">
                      {selectedChunk.chunk.metadata.title}
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-neutral-300">
                      {selectedChunk.chunk.category}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Source: {selectedChunk.chunk.source} • Rank #{selectedChunk.rank}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-teal-400">
                    {selectedChunk.confidencePercent}% Match
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Cosine: {selectedChunk.score}
                  </div>
                </div>
              </div>

              {/* Passage Full Content */}
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider">
                  Retrieved Vector Passage
                </div>
                <div className="p-3.5 rounded-xl bg-[#09090d] border border-white/10 font-mono text-xs text-neutral-200 leading-relaxed whitespace-pre-wrap selection:bg-teal-500/30">
                  {selectedChunk.chunk.text}
                </div>
              </div>

              {/* RAG Key Insights */}
              {insights.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <div className="text-[10px] uppercase font-mono text-neutral-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3 text-teal-400" />
                    LangChain Vector Insights
                  </div>
                  <ul className="space-y-1">
                    {insights.map((ins, i) => (
                      <li key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-500">
              <Layers className="size-8 text-neutral-600 mb-2" />
              <p className="text-xs">Select a chunk on the left to inspect vector details.</p>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="p-3 border-t border-white/[0.08] bg-[#0d0d12] flex items-center justify-between text-xs">
            <span className="text-[11px] text-neutral-400">
              Dissatisfied? Switch to Neo4j Graph RAG to view multi-hop entity connections.
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handleAlternateToGraph}
              className="h-7 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-lg gap-1.5 shadow-sm"
            >
              <RotateCcw className="size-3" /> Alternate View
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
