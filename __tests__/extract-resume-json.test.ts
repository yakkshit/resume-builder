import { describe, it, expect } from "vitest";
import {
  extractResumeJsonFromMessage,
  extractResumePayloadFromMessage,
  mergeAssistantResumeIntoCurrent,
} from "@/lib/extract-resume-json";
import { defaultResumeData } from "@/lib/default-resume-data";
import type { ResumeData } from "@/lib/types";

describe("extractResumeJsonFromMessage", () => {
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
