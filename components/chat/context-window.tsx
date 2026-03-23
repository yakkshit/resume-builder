"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const CONTEXT_STORE = "chat-assistant-context-store";

interface ContextWindowProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ContextWindow({ value, onChange, className }: ContextWindowProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("w-full", className)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-10 px-3 text-[#8a8a8f] hover:text-white hover:bg-white/5"
        >
          <span className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile / Context
            {value.trim() && (
              <span className="w-2 h-2 rounded-full bg-[#1172e2] shrink-0" />
            )}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-3 space-y-2">
          <Label className="text-xs text-[#8a8a8f]">
            Your complete profile (resume summary, skills, goals). Used in every chat.
          </Label>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your resume summary, key skills, career goals..."
            className="min-h-[100px] max-h-[200px] resize-y bg-[#0f0f0f] border-white/10 text-white placeholder:text-[#5a5a5f] text-sm"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function getStoredContext(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CONTEXT_STORE) ?? "";
}

export function setStoredContext(value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONTEXT_STORE, value);
}
