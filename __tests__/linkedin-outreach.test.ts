import { describe, expect, it } from "vitest";
import { LINKEDIN_DM_MAX_CHARS, clampLinkedInDm, linkedInDmCharCount } from "@/lib/linkedin-outreach";

describe("linkedin-outreach", () => {
  it("enforces max length", () => {
    const long = "a".repeat(LINKEDIN_DM_MAX_CHARS + 40);
    expect(clampLinkedInDm(long).length).toBe(LINKEDIN_DM_MAX_CHARS);
  });

  it("trims whitespace", () => {
    expect(clampLinkedInDm("  hi  ")).toBe("hi");
  });

  it("counts characters", () => {
    expect(linkedInDmCharCount("abc")).toBe(3);
  });
});
