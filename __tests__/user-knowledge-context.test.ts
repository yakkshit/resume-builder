import { describe, it, expect } from "vitest";
import { buildUserKnowledgeStoreChunks } from "@/lib/user-knowledge-context";

describe("buildUserKnowledgeStoreChunks", () => {
  it("includes labeled profile and resume chunks", () => {
    const resume = {
      basicInfo: {
        name: "A",
        title: "Engineer",
        email: "",
        phone: "",
        location: "DE",
        linkedin: "",
        website: "",
        summary: "Embedded focus",
      },
      experience: [{ company: "X", position: "Dev", startDate: "01/2024", endDate: "Present", description: "C++", highlights: [] }],
      education: [],
      skills: ["C++", "ROS"],
      projects: [],
      achievements: [],
    };
    const profile = { targetRoles: "Robotics SWE", careerNotes: "Open to EU" };
    const out = buildUserKnowledgeStoreChunks(resume, profile);
    expect(out).toContain("[chunk:global_user_profile]");
    expect(out).toContain("targetRoles:");
    expect(out).toContain("[chunk:resume_summary]");
    expect(out).toContain("Embedded focus");
    expect(out).toContain("[chunk:resume_skills]");
    expect(out).toContain("C++");
    expect(out).toContain("[chunk:experience_1]");
  });
});
