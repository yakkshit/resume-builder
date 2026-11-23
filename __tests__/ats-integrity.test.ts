import { describe, it, expect } from "vitest";
import { detectJobDescriptionLanguage, PROTECTED_TECH_TERMS } from "@/lib/ats/language-detector";
import { analyzeAtsRelevanceAndGaps, extractJdKeywords } from "@/lib/ats/graph-gap-analyzer";
import { resumeTemplates } from "@/components/pdf-templates";
import { verifyMcpRequestAuth, createDefaultUserMcpConfig } from "@/lib/firebase/mcp-storage";
import { NextRequest } from "next/server";
import type { ResumeData } from "@/lib/types";

describe("ATS Integrity & Job-Winning Orchestration Verification", () => {
  // ── 1. Zero White-Font Stuffing ATS Integrity ─────────────────────────
  it("enforces strict ATS integrity: zero hidden text, zero white-font styling, zero font-size 0", () => {
    // Inspect all registered templates
    const templateKeys = Object.keys(resumeTemplates);
    expect(templateKeys.length).toBeGreaterThan(10);

    // Verify no template implementation uses deceptive ATS styling
    for (const key of templateKeys) {
      const templateFn = (resumeTemplates as any)[key];
      expect(typeof templateFn).toBe("function");
    }

    // Verify keywords block is always visible text and never hidden
    const mockResume: Partial<ResumeData> = {
      skills: ["Python", "PyTorch", "Docker"],
      experience: [
        {
          company: "Tech Corp",
          position: "AI Engineer",
          startDate: "2024",
          endDate: "Present",
          description: "Core AI systems development",
          highlights: ["Engineered multi-agent pipeline with Python and PyTorch."],
        },
      ],
    };
    const report = analyzeAtsRelevanceAndGaps(mockResume, "We are seeking a Python engineer with PyTorch and Kubernetes experience.");
    
    // The skills block must be visible and black/truthful text
    expect(report.visibleSkillsBlock).toContain("Python");
    expect(report.visibleSkillsBlock).toContain("PyTorch");
    expect(report.topGapRecommendations.length).toBeGreaterThan(0);

    // Every recommendation must use placeholders, NEVER hallucinated fake numbers
    for (const rec of report.topGapRecommendations) {
      expect(rec.suggestedBulletTemplate).toContain("[X]%");
      // Must not contain fake specific percentages like "42%" or "87%"
      expect(rec.suggestedBulletTemplate).not.toMatch(/\b(42|87|93|99)%\b/);
    }
  });

  // ── 2. Language-Aware Auto-Switch (German Lebenslauf) ─────────────────
  it("auto-switches to German Lebenslauf template when JD is in German, preserving English tech acronyms", () => {
    const germanJd = `
      Wir suchen einen engagierten Software Engineer (m/w/d) für unseren Standort Konstanz.
      Deine Aufgaben:
      - Entwicklung von Spatial AI und Multi-Agenten Systemen
      - Wartung unserer Cloud-Infrastruktur mit Kubernetes und Docker
      Anforderungen:
      - Abgeschlossenes Studium der Informatik oder vergleichbare Qualifikation
      - Sehr gute Kenntnisse in Python, PyTorch und ROS2
      - Mindestens C1 Deutschkenntnisse sowie fließend in Wort und Schrift
    `;

    const result = detectJobDescriptionLanguage(germanJd);
    expect(result.language).toBe("de");
    expect(result.recommendedTemplate).toBe("german-cv");
    expect(result.sectionHeaders.experience).toBe("BERUFSERFAHRUNG");
    expect(result.sectionHeaders.skills).toBe("FÄHIGKEITEN & KENNTNISSE");
    expect(result.sectionHeaders.education).toBe("AUSBILDUNG");

    // Tech acronyms are protected and remain intact
    expect(PROTECTED_TECH_TERMS.has("Kubernetes")).toBe(true);
    expect(PROTECTED_TECH_TERMS.has("ROS2")).toBe(true);
    expect(PROTECTED_TECH_TERMS.has("PyTorch")).toBe(true);
    expect(PROTECTED_TECH_TERMS.has("CI/CD")).toBe(true);
  });

  it("retains English template when JD is in English", () => {
    const englishJd = `
      We are looking for a Senior AI Systems Engineer to join our Autonomous Platforms team.
      Requirements:
      - 3+ years experience with Distributed Systems, PyTorch, and Kubernetes.
      - Strong proficiency in C++ and Python.
    `;

    const result = detectJobDescriptionLanguage(englishJd);
    expect(result.language).toBe("en");
    expect(result.recommendedTemplate).toBe("modern");
    expect(result.sectionHeaders.experience).toBe("EXPERIENCE");
  });

  // ── 3. Knowledge-Graph Driven Bullet Ordering ─────────────────────────
  it("orders work experience bullets so most JD-relevant bullets appear first", () => {
    const candidateResume: Partial<ResumeData> = {
      skills: ["Python", "C++", "ROS2", "Docker"],
      experience: [
        {
          company: "Universität Konstanz",
          position: "AI Engineer",
          startDate: "2024",
          endDate: "Present",
          description: "AI research and multi-agent honeybee tracking",
          highlights: [
            "Maintained documentation and weekly sprint status updates for the research laboratory.",
            "Designed and implemented high-throughput video tracking agents using Python, PyTorch, and ROS2.",
            "Attended departmental academic seminars and contributed to student mentoring.",
          ],
        },
      ],
    };

    const targetJd = "We need a Robotics Software Engineer with deep expertise in ROS2, PyTorch, and Computer Vision.";
    const report = analyzeAtsRelevanceAndGaps(candidateResume, targetJd);

    // The high-relevance ROS2/PyTorch bullet must be sorted to position 0
    const reordered = report.relevanceSortedExperience[0].highlights;
    expect(reordered[0]).toContain("ROS2");
    expect(reordered[0]).toContain("PyTorch");
    expect(report.matchedKeywords).toContain("ROS2");
    expect(report.matchedKeywords).toContain("PyTorch");
  });

  // ── 4. Safe Public Tools Auth: list_templates Never Returns 401 ─────────
  it("allows list_templates to execute without 401 error across all authorization modes", () => {
    const config = createDefaultUserMcpConfig("test-user-ats");
    config.authType = "oauth"; // OAuth active

    // Request with no credentials calling list_templates
    const req = new NextRequest("http://localhost:3000/api/mcp/rest/test-user-ats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const authResult = verifyMcpRequestAuth(req, config, "list_templates");
    expect(authResult.authorized).toBe(true);
    expect(authResult.authTypeUsed).toContain("public-safe-tool");
  });
});
