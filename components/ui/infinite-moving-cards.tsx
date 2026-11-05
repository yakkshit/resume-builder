"use client";

import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface InfiniteMovingCardsProps {
  items: Array<{
    quote?: string;
    name?: string;
    title?: string;
    avatar?: string;
    company?: string;
    logo?: React.ReactNode;
  }>;
  direction?: "left" | "right";
  speed?: "fast" | "normal" | "slow";
  pauseOnHover?: boolean;
  className?: string;
  renderItem?: (item: any, idx: number) => React.ReactNode;
}

/**
 * Aceternity / 21st.dev InfiniteMovingCards component styled for pure-black SaaS aesthetic.
 */
export function InfiniteMovingCards({
  items,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
  renderItem,
}: InfiniteMovingCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [start, setStart] = useState(false);

  useEffect(() => {
    addAnimation();
  }, []);

  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }

  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left") {
        containerRef.current.style.setProperty("--animation-direction", "forwards");
      } else {
        containerRef.current.style.setProperty("--animation-direction", "reverse");
      }
    }
  };

  const getSpeed = () => {
    if (containerRef.current) {
      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 max-w-7xl overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_15%,white_85%,transparent)]",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex min-w-full shrink-0 gap-4 py-4 w-max flex-nowrap",
          start && "animate-scroll",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li key={idx} className="shrink-0">
            {renderItem ? (
              renderItem(item, idx)
            ) : item.quote ? (
              <div className="w-[350px] max-w-full relative rounded-2xl border border-white/10 bg-[#070709] px-6 py-5 text-left transition-colors duration-200 hover:border-white/20">
                <p className="text-xs text-zinc-300 leading-relaxed font-normal mb-4">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-white/5">
                  <div className="size-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-xs font-semibold text-white">
                    {item.name ? item.name.charAt(0) : "U"}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{item.name}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">{item.title}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/5 bg-[#070709] text-zinc-400 hover:text-white transition-colors">
                {item.logo}
                <span className="text-xs font-semibold tracking-wider font-mono uppercase">{item.company}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

