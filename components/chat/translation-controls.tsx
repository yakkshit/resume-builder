"use client";

import { Languages } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TRANSLATION_LANGUAGES,
  TRANSLATION_ORIGINAL,
} from "@/lib/translation";

export function TranslationControls({
  value,
  disabled,
  isTranslating,
  onChange,
  id,
}: {
  value: string;
  disabled?: boolean;
  isTranslating?: boolean;
  onChange: (language: string) => void;
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/25 px-2.5 py-1.5">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <Label htmlFor={id} className="text-[11px] font-medium whitespace-nowrap">
          View in
        </Label>
      </div>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-label="Translation language"
          className="h-8 min-w-[140px] max-w-[200px] rounded-lg border-border/60 bg-background text-[11px]"
        >
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent className="max-h-[280px]" position="popper">
          <SelectItem value={TRANSLATION_ORIGINAL} className="text-xs">
            Original
          </SelectItem>
          {TRANSLATION_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="text-xs">
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isTranslating ? (
        <span className="text-[10px] text-muted-foreground animate-pulse">Translating…</span>
      ) : null}
    </div>
  );
}
