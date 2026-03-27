"use client";

import { useEffect, useMemo, useState } from "react";
import type { CoverLetterData } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

function normalizeNewlines(s: string) {
  return String(s || "").replace(/\r\n/g, "\n");
}

function composeFullLetter(d: CoverLetterData) {
  const head = normalizeNewlines(d.head || "").trim();
  const body = normalizeNewlines(d.body || "").trim();
  const footer = normalizeNewlines(d.footer || "").trim();
  const parts = [head, body, footer].filter(Boolean);
  return parts.length ? `${head || ""}${head && body ? "\n\n" : ""}${body || ""}${body && footer ? "\n\n" : ""}${footer || ""}`.trim() : "";
}

function splitIntoHeadBodyFooter(text: string): { head: string; body: string; footer: string } {
  const t = normalizeNewlines(text).trim();
  if (!t) return { head: "", body: "", footer: "" };

  // Attempt signature/footer detection first.
  const lines = t.split("\n");
  const footerRegex = /^(sincerely|best regards|kind regards|yours truly|yours sincerely|regards)\b/i;
  let footerStartIdx = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (footerRegex.test(lines[i].trim())) {
      footerStartIdx = i;
      break;
    }
  }

  if (footerStartIdx >= 0) {
    const footer = lines.slice(footerStartIdx).join("\n").trim();
    const before = lines.slice(0, footerStartIdx).join("\n").trim();
    const chunks = before.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
    if (chunks.length >= 2) {
      return { head: chunks[0], body: chunks.slice(1).join("\n\n"), footer };
    }
    return { head: "", body: before, footer };
  }

  // Fallback: split by blank lines into 3 chunks.
  const chunks = t.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
  if (chunks.length >= 3) {
    return { head: chunks[0], body: chunks.slice(1, -1).join("\n\n"), footer: chunks[chunks.length - 1] };
  }
  if (chunks.length === 2) {
    return { head: chunks[0], body: chunks[1], footer: "" };
  }
  return { head: "", body: chunks[0], footer: "" };
}

export function CoverLetterSingleBlockEditor({
  coverLetterData,
  setCoverLetterData,
}: {
  coverLetterData: CoverLetterData;
  setCoverLetterData: (v: any) => void;
}) {
  const composed = useMemo(() => composeFullLetter(coverLetterData), [coverLetterData]);
  const [draft, setDraft] = useState(composed);

  useEffect(() => {
    setDraft(composed);
  }, [composed]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">Edit full cover letter (single block)</Label>
      </div>
      <Textarea
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          setDraft(v);
          const { head, body, footer } = splitIntoHeadBodyFooter(v);
          setCoverLetterData((prev: CoverLetterData) => ({
            ...prev,
            head,
            body,
            footer,
          }));
        }}
        className="min-h-[360px] resize-none font-mono text-xs"
        placeholder="Write your cover letter here. Start with a greeting, then body, then sign-off."
      />
    </div>
  );
}

