import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  TRANSLATION_ORIGINAL,
  canTranslateString,
  translateDataDeep,
  translateStringListSmart,
} from "@/lib/translation";
import { translateWithBergamot } from "@/lib/bergamot-translator-client";

describe("Translation switching resilience and error handling", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("canTranslateString filters correctly", () => {
    expect(canTranslateString("")).toBe(false);
    expect(canTranslateString("a")).toBe(false);
    expect(canTranslateString("https://example.com")).toBe(false);
    expect(canTranslateString("user@test.com")).toBe(false);
    expect(canTranslateString("Software Engineer")).toBe(true);
  });

  it("safely handles translateDataDeep with original language", async () => {
    const resume = {
      basicInfo: {
        name: "Alex Smith",
        title: "Senior Full Stack Engineer",
        summary: "Passionate developer building resilient systems.",
      },
      skills: ["TypeScript", "Next.js"],
    };

    const original = await translateDataDeep(resume, TRANSLATION_ORIGINAL);
    expect(original).toEqual(resume);
  });

  it("handles repeated language switches back and forth without crashing", async () => {
    // Mock fetch for /api/translate
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url, init) => {
      if (typeof url === "string" && url.includes("/api/translate")) {
        const body = JSON.parse(init.body);
        const { texts, targetLanguage } = body;
        return {
          ok: true,
          json: async () => ({
            translations: texts.map((t: string) => `[${targetLanguage}] ${t}`),
          }),
        };
      }
      return originalFetch(url, init);
    });

    try {
      const data = {
        title: "Staff Engineer",
        summary: "Designed and delivered microservices architecture.",
      };

      // Switch 1: Original -> German
      const de = await translateDataDeep(data, "de");
      expect(de.title).toContain("Staff Engineer");

      // Switch 2: German -> Spanish
      const es = await translateDataDeep(data, "es");
      expect(es.title).toContain("Staff Engineer");

      // Switch 3: Switch back to Original
      const backOriginal = await translateDataDeep(data, TRANSLATION_ORIGINAL);
      expect(backOriginal).toEqual(data);

      // Switch 4: Original -> French
      const fr = await translateDataDeep(data, "fr");
      expect(fr.title).toContain("Staff Engineer");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("BatchTranslator delete monkey-patch never throws on undefined worker", async () => {
    const { BatchTranslator } = await import("@browsermt/bergamot-translator/translator.js");

    // Create a mock translator instance with broken worker items (mimicking failed loadWorker)
    const mockTranslator = {
      workers: [
        { idle: false }, // worker property is undefined!
        { idle: true, worker: undefined },
        {
          idle: false,
          worker: {
            terminate: vi.fn(),
          },
        },
      ],
      remove: vi.fn(),
    };

    // Calling the patched delete should not throw Cannot read properties of undefined (reading 'terminate')
    await expect(BatchTranslator.prototype.delete.call(mockTranslator)).resolves.not.toThrow();
    expect(mockTranslator.workers).toEqual([]);
  });

  it("translateWithBergamot returns gracefully when language is unsupported", async () => {
    // Bergamot does not support Hindi or Telugu
    const res = await translateWithBergamot(["Hello world"], "hi");
    expect(res).toBeInstanceOf(Map);
    expect(res.size).toBe(0);
  });
});
