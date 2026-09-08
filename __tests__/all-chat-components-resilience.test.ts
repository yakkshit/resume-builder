import { describe, it, expect } from "vitest";
import React from "react";
import { CVScore } from "@/components/chat/components/cv-score";
import { JobRecommendations } from "@/components/chat/components/job-recommendations";
import { AutoApplier } from "@/components/chat/components/auto-applier";
import { CodingChallenge } from "@/components/chat/components/coding-challenge";
import { LearningResources } from "@/components/chat/components/learning-resources";
import { LinkedinDmPanel } from "@/components/chat/components/linkedin-dm-panel";
import { EmailHrPanel } from "@/components/chat/components/email-hr-panel";
import { ChartViewer } from "@/components/chat/components/chart-viewer";
import { CoverLetterViewer } from "@/components/chat/components/cover-letter-viewer";
import { ResumeViewer } from "@/components/chat/components/resume-viewer";
import { ResumeLatexArtifact } from "@/components/chat/resume-latex-artifact";
import { sanitizeResumeData } from "@/lib/sanitize-resume-data";
import { sanitizeCoverLetterData } from "@/lib/sanitize-cover-letter-data";

describe("All Interactive Chat Components Resilience & Null-Safety", () => {
  it("renders CVScore with empty or partial data without throwing", () => {
    expect(() => React.createElement(CVScore, { data: undefined })).not.toThrow();
    expect(() => React.createElement(CVScore, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(CVScore, {
        data: { score: 92, jobMatch: 85, strengths: ["Leadership"], improvements: ["Certifications"] },
      })
    ).not.toThrow();
  });

  it("renders JobRecommendations with empty, array, or object envelopes without throwing", () => {
    expect(() => React.createElement(JobRecommendations, { data: undefined })).not.toThrow();
    expect(() => React.createElement(JobRecommendations, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(JobRecommendations, {
        data: [
          { title: "AI Engineer", company: "Zalion", location: "Remote", url: "https://example.com" },
        ],
      })
    ).not.toThrow();
    expect(() =>
      React.createElement(JobRecommendations, {
        data: {
          links: [{ title: "ML Specialist", company: "TechCorp" }],
        },
      })
    ).not.toThrow();
  });

  it("renders AutoApplier without throwing", () => {
    expect(() => React.createElement(AutoApplier)).not.toThrow();
  });

  it("renders CodingChallenge with various language props and custom problem descriptions", () => {
    expect(() => React.createElement(CodingChallenge, { data: undefined })).not.toThrow();
    expect(() => React.createElement(CodingChallenge, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(CodingChallenge, {
        data: { codingProblems: ["Implement an LRU Cache in O(1) time complexity."] },
      })
    ).not.toThrow();
  });

  it("renders LearningResources with arrays, object envelopes, or empty data", () => {
    expect(() => React.createElement(LearningResources, { data: undefined })).not.toThrow();
    expect(() => React.createElement(LearningResources, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(LearningResources, {
        data: {
          resources: [
            { id: 1, title: "Deep Learning Specialization", platform: "Coursera", level: "Advanced", price: "$49", rating: 4.9 },
          ],
        },
      })
    ).not.toThrow();
    expect(() =>
      React.createElement(LearningResources, {
        data: [{ name: "LangGraph Multi-Agent Architecture", platform: "LangChain" }],
      })
    ).not.toThrow();
  });

  it("renders LinkedinDmPanel with empty, partial, or overflowing text", () => {
    expect(() => React.createElement(LinkedinDmPanel, { data: undefined })).not.toThrow();
    expect(() => React.createElement(LinkedinDmPanel, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(LinkedinDmPanel, {
        data: { message: "Hi Jane, I just submitted my application for the AI role. Would love to connect!" },
      })
    ).not.toThrow();
  });

  it("renders EmailHrPanel with empty or prefilled outreach drafts", () => {
    expect(() => React.createElement(EmailHrPanel, { data: undefined })).not.toThrow();
    expect(() => React.createElement(EmailHrPanel, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(EmailHrPanel, {
        data: {
          to: "recruiter@zalion.com",
          subject: "Application for AI Engineer Role",
          body: "Dear Hiring Team,\n\nPlease find attached my CV.",
          company: "Zalion",
          jobTitle: "AI Engineer",
        },
      })
    ).not.toThrow();
  });

  it("renders ChartViewer with bar, line, area, pie, radar and empty states", () => {
    expect(() => React.createElement(ChartViewer, { data: undefined })).not.toThrow();
    expect(() => React.createElement(ChartViewer, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(ChartViewer, {
        data: {
          type: "bar",
          title: "Salary Trends",
          data: [
            { name: "Junior", value: 70000 },
            { name: "Senior", value: 140000 },
            { name: "Staff", value: 190000 },
          ],
        },
      })
    ).not.toThrow();
    expect(() =>
      React.createElement(ChartViewer, {
        data: {
          type: "radar",
          title: "Skill Competencies",
          data: [
            { name: "AI/LLM", value: 95 },
            { name: "Backend", value: 90 },
            { name: "Cloud", value: 85 },
          ],
        },
      })
    ).not.toThrow();
  });

  it("renders CoverLetterViewer with null, partial, and complete data", () => {
    expect(() => React.createElement(CoverLetterViewer, { data: undefined })).not.toThrow();
    expect(() => React.createElement(CoverLetterViewer, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(CoverLetterViewer, {
        data: {
          head: "John Doe\nGermany",
          body: "Dear Hiring Manager,\n\nI am applying for the role.",
          footer: "Sincerely,\nJohn",
          template: "modern",
        },
      })
    ).not.toThrow();
  });

  it("renders ResumeViewer with null, partial, and complete data", () => {
    expect(() => React.createElement(ResumeViewer, { data: undefined })).not.toThrow();
    expect(() => React.createElement(ResumeViewer, { data: {} })).not.toThrow();
    expect(() =>
      React.createElement(ResumeViewer, {
        data: {
          resumeData: sanitizeResumeData({}),
          template: "modern",
        },
      })
    ).not.toThrow();
  });

  it("renders ResumeLatexArtifact for both resume and cover-letter kinds", () => {
    expect(() =>
      React.createElement(ResumeLatexArtifact, {
        initialLatex: "\\documentclass{article}\\begin{document}Hello\\end{document}",
        kind: "resume",
      })
    ).not.toThrow();
    expect(() =>
      React.createElement(ResumeLatexArtifact, {
        initialLatex: "\\documentclass{article}\\begin{document}Cover Letter\\end{document}",
        kind: "cover-letter",
      })
    ).not.toThrow();
  });
});
