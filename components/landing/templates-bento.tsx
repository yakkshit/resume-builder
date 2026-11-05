"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TemplateItem {
  key: string;
  name: string;
  tag: string;
  summary: string;
}

const TEMPLATES: TemplateItem[] = [
  { key: "modern", name: "Modern Clean", tag: "ATS 99%", summary: "Minimal headers with high-density bullet hierarchy" },
  { key: "minimal", name: "Executive Minimal", tag: "Single-Page", summary: "Tight character budgeting for senior leadership" },
  { key: "tech-modern", name: "Tech Monospace", tag: "Dev / Cloud", summary: "Engineered for technical competencies & architecture" },
  { key: "german-cv", name: "German Lebenslauf", tag: "DIN 5008", summary: "Standard European formatting with structured metadata" },
  { key: "ivy-league", name: "Ivy League Academic", tag: "Classic", summary: "Traditional serif styling for research & legal roles" },
  { key: "two-column", name: "Two Column Split", tag: "Creative", summary: "Balanced visual split for skills and timeline" },
];

export function TemplatesBento() {
  const [activeTemplate, setActiveTemplate] = useState<string>("modern");

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TEMPLATES.map((tpl) => {
          const isSelected = activeTemplate === tpl.key;
          return (
            <button
              key={tpl.key}
              type="button"
              onClick={() => setActiveTemplate(tpl.key)}
              className={`rounded-2xl border p-5 text-left transition-all duration-300 flex flex-col justify-between group bg-[#070709] ${
                isSelected
                  ? "border-[#aff33e]/50 ring-1 ring-[#aff33e]/30 shadow-[0_0_20px_rgba(175,243,62,0.08)]"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              {/* Minimalist Document Wireframe Preview */}
              <div className="w-full aspect-[16/10] rounded-xl bg-[#030305] border border-white/5 p-4 flex flex-col justify-between mb-4 relative overflow-hidden group-hover:border-white/10 transition-colors">
                {/* Header bar wireframe */}
                <div className="space-y-1.5">
                  <div className="h-2 w-1/3 bg-white/40 rounded-full" />
                  <div className="h-1.5 w-1/2 bg-white/15 rounded-full" />
                </div>

                {/* Body lines wireframe */}
                <div className="space-y-2 py-2">
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-white/20 rounded-full" />
                    <div className="h-1 w-5/6 bg-white/15 rounded-full" />
                    <div className="h-1 w-4/6 bg-white/10 rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 w-full bg-white/20 rounded-full" />
                    <div className="h-1 w-3/4 bg-white/15 rounded-full" />
                  </div>
                </div>

                {/* Bottom footer wireframe */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="h-1 w-1/4 bg-white/10 rounded-full" />
                  <div className="h-1 w-1/6 bg-white/10 rounded-full" />
                </div>

                {/* Active Indicator checkmark */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-[#aff33e] text-black flex items-center justify-center shadow-md">
                    <Check className="size-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Template Label and Tag */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white tracking-tight">
                    {tpl.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded-full">
                    {tpl.tag}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-snug">
                  {tpl.summary}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-[#070709] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
            <FileText className="size-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              Selected Style: <span className="text-[#aff33e] font-mono">{activeTemplate}</span>
            </div>
            <p className="text-[11px] text-zinc-400">Strict single-page character budget enforcement &amp; vector PDF export.</p>
          </div>
        </div>

        <Button asChild size="sm" className="h-8 px-4 text-xs font-semibold rounded-full bg-white text-black hover:bg-zinc-200 transition-all shrink-0">
          <Link href="/chat" className="flex items-center gap-1.5">
            <span>Open in Studio</span>
            <ArrowRight className="size-3" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

