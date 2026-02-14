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
})
