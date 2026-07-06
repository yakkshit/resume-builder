"use client";

import { franc } from "franc-min";

const MAX_CHARS = 5000;

const FRANC_ISO3_ALLOWED = ["eng", "spa", "fra", "deu", "ita", "por", "hin", "tel", "ara", "jpn", "zho", "cmn"] as const;

const ISO3_TO_BERGAMOT: Record<string, string> = {
  und: "en",
  eng: "en",
  spa: "es",
  fra: "fr",
  deu: "de",
  ita: "it",
  por: "pt",
  hin: "hi",
  tel: "te",
  ara: "ar",
  jpn: "ja",
  zho: "zh",
  cmn: "zh",
};

function inferSourceLang(texts: string[]): string {
  const sample = texts.join("\n\n").slice(0, 2048);
  if (sample.trim().length < 32) return "en";
  try {
    const iso3 = franc(sample, {
      minLength: 32,
      only: [...FRANC_ISO3_ALLOWED],
    });
    return ISO3_TO_BERGAMOT[iso3] ?? "en";
  } catch {
    return "en";
  }
}

/** Registry-aligned target codes (Chinese → `zh`). */
function normalizeTarget(lang: string): string {
  const c = lang.trim().toLowerCase();
  if (c === "zh-cn" || c === "zh_cn") return "zh";
  return c;
}

function clip(text: string): string {
  const t = text.trim();
  if (t.length <= MAX_CHARS) return t;
  return t.slice(0, MAX_CHARS);
}

type BergPack = typeof import("@browsermt/bergamot-translator/translator.js");

let batchTranslator: InstanceType<BergPack["BatchTranslator"]> | null = null;

async function getBatchTranslator(): Promise<InstanceType<BergPack["BatchTranslator"]>> {
  if (batchTranslator) return batchTranslator;
  const { BatchTranslator } = await import("@browsermt/bergamot-translator/translator.js");

  // Next.js (especially Turbopack) can break `import.meta.url` based worker resolution.
  // Serving worker assets from /public keeps URLs stable.
  const workerUrl =
    typeof window !== "undefined"
      ? new URL("/bergamot/translator-worker.js", window.location.origin).toString()
      : undefined;
  batchTranslator = new BatchTranslator({
    pivotLanguage: "en",
    downloadTimeout: 180_000,
    batchSize: 12,
    workers: 1,
    ...(workerUrl ? { workerUrl } : {}),
  });
  return batchTranslator;
}

/**
 * WASM translation in the browser (Mozilla Bergamot). No API keys, no GTX.
 */
export async function translateWithBergamot(strings: string[], targetLanguage: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const to = normalizeTarget(targetLanguage);
  if (!strings.length) return map;

  const from = inferSourceLang(strings);
  if (from === to) {
    for (const s of strings) map.set(s, s);
    return map;
  }

  let translator;
  try {
    translator = await getBatchTranslator();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[bergamot] init failed", e);
    for (const s of strings) map.set(s, s);
    return map;
  }

  const results = await Promise.all(
    strings.map(async (s) => {
      const input = clip(s);
      try {
        const res = await translator.translate({
          from,
          to,
          text: input,
          html: false,
          priority: 0,
        });
        const out = res?.target?.text?.trim();
        return { s, out: out && out.length ? out : s };
      } catch {
        return { s, out: s };
      }
    }),
  );

  for (const { s, out } of results) map.set(s, out);
  return map;
}
