"use client";

import { useMemo } from "react";
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
  compact = false,
  flagOnly = false,
}: {
  value: string;
  disabled?: boolean;
  isTranslating?: boolean;
  onChange: (language: string) => void;
  id?: string;
  compact?: boolean;
  flagOnly?: boolean;
}) {
  const currentLang = useMemo(() => {
    if (value === TRANSLATION_ORIGINAL) return null;
    return TRANSLATION_LANGUAGES.find((l) => l.code === value) ?? null;
  }, [value]);

  return (
    <div
      className={
        flagOnly
          ? "flex items-center shrink-0"
          : compact
            ? "flex items-center gap-1.5 shrink-0"
            : "flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-muted/25 px-2.5 py-1.5 transition-all"
      }
    >
      {!compact && !flagOnly && (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <Label htmlFor={id} className="text-[11px] font-medium whitespace-nowrap">
            View in
          </Label>
        </div>
      )}
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-label="Translation language"
          title={currentLang ? `${currentLang.label} (${currentLang.code})` : "Original (Auto)"}
          className={
            flagOnly
              ? "h-8 w-[58px] sm:w-[62px] text-xs rounded-lg border-border/70 bg-background/80 hover:bg-background backdrop-blur px-2 focus:ring-0 gap-1 font-medium transition-colors shrink-0"
              : compact
                ? "h-8 text-xs min-w-[115px] sm:min-w-[130px] max-w-[160px] rounded-lg border-border/70 bg-background/70 hover:bg-background backdrop-blur px-2.5 focus:ring-0 gap-1.5 font-medium transition-colors"
                : "h-8 min-w-[135px] sm:min-w-[155px] max-w-[195px] rounded-lg border-border/60 bg-background text-xs px-2.5 gap-1.5"
          }
        >
          {flagOnly ? (
            <div className="flex items-center justify-center shrink-0">
              {currentLang ? (
                <span className="text-base shrink-0 leading-none" role="img" aria-label={currentLang.label}>
                  {currentLang.flag}
                </span>
              ) : (
                <span className="text-sm shrink-0 leading-none" role="img" aria-label="Original">
                  🌐
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0 truncate text-left">
              {currentLang ? (
                <>
                  <span className="text-xs shrink-0" role="img" aria-label={currentLang.label}>
                    {currentLang.flag}
                  </span>
                  <span className="truncate">{currentLang.label}</span>
                  <span className="text-[10px] text-muted-foreground uppercase shrink-0 font-mono">
                    ({currentLang.code})
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs shrink-0" role="img" aria-label="Original">
                    🌐
                  </span>
                  <span className="truncate">Original</span>
                </>
              )}
            </div>
          )}
        </SelectTrigger>
        <SelectContent
          className="max-h-[280px] sm:max-h-[320px] overflow-y-auto w-[210px] sm:w-[230px] p-1 shadow-2xl rounded-xl border-border/60 bg-popover/95 backdrop-blur-md"
          position="popper"
          style={{ scrollbarWidth: "thin" }}
        >
          <SelectItem value={TRANSLATION_ORIGINAL} className="text-xs py-1.5 px-2 rounded-lg cursor-pointer">
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0" role="img" aria-label="Original">
                  🌐
                </span>
                <span className="truncate font-medium">Original</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                Auto
              </span>
            </div>
          </SelectItem>

          <div className="my-1 border-t border-border/40" />

          {TRANSLATION_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code} className="text-xs py-1.5 px-2 rounded-lg cursor-pointer">
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm shrink-0" role="img" aria-label={lang.label}>
                    {lang.flag}
                  </span>
                  <span className="truncate font-medium">{lang.label}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted/80 text-muted-foreground shrink-0">
                  {lang.code}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
