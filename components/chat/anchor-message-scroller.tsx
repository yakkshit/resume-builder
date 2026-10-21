"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { UIMessage } from "ai";
import { getTextContent } from "@/lib/message-utils";

interface AnchorMessageScrollerProps {
  messages: UIMessage[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

/**
 * Anchor Message Scroller inspired by thread navigation checkpoints.
 * Shows clean horizontal dash lines. On hover, a pill pops out to the left displaying
 * message text. Scrollable with hidden scrollbar for a polished UI.
 */
export function AnchorMessageScroller({
  messages,
  containerRef,
  className,
}: AnchorMessageScrollerProps) {
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [hoveredAnchor, setHoveredAnchor] = useState<{
    id: string;
    label: string;
    top: number;
    right: number;
  } | null>(null);

  const activeBtnRef = useRef<HTMLButtonElement | null>(null);
  const scrollerContainerRef = useRef<HTMLDivElement | null>(null);

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

  // Keep the active anchor in view within the navigation scroller without scrolling outer containers
  useEffect(() => {
    if (scrollerContainerRef.current && activeBtnRef.current) {
      const container = scrollerContainerRef.current;
      const btn = activeBtnRef.current;
      const cTop = container.scrollTop;
      const cBottom = cTop + container.clientHeight;
      const bTop = btn.offsetTop;
      const bBottom = bTop + btn.offsetHeight;

      if (bTop < cTop) {
        container.scrollTo({ top: Math.max(0, bTop - 20), behavior: "smooth" });
      } else if (bBottom > cBottom) {
        container.scrollTo({ top: bBottom - container.clientHeight + 20, behavior: "smooth" });
      }
    }
  }, [activeMessageId]);

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
    <>
      {/* Floating Pill on Hover positioned without container clipping */}
      {hoveredAnchor && (
        <div
          style={{
            position: "fixed",
            top: hoveredAnchor.top,
            right: hoveredAnchor.right,
            transform: "translateY(-50%)",
          }}
          className="z-50 px-2.5 py-0.5 rounded-full bg-white text-black text-[11px] font-semibold tracking-tight shadow-2xl whitespace-nowrap pointer-events-none animate-in fade-in zoom-in-95 duration-100"
        >
          {hoveredAnchor.label}
        </div>
      )}

      {/* Navigation slider rail */}
      <div
        className={cn(
          "fixed right-1.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col items-end pointer-events-auto select-none",
          className
        )}
        aria-label="Message navigation anchors"
      >
        <div
          ref={scrollerContainerRef}
          onScroll={() => setHoveredAnchor(null)}
          className="w-10 sm:w-12 max-h-[85vh] sm:max-h-[calc(100vh-120px)] overflow-y-auto overscroll-contain flex flex-col items-end gap-1.5 py-3 pr-1 sm:pr-1.5 pl-2 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {userAnchors.map((anchor) => {
            const isActive = activeMessageId === anchor.id;
            const isHovered = hoveredAnchor?.id === anchor.id;

            return (
              <button
                key={anchor.id}
                ref={isActive ? activeBtnRef : undefined}
                type="button"
                onClick={() => scrollToMessage(anchor.id)}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredAnchor({
                    id: anchor.id,
                    label: anchor.label,
                    top: rect.top + rect.height / 2,
                    right: window.innerWidth - rect.left + 8,
                  });
                }}
                onMouseLeave={() => setHoveredAnchor(null)}
                className="group relative flex items-center justify-end py-1.5 px-1 focus:outline-none cursor-pointer"
                aria-label={`Jump to message: ${anchor.fullText.slice(0, 30)}`}
              >
                {/* Horizontal line: active or hovered is longer and white, otherwise short muted line */}
                <span
                  className={cn(
                    "h-[2px] rounded-full transition-all duration-200",
                    isActive || isHovered
                      ? "w-5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      : "w-3 bg-neutral-600 group-hover:bg-neutral-300 group-hover:w-4"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
