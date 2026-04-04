import { describe, expect, it } from "vitest";
import { toVideoEmbedSrc } from "@/lib/chat-onboarding-video";

describe("toVideoEmbedSrc", () => {
  it("returns null for empty", () => {
    expect(toVideoEmbedSrc("")).toBeNull();
    expect(toVideoEmbedSrc(null)).toBeNull();
  });

  it("passes through embed URLs", () => {
    expect(toVideoEmbedSrc("https://www.youtube.com/embed/abc123")).toContain("youtube.com/embed/abc123");
  });

  it("converts watch URLs", () => {
    expect(toVideoEmbedSrc("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("converts youtu.be", () => {
    expect(toVideoEmbedSrc("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });
});
