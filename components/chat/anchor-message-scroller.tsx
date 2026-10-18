"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { getTextContent } from "@/lib/message-utils";

interface AnchorMessageScrollerProps {
  messages: UIMessage[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

/**
 * Anchor Message Scroller inspired by HextaAI thread navigation (User screenshots).
 * Shows clean horizontal dash lines. On hover, a pill pops out to the left displaying
 * a few characters of that message.
 */
export function AnchorMessageScroller({
  messages,
  containerRef,
  className,
}: AnchorMessageScrollerProps) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Filter to user messages (or anchor points)
  const userAnchors = messages
    .filter((m) => m.role === "user")
    .map((m, idx) => {
      const rawText = (getTextContent(m) || "").trim();
      const text = rawText
        .replace(/\[Active Tools:[^\]]*\]/gi, "")
        .replace(/\[Attached files:[^\]]*\]/gi, "")
        .trim();
      // Display a few characters (up to 16)
      const label = text.length > 16 ? `${text.slice(0, 16)}…` : text || `Msg ${idx + 1}`;
      return {
        id: m.id || `user-msg-${idx}`,
        label,
        fullText: text,
        index: idx,
      };
    });

  // Track active visible message based on scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container || userAnchors.length === 0) return;

    const handleScroll = () => {
      const children = Array.from(container.querySelectorAll<HTMLElement>("[data-message-id]"));
      if (!children.length) return;

      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const centerLine = containerTop + containerHeight * 0.45;

      let closestId: string | null = null;
      let minDistance = Infinity;

      for (const el of children) {
        const id = el.getAttribute("data-message-id");
        if (!id) continue;
        const elTop = el.offsetTop;
        const dist = Math.abs(elTop - centerLine);
        if (dist < minDistance) {
          minDistance = dist;
          closestId = id;
        }
      }

      if (closestId) {
        setActiveMessageId(closestId);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages, containerRef, userAnchors.length]);

  const scrollToMessage = (msgId: string) => {
    const container = containerRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(`[data-message-id="${msgId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (userAnchors.length <= 1) return null;

  return (
    <div
      className={cn(
        "fixed right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-end gap-2 pointer-events-auto select-none",
        className
      )}
      aria-label="Message navigation anchors"
    >
      {userAnchors.map((anchor) => {
        const isActive = activeMessageId === anchor.id;
        const isHovered = hoveredId === anchor.id;

        return (
          <button
            key={anchor.id}
            type="button"
            onClick={() => scrollToMessage(anchor.id)}
            onMouseEnter={() => setHoveredId(anchor.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group relative flex items-center justify-end py-1 px-0.5 focus:outline-none"
            aria-label={`Jump to message: ${anchor.fullText.slice(0, 30)}`}
          >
            {/* Pill displayed on hover to the left of the dash (Images 2 & 3) */}
            {isHovered && (
              <span
                className="absolute right-full mr-2.5 px-2.5 py-0.5 rounded-full bg-white text-black text-[11px] font-semibold tracking-tight shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100"
              >
                {anchor.label}
              </span>
            )}

            {/* Horizontal line: active or hovered is longer and white, otherwise short muted line */}
            <span
              className={cn(
                "h-[2px] rounded-full transition-all duration-200",
                isActive || isHovered
                  ? "w-5 bg-white"
                  : "w-3 bg-neutral-600 group-hover:bg-neutral-400 group-hover:w-4"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
