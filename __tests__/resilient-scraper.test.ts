import { describe, it, expect, vi, beforeEach } from "vitest";
import { resilientScrape } from "@/lib/scrapers/resilient-scraper";

describe("Resilient Scraper Pipeline", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("successfully scrapes direct HTML when response is clean and fast", async () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>Senior Frontend Engineer - TechCorp</title></head>
        <body>
          <h1>Join our Engineering Team</h1>
          <p>We are seeking a Senior TypeScript and React engineer with cloud knowledge in AWS and Docker.</p>
          <p>You will lead modern architecture, CI/CD pipelines, and scale distributed frontend platforms.</p>
        </body>
      </html>
    `;

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => mockHtml,
    } as any);

    const plan = await resilientScrape("https://techcorp.example.com/careers/swe");

    expect(plan.status).toBe("completed");
    expect(plan.chosenProvider).toBe("direct");
    expect(plan.extractedData.title).toContain("Senior Frontend Engineer");
    expect(plan.extractedData.keywords).toContain("TypeScript");
    expect(plan.extractedData.keywords).toContain("React");
    expect(plan.steps[0].status).toBe("success");
    expect(plan.confidenceScore).toBeGreaterThanOrEqual(0.9);
  });

  it("escalates to external fallback when direct scrape is blocked or encounters Cloudflare challenge", async () => {
    // Direct fetch returns Cloudflare block
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (typeof url === "string" && url.includes("cloudflare-blocked")) {
        return Promise.resolve({
          ok: false,
          status: 403,
          text: async () => "<html><title>Attention Required! | Cloudflare</title><body>cf-browser-verification</body></html>",
        });
      }
      return Promise.reject(new Error("Network failed"));
    });

    const plan = await resilientScrape("https://cloudflare-blocked.example.com/job/123", {
      apiKeyFirecrawl: "test-fc-mock",
    });

    expect(plan.status).toBe("completed");
    expect(plan.steps[0].status).toBe("fallback");
  });
});
