"use client";

import { useEffect, useMemo, useState } from "react";
import { Linkedin, Copy, Check } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { ChatArtifactWindow } from "@/components/chat/chat-artifact-chrome";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  LINKEDIN_DM_MAX_CHARS,
  clampLinkedInDm,
  linkedInDmCharCount,
} from "@/lib/linkedin-outreach";

export function LinkedinDmPanel({ data = {} }: { data?: Record<string, unknown> }) {
  const initial = useMemo(() => {
    const d = data as Record<string, string | undefined>;
    const raw = (d.message ?? d.note ?? d.body ?? d.text ?? "").trim();
    return clampLinkedInDm(raw);
  }, [data]);

  const [message, setMessage] = useState(initial);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMessage(initial);
  }, [initial]);

  const count = linkedInDmCharCount(message);

  const copy = async () => {
    const safe = clampLinkedInDm(message);
    try {
      await navigator.clipboard.writeText(safe);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <ChatArtifactWindow
      variant="light"
      cardClassName="w-full overflow-hidden border-border/60 bg-background/85 shadow-lg rounded-2xl"
      headerClassName="pb-2 border-b border-border/50 bg-muted/15 !items-start"
      contentClassName="space-y-3 pt-4"
      title={
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Linkedin className="w-4 h-4 text-[#0A66C2]" />
            LinkedIn message (job poster)
          </CardTitle>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Short note for Easy Apply or a connection request—keep it under {LINKEDIN_DM_MAX_CHARS} characters. Paste into LinkedIn yourself.
          </p>
        </div>
      }
    >
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs">Message</Label>
          <Badge variant="secondary" className="text-[10px] font-mono">
            {count}/{LINKEDIN_DM_MAX_CHARS}
          </Badge>
        </div>
        <Textarea
          value={message}
          onChange={(e) => setMessage(clampLinkedInDm(e.target.value))}
          className="min-h-[100px] text-sm rounded-xl font-medium"
          maxLength={LINKEDIN_DM_MAX_CHARS}
          placeholder="Hi [Name], I applied for [Role]—excited about…"
        />
        <Button type="button" size="sm" className="w-full gap-2 rounded-xl" onClick={copy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy message"}
        </Button>
    </ChatArtifactWindow>
  );
}
