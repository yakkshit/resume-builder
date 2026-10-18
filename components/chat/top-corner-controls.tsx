"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Settings2, Square, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopCornerControlsProps {
  onOpenSettings: () => void;
  onOpenCommandPalette?: () => void;
  isLoading?: boolean;
  onStop?: () => void;
  className?: string;
}

/**
 * Top-Right Corner dock with true inbound concave curves.
 * Sits flush against the top-right corner of the viewport (top-0 right-0).
 */
export function TopCornerControls({
  onOpenSettings,
  onOpenCommandPalette,
  isLoading,
  onStop,
  className,
}: TopCornerControlsProps) {
  return (
    <div
      className={cn(
        "fixed top-0 right-0 z-30 flex items-start select-none pointer-events-auto",
        className
      )}
    >
      {/* Top-Left Inbound (Concave) Fillet scooping down from the top edge */}
      <div className="relative w-4 h-4 shrink-0 pointer-events-none overflow-hidden -mr-[0.5px]">
        <svg
          viewBox="0 0 16 16"
          className="w-4 h-4 fill-[#161619]"
          aria-hidden="true"
        >
          <path d="M 0,0 C 8,0 16,8 16,16 L 16,0 Z" />
          <path
            d="M 0,0 C 8,0 16,8 16,16"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Main Corner Dock Body - docked flush to top-0 right-0 */}
      <div className="flex flex-col items-end bg-[#161619] border-b border-l border-white/10 rounded-bl-2xl shadow-2xl">
        <div className="flex items-center gap-1.5 px-3 py-2">
          {isLoading && onStop && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onStop}
              title="Stop AI Generation"
              className="h-7 px-2.5 rounded-lg text-xs font-semibold gap-1.5 shadow-sm"
              aria-label="Stop AI generation"
            >
              <Square className="size-3 fill-current" />
              <span>Stop</span>
            </Button>
          )}
          {onOpenCommandPalette && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onOpenCommandPalette}
              title="Search Chats & Commands (⌘K)"
              className="size-7 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Search and command palette"
            >
              <Search className="size-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            title="Chat & Profile Settings"
            className="size-7 rounded-xl text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Open settings"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>

        {/* Bottom-Right Inbound (Concave) Fillet scooping into the right screen wall */}
        <div className="relative w-4 h-4 self-end pointer-events-none overflow-hidden -mb-4 -mr-[0.5px]">
          <svg
            viewBox="0 0 16 16"
            className="w-4 h-4 fill-[#161619]"
            aria-hidden="true"
          >
            <path d="M 16,0 L 0,0 C 8,0 16,8 16,16 Z" />
            <path
              d="M 0,0 C 8,0 16,8 16,16"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
