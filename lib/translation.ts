export type TranslationLanguage = {
  code: string;
  label: string;
};

export const TRANSLATION_ORIGINAL = "__original__";

export const TRANSLATION_LANGUAGES: TranslationLanguage[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese (Simplified)" },
];

export const DEFAULT_TRANSLATION_LANGUAGE = "en";

function looksLikeUrlEmailOrHandle(text: string): boolean {
  const v = text.trim();
  if (!v) return true;
  if (/^https?:\/\//i.test(v)) return true;
  if (/^data:/i.test(v)) return true;
  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v)) return true;
  if (/^[@#][\w.-]+$/.test(v)) return true;
  return false;
}

export function canTranslateString(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (v.length < 2) return false;
  if (looksLikeUrlEmailOrHandle(v)) return false;
  return true;
}

async function translateInBrowser(strings: string[], targetLanguage: string): Promise<Map<string, string>> {
  try {
    const { translateWithBergamot } = await import("@/lib/bergamot-translator-client");
    return translateWithBergamot(strings, targetLanguage);
  } catch {
    const map = new Map<string, string>();
    for (const s of strings) map.set(s, s);
    return map;
  }
}

async function translateViaApi(strings: string[], targetLanguage: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: strings, targetLanguage }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.translations) && data.translations.length === strings.length) {
        strings.forEach((str, i) => {
          map.set(str, data.translations[i] || str);
        });
        return map;
      }
    }
  } catch (err) {
    console.warn("API translation fallback failed:", err);
  }
  for (const s of strings) map.set(s, s);
  return map;
}

/**
 * Chat card translation: WASM Bergamot with seamless /api/translate fallback.
 */
export async function translateStringListSmart(
  uniqueStrings: string[],
  targetLanguage: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (targetLanguage === TRANSLATION_ORIGINAL) {
    for (const s of uniqueStrings) map.set(s, s);
    return map;
  }

  const toSend = uniqueStrings.filter((s) => canTranslateString(s));
  const untouched = uniqueStrings.filter((s) => !canTranslateString(s));
  for (const s of untouched) map.set(s, s);

  if (!toSend.length) return map;

  if (typeof window === "undefined") {
    for (const s of toSend) map.set(s, s);
    return map;
  }

  let translated = await translateInBrowser(toSend, targetLanguage);
  
  // If Bergamot was unable to translate (or returned identical strings), fallback to server translation
  const untranslated = toSend.filter((s) => !translated.has(s) || translated.get(s) === s);
  if (untranslated.length > 0) {
    const apiMap = await translateViaApi(untranslated, targetLanguage);
    for (const [k, v] of apiMap.entries()) {
      translated.set(k, v);
    }
  }

  for (const s of toSend) {
    map.set(s, translated.get(s) ?? s);
  }
  return map;
}

function remapStrings<T>(input: T, lookup: Map<string, string>): T {
  const walk = (value: unknown): unknown => {
    if (typeof value === "string") {
      const next = lookup.get(value);
      return next ?? value;
    }
    if (Array.isArray(value)) return value.map((v) => walk(v));
    if (value && typeof value === "object") {
      const entries = Object.entries(value as Record<string, unknown>);
      const out: Record<string, unknown> = {};
      for (const [k, v] of entries) out[k] = walk(v);
      return out;
    }
    return value;
  };
  return walk(input) as T;
}

export async function translateDataDeep<T>(input: T, targetLanguage: string): Promise<T> {
  if (input == null || targetLanguage === TRANSLATION_ORIGINAL) {
    return input;
  }

  const seen = new Set<string>();
  const collect = (value: unknown) => {
    if (typeof value === "string" && canTranslateString(value)) seen.add(value);
    else if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === "object" && !Array.isArray(value))
      Object.values(value as Record<string, unknown>).forEach(collect);
  };
  collect(input);

  const unique = [...seen];
  if (!unique.length) return input;

  const lookup = await translateStringListSmart(unique, targetLanguage);
  return remapStrings(input, lookup);
}

export async function translateTextSmart(text: string, targetLanguage: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (targetLanguage === TRANSLATION_ORIGINAL) return text;

  const m = await translateStringListSmart([trimmed], targetLanguage);
  return m.get(trimmed) ?? trimmed;
}

function isLatexDelimiterChar(ch: string): boolean {
  return ch === "\\" || ch === "{" || ch === "}" || ch === "$";
}

function looksTranslatableLatexSegment(seg: string): boolean {
  const s = seg.trim();
  if (!s) return false;
  // Avoid translating short tokens or mostly-symbol segments.
  if (s.length < 3) return false;
  // If it contains no letters at all, skip.
  if (!/[A-Za-z\u00C0-\u024F]/.test(s)) return false;
  return canTranslateString(s);
}

function splitLatexSegmentForTranslate(seg: string): string[] {
  const s = seg.trim();
  if (!s) return [];
  // Keep pieces fairly small so language detection/translation behaves better.
  const max = 360;
  const out: string[] = [];
  let cur = "";
  const push = () => {
    const t = cur.trim();
    if (t) out.push(t);
    cur = "";
  };
  const tokens = s.split(/(\s+|[.!?]+|\n+)/);
  for (const tok of tokens) {
    if (!tok) continue;
    if ((cur + tok).length > max) push();
    cur += tok;
  }
  push();
  // De-dupe while preserving order.
  const seen = new Set<string>();
  return out.filter((x) => (seen.has(x) ? false : (seen.add(x), true)));
}

/**
 * Best-effort LaTeX translation that avoids touching commands.
 * It translates "plain text" runs between `\`, `{}`, and `$` delimiters.
 */
export async function translateLatexSmart(source: string, targetLanguage: string): Promise<string> {
  if (!source || targetLanguage === TRANSLATION_ORIGINAL) return source;
  if (typeof window === "undefined") return source;

  // Extract plain segments.
  const segments: { start: number; end: number; text: string }[] = [];
  let start = 0;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (isLatexDelimiterChar(ch)) {
      if (i > start) {
        const text = source.slice(start, i);
        if (looksTranslatableLatexSegment(text)) segments.push({ start, end: i, text });
      }
      start = i + 1;
    }
  }
  if (start < source.length) {
    const text = source.slice(start);
    if (looksTranslatableLatexSegment(text)) segments.push({ start, end: source.length, text });
  }
  if (!segments.length) return source;

  // Build translation units.
  const units: string[] = [];
  for (const seg of segments) {
    for (const u of splitLatexSegmentForTranslate(seg.text)) units.push(u);
  }
  const uniqueUnits = [...new Set(units)];
  if (!uniqueUnits.length) return source;

  const lookup = await translateStringListSmart(uniqueUnits, targetLanguage);

  // Apply translations by replacing within each segment (only exact unit matches).
  let out = "";
  let cursor = 0;
  for (const seg of segments) {
    out += source.slice(cursor, seg.start);
    let block = seg.text;
    for (const unit of splitLatexSegmentForTranslate(seg.text)) {
      const translated = lookup.get(unit);
      if (translated && translated !== unit) {
        // Replace first occurrence; units are derived from the segment itself.
        block = block.replace(unit, translated);
      }
    }
    out += block;
    cursor = seg.end;
  }
  out += source.slice(cursor);
  return out;
}
