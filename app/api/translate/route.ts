import type { NextRequest } from "next/server";
import { TRANSLATION_ORIGINAL } from "@/lib/translation";

type Body = {
  text?: string;
  texts?: string[];
  targetLanguage?: string;
  /** Optional ISO code; forwarded when supported */
  sourceLanguage?: string;
};

const MAX_SINGLE = 4500;
const MAX_TOTAL = 48000;

function clipSingle(s: string): string {
  const t = s.trim();
  if (t.length <= MAX_SINGLE) return t;
  return t.slice(0, MAX_SINGLE);
}

/** Google Cloud Translation API v2 (batch-capable): https://cloud.google.com/translate/docs/reference/rest/v2/translate */
async function translateGoogleV2(parts: string[], target: string, source?: string): Promise<string[]> {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!key || !parts.length) return parts;

  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`;
  const body: Record<string, unknown> = {
    q: parts,
    target,
    format: "text",
  };
  if (source && source !== "auto") body.source = source;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    data?: { translations?: { translatedText: string }[] };
  };

  if (!res.ok) {
    throw new Error(data.error?.message || `Google Translate ${res.status}`);
  }
  const list = data.data?.translations;
  if (!Array.isArray(list) || list.length !== parts.length) {
    throw new Error("Unexpected Google Translate response shape");
  }
  return list.map((t) => t.translatedText ?? "");
}

/** LibreTranslate-compatible HTTP API (many public instances enforce auth / rate limits). */
async function translateLibreOne(text: string, target: string, source: string): Promise<string> {
  const rawBase = process.env.LIBRETRANSLATE_URL?.trim();
  if (!rawBase) throw new Error("LIBRETRANSLATE_URL is missing");
  const endpoint = rawBase.replace(/\/$/, "").replace(/\/translate$/, "");
  const url = `${endpoint}/translate`;
  const apiKey = process.env.LIBRETRANSLATE_API_KEY ?? "";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: source === "auto" ? "auto" : source,
      target,
      ...(apiKey ? { api_key: apiKey } : {}),
      format: "text",
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    translatedText?: string;
  };
  if (!res.ok) throw new Error(data.error || `LibreTranslate ${res.status}`);
  if (!data.translatedText) throw new Error(data.error || "LibreTranslate: empty response");
  return data.translatedText;
}

async function translateLibre(parts: string[], target: string, source?: string): Promise<string[]> {
  const src = source && source.trim() ? source.trim() : "auto";
  const out: string[] = [];
  for (const chunk of parts) {
    /* Serial to avoid hammering rate limits */
    // eslint-disable-next-line no-await-in-loop
    out.push(await translateLibreOne(chunk, target, src));
  }
  return out;
}

/** Free fallback Google Translate client endpoint */
async function translateGoogleFree(parts: string[], target: string, source?: string): Promise<string[]> {
  const src = source && source !== "auto" ? source : "auto";
  const out: string[] = [];
  for (const chunk of parts) {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(src)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(chunk)}`;
      const res = await fetch(url);
      if (!res.ok) {
        out.push(chunk);
        continue;
      }
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map((item: any) => item[0]).filter(Boolean).join("");
        out.push(translated || chunk);
      } else {
        out.push(chunk);
      }
    } catch {
      out.push(chunk);
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const targetLanguage = typeof body.targetLanguage === "string" ? body.targetLanguage.trim() : "";
  const sourceLanguage = typeof body.sourceLanguage === "string" ? body.sourceLanguage.trim() : undefined;

  const rawPieces: string[] = [];
  if (Array.isArray(body.texts) && body.texts.length > 0) {
    for (const t of body.texts) {
      if (typeof t === "string" && t.trim()) rawPieces.push(clipSingle(t));
    }
  } else if (typeof body.text === "string" && body.text.trim()) {
    rawPieces.push(clipSingle(body.text));
  }

  let totalChars = 0;
  const parts: string[] = [];
  for (const p of rawPieces) {
    if (!p) continue;
    if (totalChars + p.length > MAX_TOTAL) break;
    totalChars += p.length;
    parts.push(p);
  }

  if (!parts.length || !targetLanguage) {
    return new Response(JSON.stringify({ error: "Missing text/texts or targetLanguage" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (targetLanguage === TRANSLATION_ORIGINAL) {
    return Response.json({
      translatedText: parts.length === 1 ? parts[0] : undefined,
      translations: parts,
      engine: "original",
    });
  }

  try {
    if (process.env.GOOGLE_TRANSLATE_API_KEY) {
      const translations = await translateGoogleV2(parts, targetLanguage, sourceLanguage);
      return Response.json({
        translatedText: translations.length === 1 ? translations[0] : undefined,
        translations,
        engine: "google-official",
      });
    }

    const libreBase = process.env.LIBRETRANSLATE_URL?.trim();
    if (libreBase) {
      const translations = await translateLibre(parts, targetLanguage, sourceLanguage);
      return Response.json({
        translatedText: translations.length === 1 ? translations[0] : undefined,
        translations,
        engine: "libre",
      });
    }

    // Default to free Google Translate client endpoint
    const translations = await translateGoogleFree(parts, targetLanguage, sourceLanguage);
    return Response.json({
      translatedText: translations.length === 1 ? translations[0] : undefined,
      translations,
      engine: "google-free",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Translation failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
