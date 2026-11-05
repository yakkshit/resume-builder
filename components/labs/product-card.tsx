"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight, Github, ExternalLink, Terminal, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ProductCardProps {
  title: string;
  badges: string[];
  description: string;
  span?: "col-span-1" | "col-span-1 md:col-span-2";
  primaryLink?: {
    label: string;
    href: string;
    isExternal?: boolean;
  };
  secondaryLink?: {
    label: string;
    href: string;
    isExternal?: boolean;
    icon?: "github" | "npm" | "external";
  };
  stars?: string;
  visual?: React.ReactNode;
}

export function ProductCard({
  title,
  badges,
  description,
  span = "col-span-1",
  primaryLink,
  secondaryLink,
  stars,
  visual,
}: ProductCardProps) {
  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:border-white/25 hover:shadow-[0_0_30px_rgba(255,255,255,0.03)] ${span}`}
    >
      {/* Background subtle radial gradient */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-white/[0.02] blur-3xl group-hover:bg-[#aff33e]/[0.05] transition-colors" />

      {/* Top Header: Badges & Stars */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {badges.map((b) => (
            <Badge
              key={b}
              variant="outline"
              className="border-white/10 bg-white/[0.03] text-[10px] font-mono text-zinc-300 px-2 py-0.5 rounded-full"
            >
              {b}
            </Badge>
          ))}
        </div>

        {stars && (
          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
            <Star className="size-3 fill-amber-400" />
            <span>{stars}</span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="relative z-10 space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white group-hover:text-zinc-100 transition-colors">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-xl">
          {description}
        </p>
      </div>

      {/* Visual / Graphic Section */}
      {visual && (
        <div className="relative z-10 my-6 overflow-hidden rounded-xl border border-white/10 bg-black/80">
          {visual}
        </div>
      )}

      {/* Footer Links */}
      <div className="relative z-10 mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center gap-3">
        {primaryLink && (
          primaryLink.isExternal ? (
            <a
              href={primaryLink.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98]"
            >
              <span>{primaryLink.label}</span>
              <ArrowUpRight className="size-3.5" />
            </a>
          ) : (
            <Link
              href={primaryLink.href}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-all active:scale-[0.98]"
            >
              <span>{primaryLink.label}</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          )
        )}

        {secondaryLink && (
          <a
            href={secondaryLink.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full border border-white/10 text-zinc-300 hover:text-white hover:border-white/25 transition-all"
          >
            {secondaryLink.icon === "github" && <Github className="size-3.5" />}
            {secondaryLink.icon === "npm" && <Terminal className="size-3.5 text-red-400" />}
            {secondaryLink.icon === "external" && <ExternalLink className="size-3.5" />}
            <span>{secondaryLink.label}</span>
          </a>
        )}
      </div>
    </div>
  );
}

