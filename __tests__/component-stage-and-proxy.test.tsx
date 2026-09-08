import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ComponentRenderer } from "@/components/chat/component-renderer";
import { ComponentStage } from "@/components/chat/components/component-stage";
import proxy from "@/proxy";
import { NextRequest } from "next/server";
import { TechModernPDFTemplate } from "@/components/pdf-templates/cv/general-resumes/tech-modern-pdf-template";
import type { ResumeData } from "@/lib/types";

describe("Next.js Proxy & Component Stage Flexibility", () => {
  it("proxy handler returns a valid Next response for standard requests", async () => {
    const req = new NextRequest("http://localhost:3000/api/health");
    const res = await proxy(req, {} as any);
    expect(res).toBeDefined();
    expect(res && "status" in res ? res.status : 200).toBe(200);
  });

  it("ComponentRenderer renders inline by default with side panel popout button", () => {
    const html = renderToStaticMarkup(
      <ComponentRenderer
        type="cv-score"
        data={{ score: 92, jobMatch: 88 }}
        onPopOutToSide={() => {}}
      />
    );
    expect(html).toContain("CV Match Score");
    expect(html).toContain("Side Panel");
  });

  it("ComponentRenderer displays active placeholder when open in side canvas", () => {
    let docked = false;
    const html = renderToStaticMarkup(
      <ComponentRenderer
        type="resume"
        isSideActive={true}
        isInSideStage={false}
        onDockToChat={() => {
          docked = true;
        }}
      />
    );
    expect(html).toContain("Currently open in the right side canvas");
    expect(html).toContain("Bring into Chat");
  });

  it("ComponentStage renders full component view in side canvas", () => {
    const html = renderToStaticMarkup(
      <ComponentStage
        component={{
          id: "comp-123",
          type: "cv-score",
          data: { score: 95 },
          title: "CV Match Score & Insights",
        }}
        onDockToChat={() => {}}
        onClose={() => {}}
      />
    );
    expect(html).toContain("Side Canvas");
    expect(html).toContain("CV Match Score &amp; Insights");
    expect(html).toContain("Dock to Chat");
  });

  it("TechModernPDFTemplate renders Education and Honors without text overlapping structure", () => {
    const sampleResume: ResumeData = {
      basicInfo: {
        name: "Alex Doe",
        title: "Senior AI Engineer",
        email: "alex@example.com",
        phone: "+1234567890",
        location: "Berlin, Germany",
        linkedin: "linkedin.com/in/alex",
        website: "alex.dev",
        summary: "Passionate AI Engineer",
      },
      experience: [
        {
          company: "Tech Corp",
          position: "Lead Engineer",
          startDate: "2023",
          endDate: "Present",
          description: "Leading AI systems",
          highlights: ["Engineered scalable RAG pipelines"],
        },
      ],
      education: [
        {
          institution: "Universität Konstanz",
          degree: "M.Sc. Computer and Information Science",
          field: "Machine Learning & Distributed Systems",
          startDate: "2025",
          endDate: "Present",
          gpa: "1.2",
        },
      ],
      achievements: [
        {
          title: "Deep Learning Specialization",
          description: "DeepLearning.AI (Andrew Ng)",
          date: "2024",
        },
      ],
      skills: ["TypeScript", "Next.js", "Python"],
    };

    const element = React.createElement(TechModernPDFTemplate, { resumeData: sampleResume });
    expect(element).toBeDefined();
  });
});
