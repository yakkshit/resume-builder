import { describe, it, expect } from "vitest";
import { sanitizeResumeData, mergeResumeDataWithDefault } from "@/lib/sanitize-resume-data";
import type { ResumeData } from "@/lib/types";

describe("resume skills safety", () => {
  it("never returns non-array skills (prevents `skills.map` crash)", () => {
    const input = {
      basicInfo: {
        name: "Test",
        title: "Engineer",
        email: "",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
        summary: "",
      },
      experience: [],
      education: [],
      // The problematic shape: skills is sometimes an object/string
      skills: { javascript: true, typescript: true },
      projects: [],
      achievements: [],
    } as unknown as ResumeData;

    const result = sanitizeResumeData(input);
    expect(Array.isArray(result.skills)).toBe(true);
    expect(result.skills).toEqual([]);
  });

  it("mergeResumeDataWithDefault falls back to default skills safely", () => {
    const incoming = {
      // incoming.skills may be invalid in some AI payloads
      skills: { anything: "not-an-array" },
    } as unknown;

    const merged = mergeResumeDataWithDefault(incoming);
    expect(Array.isArray(merged.skills)).toBe(true);
  });
});

