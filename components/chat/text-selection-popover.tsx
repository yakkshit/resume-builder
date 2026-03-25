"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Copy } from "lucide-react";
import { copyToClipboard } from "@/lib/clipboard";

interface TextSelectionPopoverProps {
  onAsk?: (text: string) => void;
  onCopy?: (text: string) => void;
  onCopyFailed?: () => void;
  children: React.ReactNode;
  className?: string;
  /** Optional: only show popover when selection is inside this element */
  containerRef?: React.RefObject<HTMLElement | null>;
}

export function TextSelectionPopover({
  onAsk,
  onCopy,
  onCopyFailed,
  children,
  className,
  containerRef,
}: TextSelectionPopoverProps) {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const selectionTextRef = useRef("");
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleSelection = useCallback(() => {
    const sel = window.getSelection();
    const text = sel?.toString().trim();
    if (!text) {
      selectionTextRef.current = "";
      setSelection(null);
      return;
    }
    const range = sel?.rangeCount ? sel.getRangeAt(0) : null;
    if (!range) return;

    const anchor = range.commonAncestorContainer;
    const startEl =
      anchor.nodeType === Node.TEXT_NODE
        ? (anchor.parentElement as HTMLElement | null)
        : (anchor as HTMLElement);
    if (
      startEl?.closest(
        "input, textarea, [contenteditable='true'], [data-no-selection-popover='true']"
      )
    ) {
      selectionTextRef.current = "";
      setSelection(null);
      return;
    }

    const container = containerRef?.current;
    if (container) {
      const contains =
        container.contains(anchor) ||
        (anchor.nodeType === Node.TEXT_NODE && container.contains(anchor.parentNode));
      if (!contains) {
        selectionTextRef.current = "";
        setSelection(null);
        return;
      }
    }

    const rect = range.getBoundingClientRect();
    selectionTextRef.current = text;
    setSelection({ text, x: rect.left + rect.width / 2, y: rect.top });
    setPosition({ top: rect.top - 48, left: rect.left + rect.width / 2 - 100 });
  }, [containerRef]);

  const close = useCallback(() => {
    selectionTextRef.current = "";
    setSelection(null);
  }, []);

  const handleCopy = useCallback(async () => {
    const text = selectionTextRef.current || selection?.text || "";
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) onCopy?.(text);
    else onCopyFailed?.();
    close();
    window.getSelection()?.removeAllRanges();
  }, [selection?.text, onCopy, onCopyFailed, close]);

  const handleAsk = useCallback(() => {
    const text = selectionTextRef.current || selection?.text || "";
    if (!text) return;
    onAsk?.(text);
    close();
    window.getSelection()?.removeAllRanges();
  }, [selection?.text, onAsk, close]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelection);
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, [handleSelection]);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (toolbarRef.current?.contains(e.target as Node)) return;
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel?.toString().trim()) close();
      });
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [close]);

  if (!selection?.text) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {children}
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Selection actions"
        className="fixed z-[100] flex gap-0.5 rounded-xl border border-white/15 bg-[#1a1a1e]/95 backdrop-blur-xl px-1 py-1 shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150"
        style={{
          top: position.top,
          left: Math.max(8, Math.min(window.innerWidth - 208, position.left)),
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-white hover:bg-white/10"
          onClick={handleAsk}
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Ask
        </Button>
        <Button
          type="button"
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
