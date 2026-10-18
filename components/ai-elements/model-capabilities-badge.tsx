"use client";

import React, { useState } from "react";
import {
  Brain,
  Image as ImageIcon,
  Box,
  Wrench,
  Zap,
  Search,
  Link2,
  Info,
  Check,
  Sparkles,
} from "lucide-react";
import {
  CAPABILITY_METADATA,
  ALL_CAPABILITY_KEYS,
  type ModelCapabilityKey,
  type ModelCapabilityInfo,
  getModelCapabilities,
  getActiveCapabilities,
} from "@/lib/model-capabilities";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * Returns the Lucide icon element for a given capability key.
 */
export function getCapabilityIconComponent(
  key: ModelCapabilityKey,
  className?: string
) {
  const iconProps = { className: cn("shrink-0", className) };
  switch (key) {
    case "thinking":
      return <Brain {...iconProps} />;
    case "imageInput":
      return <ImageIcon {...iconProps} />;
    case "objectGeneration":
      return <Box {...iconProps} />;
    case "toolUsage":
      return <Wrench {...iconProps} />;
    case "toolStreaming":
      return <Zap {...iconProps} />;
    case "googleSearch":
      return <Search {...iconProps} />;
    case "urlContext":
      return <Link2 {...iconProps} />;
    default:
      return <Sparkles {...iconProps} />;
  }
}

interface CapabilityIconBadgeProps {
  capability: ModelCapabilityKey;
  size?: "xs" | "sm" | "md";
  showTooltip?: boolean;
  className?: string;
}

/**
 * Single capability icon badge with styled background and rich tooltip.
 */
export function CapabilityIconBadge({
  capability,
  size = "sm",
  showTooltip = true,
  className,
}: CapabilityIconBadgeProps) {
  const meta = CAPABILITY_METADATA[capability];
  if (!meta) return null;

  const sizeClasses = {
    xs: "p-0.5 rounded-[4px] text-[10px]",
    sm: "p-1 rounded-md text-xs",
    md: "px-2 py-1 rounded-lg text-xs gap-1.5",
  }[size];

  const iconSizes = {
    xs: "size-2.5",
    sm: "size-3",
    md: "size-3.5",
  }[size];

  const content = (
    <span
      className={cn(
        "inline-flex items-center justify-center transition-all duration-200 border",
        meta.badgeBg,
        meta.badgeBorder,
        meta.badgeText,
        sizeClasses,
        className
      )}
      aria-label={meta.label}
    >
      {getCapabilityIconComponent(capability, iconSizes)}
      {size === "md" && <span className="font-medium text-[11px]">{meta.shortLabel}</span>}
    </span>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex cursor-help">{content}</span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs p-2.5 bg-[#1f1f24] border border-white/10 text-white shadow-2xl rounded-xl z-[100]"
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                "inline-flex p-1 rounded-md border",
                meta.badgeBg,
                meta.badgeBorder,
                meta.badgeText
              )}
            >
              {getCapabilityIconComponent(capability, "size-3.5")}
            </span>
            <span className="font-semibold text-xs text-white">{meta.label}</span>
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed mb-1.5">
            {meta.description}
          </p>
          <div className="pt-1.5 border-t border-white/10">
            <span className="text-[10px] font-medium text-emerald-400 block mb-0.5 uppercase tracking-wider">
              Project Application:
            </span>
            <p className="text-[10px] text-neutral-400 leading-snug">
              {meta.projectUse}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ModelCapabilityIconsProps {
  modelId?: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  maxIcons?: number;
}

/**
 * Compact horizontal row of capability icons for a given model.
 * Great for model dropdown items and status bars.
 */
