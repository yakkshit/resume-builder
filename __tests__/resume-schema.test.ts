import { describe, it, expect } from "vitest";
import { validateAndNormalizeResumeData, resumeDataSchema } from "../lib/resume-schema";

describe("Resume Zod Schema & Crash-Proof Normalization", () => {
  it("should normalize empty or corrupt input to default resume data without crashing", () => {
    const res1 = validateAndNormalizeResumeData(null);
    expect(res1.basicInfo).toBeDefined();
    expect(res1.basicInfo.name).toBeTruthy();
    expect(Array.isArray(res1.experience)).toBe(true);

    const res2 = validateAndNormalizeResumeData({});
    expect(res2.basicInfo.name).toBeTruthy();
    expect(Array.isArray(res2.education)).toBe(true);
    expect(Array.isArray(res2.skills)).toBe(true);
  });

  it("should map alternative AI keys seamlessly into standard fields", () => {
    const aiOutput = {
      personalInfo: {
        name: "Alex Dev",
        title: "Staff Engineer",
        email: "alex@example.com",
      },
      workExperience: [
        {
          company: "Tech Corp",
          role: "Lead Architect",
          start_date: "2021",
          end_date: "2024",
          responsibilities: ["Architected microservices", "Led team of 10"],
        },
      ],
      academics: [
        {
          university: "MIT",
          degree: "B.S. Computer Science",
          major: "AI",
        },
      ],
      technicalSkills: "TypeScript, Next.js, Rust, Docker",
      sideProjects: [
        {
          title: "CareerAgent",
          description: "AI Career Platform",
          techStack: ["Next.js", "Zod", "TailwindCSS"],
        },
      ],
    };

    const normalized = validateAndNormalizeResumeData(aiOutput);

    expect(normalized.basicInfo.name).toBe("Alex Dev");
    expect(normalized.basicInfo.title).toBe("Staff Engineer");
    expect(normalized.basicInfo.email).toBe("alex@example.com");

    expect(normalized.experience.length).toBe(1);
    expect(normalized.experience[0].position).toBe("Lead Architect");
    expect(normalized.experience[0].startDate).toBe("2021");
    expect(normalized.experience[0].highlights).toEqual([
      "Architected microservices",
      "Led team of 10",
    ]);

    expect(normalized.education.length).toBe(1);
    expect(normalized.education[0].institution).toBe("MIT");
    expect(normalized.education[0].field).toBe("AI");

    expect(normalized.skills).toEqual(["TypeScript", "Next.js", "Rust", "Docker"]);

    expect(normalized.projects?.length).toBe(1);
    expect(normalized.projects?.[0].name).toBe("CareerAgent");
    expect(normalized.projects?.[0].technologies).toEqual(["Next.js", "Zod", "TailwindCSS"]);
  });

  it("should guarantee no undefined property exists in basicInfo, experience, or education", () => {
    const partial = {
      basicInfo: {
        name: "Jane Doe",
      },
      experience: [
        {
          company: "Acme Inc",
        },
      ],
    };

    const res = validateAndNormalizeResumeData(partial);
    expect(res.basicInfo.phone).toBe("");
    expect(res.basicInfo.location).toBe("");
    expect(res.basicInfo.linkedin).toBe("");
    expect(res.basicInfo.website).toBe("");
    expect(res.experience[0].position).toBe("");
    expect(res.experience[0].description).toBe("");
    expect(res.experience[0].highlights).toEqual([]);
  });
});
