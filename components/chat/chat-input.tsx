"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  onStop?: () => void;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  onStop,
  placeholder = "Message Career Assistant...",
  className,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isLoading && value.trim()) {
        onSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} className={cn("w-full max-w-3xl mx-auto", className)}>
      <div className="relative flex items-end gap-2 rounded-2xl bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border border-white/20 dark:border-neutral-700/50 shadow-xl shadow-black/5 dark:shadow-black/20 p-2 focus-within:ring-2 focus-within:ring-violet-500/30 focus-within:border-violet-500/50 transition-all">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className={cn(
            "min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3",
            "placeholder:text-muted-foreground/70"
          )}
        />
        <Button
          type={isLoading ? "button" : "submit"}
          size="icon"
          variant={isLoading ? "destructive" : "default"}
          className={cn(
            "h-10 w-10 shrink-0 rounded-xl transition-all",
            isLoading
              ? "bg-rose-500/90 hover:bg-rose-500"
              : "bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25"
          )}
          disabled={!value.trim() && !isLoading}
          onClick={isLoading ? onStop : undefined}
        >
          {isLoading ? (
            <Square className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        Press Cmd+Enter (or Ctrl+Enter) to send, Enter for a new line
      </p>
    </form>
  );
}