export function ModelCapabilityIcons({
  modelId,
  size = "xs",
  className,
  maxIcons = 7,
}: ModelCapabilityIconsProps) {
  const activeKeys = getActiveCapabilities(modelId);
  if (activeKeys.length === 0) return null;

  const visible = activeKeys.slice(0, maxIcons);
  const remaining = activeKeys.length - maxIcons;

  return (
    <div className={cn("inline-flex items-center gap-1 shrink-0", className)}>
      {visible.map((key) => (
        <CapabilityIconBadge
          key={key}
          capability={key}
          size={size}
          showTooltip={true}
        />
      ))}
      {remaining > 0 && (
        <span className="text-[10px] text-neutral-400 font-mono">
          +{remaining}
        </span>
      )}
    </div>
  );
}

interface CapabilityFilterBarProps {
  selectedCapability: ModelCapabilityKey | "all";
  onSelectCapability: (cap: ModelCapabilityKey | "all") => void;
  className?: string;
}

/**
 * Filter bar allowing users to quickly filter models by capability.
 */
export function CapabilityFilterBar({
  selectedCapability,
  onSelectCapability,
  className,
}: CapabilityFilterBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 overflow-x-auto py-1 px-1.5 no-scrollbar",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSelectCapability("all")}
        className={cn(
          "px-2 py-0.5 text-[11px] rounded-md font-medium transition-colors whitespace-nowrap shrink-0 border",
          selectedCapability === "all"
            ? "bg-white/15 text-white border-white/20"
            : "bg-white/5 text-neutral-400 border-white/5 hover:text-neutral-200 hover:bg-white/10"
        )}
      >
        All Models
      </button>

      {ALL_CAPABILITY_KEYS.map((key) => {
        const meta = CAPABILITY_METADATA[key];
        const isActive = selectedCapability === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelectCapability(isActive ? "all" : key)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md font-medium transition-colors whitespace-nowrap shrink-0 border",
              isActive
                ? cn(meta.badgeBg, meta.badgeBorder, meta.badgeText, "font-semibold shadow-sm")
                : "bg-white/5 text-neutral-400 border-white/5 hover:text-neutral-200 hover:bg-white/10"
            )}
            title={meta.description}
          >
            {getCapabilityIconComponent(key, "size-3")}
            <span>{meta.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

interface CapabilityLegendDialogProps {
  trigger?: React.ReactNode;
}

/**
 * Modal dialog that explains all 7 model capabilities and their role in the career platform.
 */
export function CapabilityLegendDialog({ trigger }: CapabilityLegendDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Info className="size-3 text-neutral-400" />
            <span>Capability Legend</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-xl p-6 bg-[#18181c] border border-white/10 text-white rounded-2xl shadow-2xl z-[100]">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-white">
            <Sparkles className="size-4 text-indigo-400" />
            Model Capabilities & Career Intelligence Matrix
          </DialogTitle>
          <p className="text-xs text-neutral-400 leading-relaxed mt-1">
            Our autonomous platform leverages modern AI SDK v5 & Gemini APIs to deliver
            precision ATS scoring, live job grounding, and automated career agents.
          </p>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
          {ALL_CAPABILITY_KEYS.map((key) => {
            const meta = CAPABILITY_METADATA[key];
            return (
              <div
                key={key}
                className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3 transition-colors hover:bg-white/[0.06]"
              >
                <div
                  className={cn(
                    "p-2 rounded-lg border shrink-0 mt-0.5",
                    meta.badgeBg,
                    meta.badgeBorder,
                    meta.badgeText
                  )}
                >
                  {getCapabilityIconComponent(key, "size-4")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-xs text-white">
                      {meta.label}
                    </h4>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase",
                        meta.badgeBg,
                        meta.badgeBorder,
                        meta.badgeText
                      )}
                    >
                      {meta.shortLabel}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-snug mb-1.5">
                    {meta.description}
                  </p>
                  <div className="bg-black/30 p-2 rounded-lg border border-white/5 text-[11px] text-neutral-400">
                    <span className="font-medium text-emerald-400 block text-[10px] uppercase tracking-wider mb-0.5">
                      How we use it:
                    </span>
                    {meta.projectUse}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
