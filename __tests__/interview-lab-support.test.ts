import { describe, expect, it } from "vitest";

import { getMultiModelDocsUrl } from "@/lib/multi-model-docs";
import { getDefaultInterviewLabModelId, isInterviewLabCompatibleModel } from "@/lib/interview-lab-model-support";

describe("Interview Lab support helpers", () => {
  it("detects gemini models as compatible", () => {
    expect(isInterviewLabCompatibleModel("gemini-2.5-flash")).toBe(true);
    expect(isInterviewLabCompatibleModel("Gemini-2.0-Flash")).toBe(true);
    expect(isInterviewLabCompatibleModel("gpt-4o")).toBe(false);
    expect(isInterviewLabCompatibleModel("")).toBe(false);
  });

  it("provides a stable default Gemini model id", () => {
    expect(getDefaultInterviewLabModelId()).toMatch(/gemini/i);
  });
});

describe("Multi-model docs URL", () => {
  it("returns a non-empty URL string", () => {
    const url = getMultiModelDocsUrl();
    expect(typeof url).toBe("string");
    expect(url.length).toBeGreaterThan(8);
  });
});

