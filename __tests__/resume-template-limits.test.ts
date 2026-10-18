import { describe, it, expect } from "vitest"
import { resumeTemplates } from "@/components/pdf-templates"
import {
  RESUME_TEMPLATE_LIMITS,
  calculateResumeMetrics,
  validateTemplatePageBudget,
  getTemplateCapacityCheatSheetMarkdown,
} from "@/lib/resume-template-limits"
import { defaultResumeData } from "@/lib/default-resume-data"
import type { ResumeData } from "@/lib/types"

describe("Resume Template 1-Page Limits & Capacity System", () => {
  it("should have a defined 1-page character and word budget for every registered template", () => {
    const registeredTemplateKeys = Object.keys(resumeTemplates)
    expect(registeredTemplateKeys.length).toBeGreaterThan(0)

    registeredTemplateKeys.forEach((key) => {
      const budget = RESUME_TEMPLATE_LIMITS[key as keyof typeof RESUME_TEMPLATE_LIMITS]
      expect(budget).toBeDefined()
      expect(budget.templateId).toBe(key)
      expect(budget.displayName).toBeTruthy()
      expect(budget.maxCharacters).toBeGreaterThan(1500)
      expect(budget.maxCharacters).toBeLessThanOrEqual(3200)
      expect(budget.recommendedCharacters).toBeLessThan(budget.maxCharacters)
      expect(budget.maxWords).toBeGreaterThan(250)
      expect(budget.recommendedWords).toBeLessThan(budget.maxWords)

      // Verify section breakdown limits exist
      const s = budget.sectionLimits
      expect(s.summary.maxCharacters).toBeGreaterThan(150)
      expect(s.experience.totalMaxCharacters).toBeGreaterThan(800)
      expect(s.experience.maxPositions).toBeGreaterThanOrEqual(2)
      expect(s.education.totalMaxCharacters).toBeGreaterThan(100)
      expect(s.skills.totalMaxCharacters).toBeGreaterThan(100)
      expect(s.projects.totalMaxCharacters).toBeGreaterThan(200)
    })
  })

  it("should accurately calculate resume metrics and identify longest bullet points", () => {
    const metrics = calculateResumeMetrics(defaultResumeData)
    expect(metrics.totalCharacters).toBeGreaterThan(0)
    expect(metrics.totalWords).toBeGreaterThan(0)
    expect(metrics.sections.experience).toBeGreaterThan(0)
    expect(metrics.sections.education).toBeGreaterThan(0)
    expect(metrics.sections.skills).toBeGreaterThan(0)
    expect(metrics.counts.experiencePositions).toBe(defaultResumeData.experience.length)
  })

  it("should validate default resume fit and emit compliant feedback", () => {
    const evalResult = validateTemplatePageBudget(defaultResumeData, "modern", 1)
    expect(evalResult.templateId).toBe("modern")
    expect(evalResult.maxCharacters).toBe(2400)
    expect(typeof evalResult.isOnePageCompliant).toBe("boolean")
    expect(evalResult.modelSelfTrainingFeedback).toContain("[1-PAGE TEMPLATE FIT:")
  })

  it("should detect overflow and generate actionable trimming feedback for models", () => {
    // Construct an intentionally bloated resume
    const bloatedResume: ResumeData = {
      basicInfo: {
        name: "Alexander Hamilton",
        title: "Chief Principal Executive Software Architect and Senior Vice President of Cloud Engineering",
        email: "alexander.hamilton.very.long.executive.email@enterprise-corporation.com",
        phone: "+1 (555) 019-2834 ext 99281",
        location: "San Francisco Bay Area, California, United States of America",
        website: "https://www.alexander-hamilton-portfolio-showcase-domain.io",
        linkedin: "https://linkedin.com/in/alexander-hamilton-senior-executive-leader",
        summary:
          "Visionary technology executive with over twenty-five years of deep domain experience spearheading multi-billion dollar enterprise digital transformations across distributed cloud architectures, high-frequency trading platforms, and petabyte-scale distributed data meshes. Expert in orchestrating organizational alignment across globally distributed cross-functional engineering teams while consistently achieving exceptional shareholder value and reducing infrastructure operating expenditure.",
      },
      experience: [
        {
          company: "Enterprise Cloud MegaCorp International",
          position: "Chief Vice President of Engineering",
          startDate: "2020",
          endDate: "Present",
          description: "Spearheaded global engineering organization across 5 continents and 400+ engineers.",
          highlights: [
            "Architected, deployed, and maintained mission-critical distributed low-latency transaction processing engine achieving 99.999% availability.",
            "Led strategic migration of 1,200 legacy monolithic microservices to Kubernetes clusters across AWS, GCP, and Azure.",
            "Championed enterprise-wide security compliance frameworks, ensuring full adherence to SOC2 Type II, ISO 27001, and HIPAA.",
            "Mentored and coached 18 engineering managers and 45 staff engineers, cultivating an engineering culture of psychological safety.",
          ],
        },
        {
          company: "NextGen AI Robotics Inc",
          position: "Principal Distributed Systems Architect",
          startDate: "2016",
          endDate: "2020",
          description: "Led autonomous edge compute pipeline infrastructure.",
          highlights: [
            "Designed and implemented high-throughput real-time telemetry streaming pipelines processing over 50 million events per second using Apache Kafka and Apache Flink.",
            "Optimized GPU model inference cluster latency by 48% via custom TensorRT compilation kernels and automated dynamic batching.",
            "Authored 6 international patents on edge consensus algorithms for decentralized robotics swarms operating under high packet loss conditions.",
            "Engineered zero-downtime deployment strategies utilizing progressive Canary releases and automated eBPF observability.",
          ],
        },
        {
          company: "FinTech Global Payments",
          position: "Senior Lead Software Engineer",
          startDate: "2012",
          endDate: "2016",
          description: "Core clearing and settlement ledger engineering.",
          highlights: [
            "Engineered double-entry financial ledger processing $14B in daily volume with zero transactional discrepancies.",
            "Refactored relational database schemas and queries, reducing p99 database response times from 350ms to 12ms under peak Cyber Monday traffic.",
            "Spearheaded international payment gateway integration with 38 regional banks across APAC and EMEA regions.",
          ],
        },
        {
          company: "Legacy Systems Corp",
          position: "Software Developer",
          startDate: "2008",
          endDate: "2012",
          description: "Backend development and systems maintenance.",
          highlights: [
            "Maintained backend Java enterprise applications and Oracle databases.",
            "Automated nightly ETL jobs reducing batch processing time by 3 hours.",
          ],
        },
      ],
      education: [
        {
          institution: "Stanford University",
          degree: "Master of Science",
          field: "Computer Science (Distributed Systems & AI)",
          startDate: "2006",
          endDate: "2008",
          gpa: "3.98/4.0",
        },
        {
          institution: "University of California, Berkeley",
          degree: "Bachelor of Science",
          field: "Electrical Engineering and Computer Sciences",
          startDate: "2002",
          endDate: "2006",
          gpa: "3.95/4.0",
        },
      ],
      skills: [
        "Distributed Systems Architecture",
        "Kubernetes & Container Orchestration",
        "eBPF Systems Observability",
        "Apache Kafka & Streaming Engines",
        "Go (Golang)",
        "Rust Systems Programming",
        "TypeScript & Node.js",
        "PostgreSQL & Database Internals",
        "Cloud Architecture (AWS, GCP, Azure)",
        "Machine Learning Operations (MLOps)",
        "Low-Latency Networking & gRPC",
        "Zero-Trust Infrastructure Security",
        "Technical Executive Leadership",
        "Agile & Scrum Engineering Management",
        "High-Frequency Financial Ledger Systems",
        "Decentralized Swarm Consensus Protocols",
      ],
      projects: [
        {
          name: "OpenSource Distributed Cache Mesh",
          description: "High-performance distributed in-memory cache achieving 10M ops/sec with sub-millisecond p99 latency.",
          technologies: ["Rust", "gRPC", "Raft Consensus", "Prometheus"],
        },
        {
          name: "Autonomous Model Serving Pipeline",
          description: "Dynamic micro-batching inference framework for heterogeneous GPU compute clusters.",
          technologies: ["Python", "C++", "CUDA", "TensorRT", "Triton Server"],
        },
        {
          name: "eBPF Network Security Inspector",
          description: "Kernel-level packet filtering and anomaly detection agent with zero overhead.",
          technologies: ["C", "eBPF", "Linux Kernel", "Grafana"],
        },
      ],
    }

    const evalResult = validateTemplatePageBudget(bloatedResume, "modern", 1)
    expect(evalResult.isOnePageCompliant).toBe(false)
    expect(evalResult.overflowCharacters).toBeGreaterThan(0)
    expect(evalResult.characterUsagePercent).toBeGreaterThan(100)
    expect(["warning-overflow", "critical-overflow"]).toContain(evalResult.status)

    // Actionable suggestions must be populated
    expect(evalResult.actionableTrimmingSuggestions.length).toBeGreaterThan(0)
    expect(evalResult.modelSelfTrainingFeedback).toContain("[1-PAGE TEMPLATE FIT: OVERFLOW DETECTED - SELF-TRAINING FEEDBACK]")
    expect(evalResult.modelSelfTrainingFeedback).toContain("ACTIONABLE TRIMMING INSTRUCTIONS FOR 1-PAGE RE-GENERATION:")
    expect(evalResult.modelSelfTrainingFeedback).toContain("MODEL SELF-CORRECTION DIRECTIVE:")
  })

  it("should generate a valid markdown cheat sheet covering all 21 templates", () => {
    const md = getTemplateCapacityCheatSheetMarkdown()
    expect(md).toContain("### Template 1-Page Character & Word Capacity Matrix:")
    expect(md).toContain("`modern`")
    expect(md).toContain("`ivy-league`")
    expect(md).toContain("`two-column`")
    expect(md).toContain("`german-cv`")
    expect(md).toContain("`engineering-ats`")
    expect(md).toContain("`minimal`")
    expect(md).toContain("1-Page Generation Rules for AI Models:")
  })
})
