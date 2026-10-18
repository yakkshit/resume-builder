"use client";

import { cn } from "@/lib/utils";
import { ArrowUpRight, Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useRef, useState } from "react";

const SPRING_DEFAULT = {
  bounce: 0.1,
  duration: 0.25,
  type: "spring" as const,
};

/** Grace period so the pointer can cross the gap between pill and card. */
const CLOSE_DELAY_MS = 140;
const CARD_WIDTH_PX = 296;

export type AICitationProps = {
  className?: string;
  /** Excerpt or description shown in the card. */
  description?: string;
  /**
   * The source's mark for the card header — a real isotype or an `<img>`.
   */
  favicon?: ReactNode;
  /** The number or short label shown in the pill. */
  label: string | number | ReactNode;
  title: string;
  url: string;
  onOpenUrl?: (url: string) => void;
};

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/**
 * An inline citation that can be peeked at without invalid HTML nesting.
 * Purely uses inline/phrasing elements (span, a, motion.span) so it can safely live inside markdown <p>.
 */
export const AICitation = ({
  className,
  description,
  favicon,
  label,
  title,
  url,
  onOpenUrl,
}: AICitationProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const scheduleClose = () => {
    closeTimeoutRef.current = setTimeout(
      () => setIsOpen(false),
      CLOSE_DELAY_MS
    );
  };

  useEffect(
    () => () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [isOpen]);

  const domain = hostOf(url);

  return (
    <span
      className={cn("relative inline-block align-baseline mx-0.5", className)}
      onBlur={scheduleClose}
      onFocus={open}
      onMouseEnter={open}
      onMouseLeave={scheduleClose}
    >
      <a
        aria-describedby={isOpen ? `${url}-card` : undefined}
        className="inline-flex h-5 items-center gap-1.5 rounded-full border border-white/10 bg-[#181820] px-2 py-0.5 font-medium text-xs text-neutral-200 no-underline transition-all hover:border-emerald-500/40 hover:bg-[#20202a] hover:text-white cursor-pointer select-none shadow-xs"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
        onClick={(e) => {
          if (onOpenUrl) {
            e.preventDefault();
            onOpenUrl(url);
          }
        }}
      >
        <span className="flex size-3 items-center justify-center shrink-0 overflow-hidden rounded-full">
          {favicon ?? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
              alt=""
              className="size-3 rounded-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />
          )}
        </span>
        <span className="truncate max-w-[130px] font-medium">{label}</span>
      </a>

      <AnimatePresence>
        {isOpen ? (
          <motion.span
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-full left-1/2 z-50 mb-2 block rounded-xl border border-white/10 bg-[#121217]/95 p-3 text-left align-baseline shadow-2xl backdrop-blur-xl pointer-events-auto"
            exit={
              shouldReduceMotion
                ? { opacity: 0, transition: { duration: 0 } }
                : { opacity: 0, scale: 0.94, y: 4 }
            }
            id={`${url}-card`}
            initial={
              shouldReduceMotion
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.94, y: 4 }
            }
            style={{
              transformOrigin: "bottom center",
              translateX: "-50%",
              width: CARD_WIDTH_PX,
            }}
            transition={shouldReduceMotion ? { duration: 0 } : SPRING_DEFAULT}
          >
            <span className="mb-1.5 flex items-center gap-1.5">
              <span className="flex size-3.5 shrink-0 items-center justify-center overflow-hidden rounded-full text-muted-foreground">
                {favicon ?? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
                    alt=""
                    className="size-3.5 rounded-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                )}
              </span>
              <span className="truncate text-neutral-400 font-mono text-[11px]">
                {domain}
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="ml-auto text-neutral-400 hover:text-emerald-400"
                size={12}
              />
            </span>

            <span className="block font-semibold text-white text-xs leading-snug">
              {title}
            </span>

            {description ? (
              <span className="mt-1 block text-neutral-400 text-[11px] leading-relaxed">
                {description}
              </span>
            ) : null}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
};

export default AICitation;
