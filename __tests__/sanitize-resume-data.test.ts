import { describe, it, expect } from "vitest"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import type { ResumeData } from "@/lib/types"

describe("sanitizeResumeData", () => {
  it("returns empty strings for null/undefined basicInfo", () => {
    const input = {} as ResumeData
    const result = sanitizeResumeData(input)
    expect(result.basicInfo.name).toBe("")
    expect(result.basicInfo.email).toBe("")
    expect(result.basicInfo.summary).toBe("")
  })

  it("preserves string values in basicInfo", () => {
    const input: ResumeData = {
      basicInfo: {
        name: "Jane Doe",
        title: "Engineer",
        email: "jane@example.com",
        phone: "",
        location: "",
        linkedin: "",
        website: "",
        summary: "A great developer",
      },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      achievements: [],
    }
    const result = sanitizeResumeData(input)
    expect(result.basicInfo.name).toBe("Jane Doe")
    expect(result.basicInfo.title).toBe("Engineer")
    expect(result.basicInfo.email).toBe("jane@example.com")
    expect(result.basicInfo.summary).toBe("A great developer")
  })

  it("converts numbers to strings", () => {
    const input = {
      basicInfo: { name: 123 as unknown, title: "", email: "", phone: "", location: "", linkedin: "", website: "", summary: "" },
      experience: [],
      education: [],
      skills: [],
      projects: [],
      achievements: [],
    } as ResumeData
    const result = sanitizeResumeData(input)
    expect(result.basicInfo.name).toBe("123")
  })

  it("returns empty arrays for missing experience, education, skills", () => {
    const input = {} as ResumeData
    const result = sanitizeResumeData(input)
    expect(result.experience).toEqual([])
    expect(result.education).toEqual([])
    expect(result.skills).toEqual([])
    expect(result.projects).toEqual([])
    expect(result.achievements).toEqual([])
  })

  it("sanitizes experience items", () => {
    const input: ResumeData = {
      basicInfo: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", website: "", summary: "" },
      experience: [
        { company: "Acme", position: "Dev", startDate: "2020", endDate: "2022", description: "Built things", highlights: ["One", "Two"] },
      ],
      education: [],
      skills: [],
      projects: [],
      achievements: [],
    }
    const result = sanitizeResumeData(input)
    expect(result.experience).toHaveLength(1)
    expect(result.experience[0].company).toBe("Acme")
    expect(result.experience[0].position).toBe("Dev")
    expect(result.experience[0].highlights).toEqual(["One", "Two"])
  })

  it("handles root-level summary and basicInfo aliases properly", () => {
    const input = {
      name: "Alice Smith",
      title: "Full Stack Engineer",
      summary: "Passionate engineer with 5+ years of experience.",
      languages: { English: "Fluent", German: "B1" },
      portfolioLinks: ["https://github.com/alicesmith", "https://linkedin.com/in/alicesmith"],
    }
    const result = sanitizeResumeData(input)
    expect(result.basicInfo.name).toBe("Alice Smith")
    expect(result.basicInfo.title).toBe("Full Stack Engineer")
    expect(result.basicInfo.summary).toBe("Passionate engineer with 5+ years of experience.")
    expect(result.basicInfo.languages).toEqual(["English (Fluent)", "German (B1)"])
    expect(result.basicInfo.portfolioLinks).toHaveLength(2)
    expect(result.basicInfo.portfolioLinks?.[0].platform).toBe("GitHub")
    expect(result.basicInfo.portfolioLinks?.[1].platform).toBe("LinkedIn")
  })

  it("handles experience with date range strings and newline bullet points", () => {
    const input = {
      workExperience: [
        {
          employer: "Tech Corp",
          role: "Senior Lead",
          dates: "2021 – 2024",
          bullets: "Led frontend architecture\nReduced latency by 40%",
        },
      ],
    }
    const result = sanitizeResumeData(input)
    expect(result.experience).toHaveLength(1)
    expect(result.experience[0].company).toBe("Tech Corp")
    expect(result.experience[0].position).toBe("Senior Lead")
    expect(result.experience[0].startDate).toBe("2021")
    expect(result.experience[0].endDate).toBe("2024")
    expect(result.experience[0].highlights).toEqual([
      "Led frontend architecture",
      "Reduced latency by 40%",
    ])
  })

  it("handles projects with string technologies and link aliases", () => {
    const input = {
      projects: [
        {
          title: "AI Resume Generator",
          description: "Full stack AI app",
          tools: "React, Next.js, TypeScript",
          github: "https://github.com/user/ai-resume",
          dates: "2023 - 2024",
        },
      ],
    }
    const result = sanitizeResumeData(input)
    expect(result.projects).toHaveLength(1)
    expect(result.projects?.[0].name).toBe("AI Resume Generator")
    expect(result.projects?.[0].technologies).toEqual(["React", "Next.js", "TypeScript"])
    expect(result.projects?.[0].link).toBe("https://github.com/user/ai-resume")
    expect(result.projects?.[0].startDate).toBe("2023")
    expect(result.projects?.[0].endDate).toBe("2024")
  })
})
