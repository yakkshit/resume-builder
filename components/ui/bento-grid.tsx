"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * 21st.dev / Magic UI BentoGrid component tailored for the pure-black Jimo aesthetic.
 * Ultra-thin borders, calm spacing, subtle border brightening on hover.
 */
export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  className,
  title,
  description,
  header,
  icon,
  badge,
  children,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#070709] p-6 flex flex-col justify-between transition-all duration-300 hover:border-white/25 relative overflow-hidden group",
        className
      )}
    >
      {header}
      {children}
      {(title || description) && (
        <div className="space-y-1.5 pt-4">
          <div className="flex items-center justify-between mb-2">
            {icon}
            {badge}
          </div>
          {title && (
            <h3 className="font-semibold text-white text-base tracking-tight group-hover:text-white transition-colors">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-zinc-400 font-normal leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

