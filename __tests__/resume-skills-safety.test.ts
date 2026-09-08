import { describe, it, expect } from "vitest";
import { sanitizeResumeData, mergeResumeDataWithDefault } from "@/lib/sanitize-resume-data";
import { deepMerge } from "@/lib/utils";
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

  it("normalizes categorized AI skills { name, keywords }[] into displayable strings", () => {
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
      skills: [
        { name: "Programming", keywords: ["Java", "TypeScript"] },
        { name: "Cloud", keywords: ["AWS", "Azure"] },
      ],
      projects: [],
      achievements: [],
    } as unknown as ResumeData;

    const result = sanitizeResumeData(input);
    expect(result.skills).toEqual([
      "Programming: Java, TypeScript",
      "Cloud: AWS, Azure",
    ]);
  });

  it("normalizes dictionary categorized skills into formatted string array", () => {
    const input = {
      skills: {
        "AI & Agentic Systems": ["LangChain", "LangGraph", "PyTorch"],
        "Backend & Cloud": ["Python", "FastAPI", "Docker"],
        Frontend: ["Next.js", "React", "TypeScript"],
      },
    };

    const result = sanitizeResumeData(input);
    expect(result.skills).toEqual([
      "AI & Agentic Systems: LangChain, LangGraph, PyTorch",
      "Backend & Cloud: Python, FastAPI, Docker",
      "Frontend: Next.js, React, TypeScript",
    ]);
  });

  it("strips numerical prefixes like '0: 0: 0: JavaScript' and repairs corrupted skills", () => {
    const input = {
      skills: [
        "0: 0: 0: 0: 0: 0: 0: JavaScript",
        "1: 1: 1: 1: 1: 1: 1: 1: TypeScript",
        "2: 2: 2: 2: 2: 2: 2: 2: React",
      ],
    };

    const result = sanitizeResumeData(input);
    expect(result.skills).toEqual(["JavaScript", "TypeScript", "React"]);
  });

  it("deepMerge properly replaces target string[] skills with incoming categorized skills", () => {
    const base = {
      basicInfo: { name: "John Doe" },
      skills: ["JavaScript", "TypeScript", "React"],
    };
    const incoming = {
      skills: {
        "AI & Agentic Systems": ["LangChain", "LangGraph"],
        "Backend & Cloud": ["Python", "FastAPI"],
      },
    };

    const merged = deepMerge(base, incoming);
    expect(merged.skills).toEqual([
      "AI & Agentic Systems: LangChain, LangGraph",
      "Backend & Cloud: Python, FastAPI",
    ]);
  });
});

