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
let bergamotUnavailable = false;

const BERGAMOT_SUPPORTED_LANGUAGES = new Set([
  "en",
  "es",
  "de",
  "fr",
  "it",
  "pt",
  "nl",
  "pl",
  "ru",
]);

async function safeDeleteBatchTranslator(translator: any): Promise<void> {
  if (!translator) return;
  try {
    if (Array.isArray(translator.workers)) {
      for (const item of translator.workers) {
        try {
          if (item && item.worker && typeof item.worker.terminate === "function") {
            item.worker.terminate();
          }
        } catch {
          // ignore
        }
      }
      translator.workers = [];
    }
    if (typeof translator.delete === "function") {
      await Promise.resolve(translator.delete()).catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function patchBergamotPrototypes(BatchTranslator: any, TranslatorBacking?: any): void {
  if (BatchTranslator && !BatchTranslator.prototype.__patchedDelete) {
    BatchTranslator.prototype.__patchedDelete = true;
    BatchTranslator.prototype.delete = async function (this: any) {
      try {
        if (typeof this.remove === "function") {
          this.remove(() => true);
        }
      } catch {
        // ignore
      }
      if (Array.isArray(this.workers)) {
        for (const item of this.workers) {
          try {
            if (item && item.worker && typeof item.worker.terminate === "function") {
              item.worker.terminate();
            }
          } catch {
            // ignore
          }
        }
        this.workers = [];
      }
    };
  }

  if (TranslatorBacking && !TranslatorBacking.prototype.__patched) {
    TranslatorBacking.prototype.__patched = true;
    TranslatorBacking.prototype.loadWorker = async function (this: any) {
      const workerUrl =
        this.options?.workerUrl ||
        (typeof window !== "undefined"
          ? new URL("/bergamot/translator-worker.js", window.location.origin).toString()
          : "/bergamot/translator-worker.js");

      const worker = new Worker(workerUrl);

      let serial = 0;
      const pending = new Map<number, { accept: (val: any) => void; reject: (err: Error) => void; callsite: { message: string; stack?: string } }>();

      const call = (name: string, ...args: unknown[]) =>
        new Promise((accept, reject) => {
          const id = ++serial;
          pending.set(id, {
            accept,
            reject,
            callsite: {
              message: `${name}(${args.map((arg) => String(arg)).join(", ")})`,
              stack: new Error().stack,
            },
          });
          worker.postMessage({ id, name, args });
        });

      worker.addEventListener("message", function ({ data: { id, result, error } }: any) {
        if (!pending.has(id)) return;
        const entry = pending.get(id)!;
        pending.delete(id);
        if (error !== undefined) {
          entry.reject(
            Object.assign(new Error(), error, {
              message: (error?.message || String(error)) + ` (response to ${entry.callsite.message})`,
              stack: error?.stack ? `${error.stack}\n${entry.callsite.stack}` : entry.callsite.stack,
            })
          );
        } else {
          entry.accept(result);
        }
      });

      worker.addEventListener("error", (err) => {
        if (typeof this.onerror === "function") {
          try {
            this.onerror(err);
          } catch {
            // ignore
          }
        }
      });

      await call("initialize", this.options);

      return {
        worker,
        exports: new Proxy(
          {},
          {
            get(target, name) {
              if (name !== "then") return (...args: unknown[]) => call(name as string, ...args);
            },
          }
        ),
      } as any;
    };
  }
}

// Eagerly patch if the module can be loaded
import("@browsermt/bergamot-translator/translator.js")
  .then(({ BatchTranslator, TranslatorBacking }) => {
    patchBergamotPrototypes(BatchTranslator, TranslatorBacking);
  })
  .catch(() => {});

async function getBatchTranslator(): Promise<InstanceType<BergPack["BatchTranslator"]>> {
  if (batchTranslator) return batchTranslator;
  const { BatchTranslator, TranslatorBacking } = await import("@browsermt/bergamot-translator/translator.js");

  patchBergamotPrototypes(BatchTranslator, TranslatorBacking);

  const workerUrl =
    typeof window !== "undefined"
      ? new URL("/bergamot/translator-worker.js", window.location.origin).toString()
      : undefined;

  batchTranslator = new BatchTranslator({
    pivotLanguage: "en",
    downloadTimeout: 30_000,
    batchSize: 12,
    workers: 1,
    ...(workerUrl ? { workerUrl } : {}),
    onerror: (err) => {
      console.warn("[bergamot] worker error:", err);
      bergamotUnavailable = true;
      const current = batchTranslator;
      batchTranslator = null;
      if (current) {
        void safeDeleteBatchTranslator(current);
      }
    },
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

  // If Bergamot was flagged unavailable or if languages are outside Bergamot's supported set,
  // skip Bergamot immediately so translateStringListSmart uses /api/translate with zero delay.
  if (
    bergamotUnavailable ||
    !BERGAMOT_SUPPORTED_LANGUAGES.has(to) ||
    !BERGAMOT_SUPPORTED_LANGUAGES.has(from)
  ) {
    return map;
  }

  let translator;
  try {
    translator = await getBatchTranslator();
  } catch (e) {
    console.warn("[bergamot] init failed, resetting and falling back", e);
    bergamotUnavailable = true;
    const current = batchTranslator;
    batchTranslator = null;
    if (current) {
      void safeDeleteBatchTranslator(current);
    }
    return map;
  }

  // Wrap with a timeout (6s) so it never hangs UI translation indefinitely
  const timeoutMs = 6_000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Bergamot translation timed out")), timeoutMs);
  });

  try {
    const translationPromise = Promise.all(
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
      })
    );

    const results = await Promise.race([translationPromise, timeoutPromise]);
    for (const { s, out } of results) map.set(s, out);
    return map;
  } catch (err) {
    console.warn("[bergamot] translation failed or timed out, resetting and falling back", err);
    bergamotUnavailable = true;
    const current = batchTranslator;
    batchTranslator = null;
    if (current) {
      void safeDeleteBatchTranslator(current);
    }
    return map;
  }
}
