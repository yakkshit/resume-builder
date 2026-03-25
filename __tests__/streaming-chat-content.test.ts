import { describe, it, expect } from "vitest";
import { isLikelyJsonEnvelope, stripIncompleteJsonTail } from "@/lib/streaming-chat-content";

describe("isLikelyJsonEnvelope", () => {
  it("matches component and resumeData envelopes", () => {
    expect(isLikelyJsonEnvelope('{"component":"cv"}')).toBe(true);
    expect(isLikelyJsonEnvelope('{\n  "resumeData": {')).toBe(true);
    expect(isLikelyJsonEnvelope('{"componentType":"mockInterview"}')).toBe(true);
  });

  it("does not match arbitrary braces", () => {
    expect(isLikelyJsonEnvelope('{"foo":"bar"}')).toBe(false);
    expect(isLikelyJsonEnvelope("{ not json")).toBe(false);
  });
});

describe("stripIncompleteJsonTail", () => {
  it("returns text unchanged when not streaming", () => {
    expect(stripIncompleteJsonTail('{"resumeData":', false)).toBe('{"resumeData":');
  });

  it("hides incomplete JSON from first brace when streaming", () => {
    expect(stripIncompleteJsonTail('{"resumeData": {"basicInfo":', true)).toBe("");
  });

  it("keeps prose before incomplete JSON", () => {
    expect(stripIncompleteJsonTail('Here is your CV.\n\n{"resumeData":', true)).toBe("Here is your CV.");
  });

  it("returns full text when JSON parses", () => {
    const full = '{"resumeData":{"basicInfo":{"name":"A"}}}';
    expect(stripIncompleteJsonTail(full, true)).toBe(full);
  });

  it("does not strip non-envelope JSON", () => {
    expect(stripIncompleteJsonTail('{"foo":1}', true)).toBe('{"foo":1}');
  });
});
