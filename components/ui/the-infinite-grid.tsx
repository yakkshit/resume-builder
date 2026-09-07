"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const InfiniteGridBackground = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative w-full h-screen flex flex-col overflow-hidden bg-background",
        className
      )}
    >
      {/* High-performance CSS grid background (0% CPU overhead) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Subtle Ambient Glow Gradients (Hardware Accelerated) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/15 dark:bg-primary/10 blur-3xl" />
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-cyan-500/15 dark:bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
};