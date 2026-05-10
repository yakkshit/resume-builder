import { describe, it, expect } from "vitest";
import {
  extractResumeJsonFromMessage,
  extractResumePayloadFromMessage,
  mergeAssistantResumeIntoCurrent,
} from "@/lib/extract-resume-json";
import { defaultResumeData } from "@/lib/default-resume-data";
import type { ResumeData } from "@/lib/types";

describe("extractResumeJsonFromMessage", () => {
  it("unwraps component:resume fence like component:cv", () => {
    const text = `\`\`\`component:resume
{"resumeData":{"basicInfo":{"name":"R","title":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":""},"experience":[],"education":[],"skills":["Rust"],"projects":[],"achievements":[]}}
\`\`\``;
    const out = extractResumeJsonFromMessage(text);
    expect(out).not.toBeNull();
    expect((out as any).basicInfo?.name).toBe("R");
    expect((out as any).skills).toEqual(["Rust"]);
  });

  it("uses last successful component:cv block when multiple appear", () => {
    const text = `
\`\`\`component:cv
{"resumeData":{"basicInfo":{"name":"First","title":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":""},"experience":[],"education":[],"skills":[],"projects":[],"achievements":[]}}
\`\`\`
\`\`\`component:cv
{"resumeData":{"basicInfo":{"name":"Second","title":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":""},"experience":[],"education":[],"skills":[],"projects":[],"achievements":[]}}
\`\`\`
`;
    const out = extractResumeJsonFromMessage(text);
    expect((out as any).basicInfo?.name).toBe("Second");
  });

  it("unwraps component:cv fence with resumeData envelope", () => {
    const text = `Here is your resume.

\`\`\`component:cv
{"resumeData":{"basicInfo":{"name":"A","title":"T","email":"","phone":"","location":"","linkedin":"","website":"","summary":"S"},"experience":[],"education":[],"skills":["C++"],"projects":[],"achievements":[]},"template":"modern"}
\`\`\`
`;
    const out = extractResumeJsonFromMessage(text);
    expect(out).not.toBeNull();
    expect((out as any).basicInfo?.name).toBe("A");
    expect((out as any).skills).toEqual(["C++"]);
  });

  it("returns template from envelope", () => {
    const text = `\`\`\`component:cv
{"resumeData":{"basicInfo":{"name":"X","title":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":""},"experience":[],"education":[],"skills":[],"projects":[],"achievements":[]},"template":"classic"}
\`\`\``;
    const payload = extractResumePayloadFromMessage(text);
    expect(payload.resume).not.toBeNull();
    expect(payload.template).toBe("classic");
  });

  it("parses flat resume shape in json fence", () => {
    const text = `\`\`\`json
{"basicInfo":{"name":"Flat","title":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":""},"experience":[],"education":[],"skills":[],"projects":[],"achievements":[]}
\`\`\``;
    const out = extractResumeJsonFromMessage(text);
    expect((out as any).basicInfo?.name).toBe("Flat");
  });

  it("normalizes nested sections.resumeData from component:cv (LLM shape)", () => {
    const text = `\`\`\`component:cv
{"resumeData":{"sections":{"profile":{"name":"Jane Doe","email":"j@ex.com","phone":"","linkedin":"in/jane","website":"jane.dev","github":"gh/jane"},"summary":"Builder.","experience":{"items":[{"title":"Dev","company":"Acme","dates":"01/2024 – Present","description":"Shipped features.","keywords":["React"]}]},"education":{"items":[{"title":"B.Sc. CS","institution":"State U","dates":"2018 – 2022"}]},"projects":{"items":[{"title":"Side","description":"App","keywords":["TS"]}]},"skills":{"items":["Python","Go"]},"languages":{"items":["English"]}},"summary":"Builder."},"template":"modern"}
\`\`\``;
    const out = extractResumeJsonFromMessage(text);
    expect(out).not.toBeNull();
    expect((out as any).basicInfo?.name).toBe("Jane Doe");
    expect((out as any).basicInfo?.summary).toBe("Builder.");
    expect((out as any).experience?.[0]?.company).toBe("Acme");
    expect((out as any).experience?.[0]?.position).toBe("Dev");
    expect((out as any).education?.[0]?.institution).toBe("State U");
    expect((out as any).projects?.[0]?.name).toBe("Side");
    expect((out as any).skills).toContain("Python");
    const payload = extractResumePayloadFromMessage(text);
    expect(payload.template).toBe("modern");
  });

  it("mergeAssistantResumeIntoCurrent preserves profile picture", () => {
    const current: ResumeData = {
      ...defaultResumeData,
      basicInfo: {
        ...defaultResumeData.basicInfo,
        profilePicture: "data:image/png;base64,AAA",
      },
    };
    const text = `\`\`\`component:cv
{"resumeData":{"basicInfo":{"name":"NewName","title":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":"Hi"},"experience":[],"education":[],"skills":[],"projects":[],"achievements":[]}}
\`\`\``;
    const { merged } = mergeAssistantResumeIntoCurrent(current, text);
    expect(merged).not.toBeNull();
    expect(merged!.basicInfo.name).toBe("NewName");
    expect(merged!.basicInfo.profilePicture).toBe("data:image/png;base64,AAA");
  });
});
