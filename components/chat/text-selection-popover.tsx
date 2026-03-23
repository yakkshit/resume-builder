"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy } from "lucide-react";
interface TextSelectionPopoverProps {
  onAsk?: (text: string) => void;
  children: React.ReactNode;
  className?: string;
  /** Optional: only show popover when selection is inside this element */
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function TextSelectionPopover({
  onAsk,
  children,
  className,
  containerRef,
}: TextSelectionPopoverProps) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) {
      setSelection(null);
      return;
    }
    const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
    if (!range) return;
    const container = containerRef?.current;
    if (container && !container.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setSelection({ text, x: rect.left + rect.width / 2, y: rect.top });
    setPosition({ top: rect.top - 48, left: rect.left + rect.width / 2 - 100 });
  }, [containerRef]);

  const handleCopy = useCallback(() => {
    if (selection?.text) {
      navigator.clipboard.writeText(selection.text);
      setSelection(null);
    }
  }, [selection]);

  const handleAsk = useCallback(() => {
    if (selection?.text && onAsk) {
      onAsk(selection.text);
      setSelection(null);
    }
  }, [selection, onAsk]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [handleSelection]);

  useEffect(() => {
    const handleClick = () => {
      const sel = window.getSelection();
      if (!sel?.toString().trim()) setSelection(null);
    };
    document.addEventListener("mouseup", handleClick);
    return () => document.removeEventListener("mouseup", handleClick);
  }, []);

  if (!selection?.text) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {children}
      <div
        className="fixed z-[100] flex gap-1 rounded-lg border border-white/10 bg-[#1a1a1e]/95 backdrop-blur-xl px-1 py-1 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: position.top,
          left: Math.max(8, Math.min(window.innerWidth - 208, position.left - 100)),
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-white hover:bg-white/10"
          onClick={handleAsk}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Ask
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-white hover:bg-white/10"
          onClick={handleCopy}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
      </div>
    </div>
  );
}
