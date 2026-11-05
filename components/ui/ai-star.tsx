"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AiStarIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Custom 4-point AI Star Icon with top-right and bottom-left twinkle sparkles,
 * directly matching the design reference in media_1793824781862_dcd15aaa.png.
 */
export function AiStarIcon({ size = 20, className, ...props }: AiStarIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block shrink-0", className)}
      {...props}
    >
      {/* Central 4-pointed sparkle */}
      <path
        d="M12 2.5C12 7.7467 7.7467 12 2.5 12C7.7467 12 12 16.2533 12 21.5C12 16.2533 16.2533 12 21.5 12C16.2533 12 12 7.7467 12 2.5Z"
        fill="currentColor"
      />
      {/* Top right secondary sparkle (cross style) */}
      <path
        d="M18.5 3.5C18.5 4.88 17.38 6 16 6C17.38 6 18.5 7.12 18.5 8.5C18.5 7.12 19.62 6 21 6C19.62 6 18.5 4.88 18.5 3.5Z"
        fill="currentColor"
      />
      {/* Bottom left mini twinkle */}
      <path
        d="M6 16.5C6 17.328 5.328 18 4.5 18C5.328 18 6 18.672 6 19.5C6 18.672 6.672 18 7.5 18C6.672 18 6 17.328 6 16.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Purple circular badge matching media_1793824781862_dcd15aaa.png
 * Deep indigo/purple ring and background with luminous lavender star inside.
 */
export function AiStarBadge({
  size = "md",
  className,
  glow = true,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  glow?: boolean;
}) {
  const sizeMap = {
    xs: "size-5",
    sm: "size-7",
    md: "size-9",
    lg: "size-11",
    xl: "size-14",
  };
  const iconSizeMap = {
    xs: 11,
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28,
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 border border-[#4f46e5]/50 bg-gradient-to-b from-[#241e4a] via-[#1a173b] to-[#121026] text-[#c7d2fe] transition-transform duration-200",
        glow && "shadow-[0_0_14px_rgba(99,102,241,0.45)] ring-1 ring-[#6366f1]/25",
        sizeMap[size],
        className
      )}
    >
      <AiStarIcon size={iconSizeMap[size]} className="text-[#c7d2fe]" />
    </div>
  );
}

