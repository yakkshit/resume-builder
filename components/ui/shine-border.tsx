"use client";

import { cn } from "@/lib/utils";

type TColorProp = string | string[];

export interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  color?: TColorProp;
  className?: string;
  children: React.ReactNode;
}

/** Animated gradient border (no extra icon deps). Pair with `shine-pulse` in tailwind.config. */
export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#6366f1",
  className,
  children,
}: ShineBorderProps) {
  const grad =
    Array.isArray(color) && color.length > 0
      ? color.join(",")
      : typeof color === "string"
        ? color
        : "#6366f1";

  const r = `${borderRadius}px`;
  return (
    <div
      style={{ borderRadius: r } as React.CSSProperties}
      className={cn("relative h-full w-full overflow-visible", className)}
    >
      <div
        aria-hidden
        style={
          {
            borderRadius: r,
            "--border-width": `${borderWidth}px`,
            "--shine-pulse-duration": `${duration}s`,
            "--mask-linear-gradient": "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            "--background-radial-gradient": `radial-gradient(transparent,transparent, ${grad},transparent,transparent)`,
          } as React.CSSProperties
        }
        className={cn(
          "pointer-events-none absolute inset-0",
          "before:absolute before:inset-0 before:aspect-square before:size-full before:rounded-[inherit] before:p-[var(--border-width)] before:will-change-[background-position] before:content-['']",
          "before:[-webkit-mask-composite:xor] before:[mask-composite:exclude] before:[mask:var(--mask-linear-gradient)]",
          "before:[background-image:var(--background-radial-gradient)] before:bg-[length:300%_300%]",
          "motion-safe:before:animate-[shine-pulse_var(--shine-pulse-duration)_infinite_linear]",
        )}
      />
      <div className="relative z-[1] h-full w-full overflow-hidden rounded-[inherit]" style={{ borderRadius: r }}>
        {children}
      </div>
    </div>
  );
}
