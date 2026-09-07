"use client";

import { useEffect, useMemo, useId, useState } from "react";
import dynamic from "next/dynamic";
import { TRANSLATION_ORIGINAL, translateDataDeep, translateLatexSmart } from "@/lib/translation";
import { TranslationControls } from "@/components/chat/translation-controls";

const loading = () => (
  <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
    Loading component...
  </div>
);

const ResumeViewer = dynamic(() => import("./components/resume-viewer").then((m) => m.ResumeViewer), { loading });
const CVScore = dynamic(() => import("./components/cv-score").then((m) => m.CVScore), { loading });
const JobRecommendations = dynamic(
  () => import("./components/job-recommendations").then((m) => m.JobRecommendations),
  { loading },
);
const AutoApplier = dynamic(() => import("./components/auto-applier").then((m) => m.AutoApplier), { loading });
const CodingChallenge = dynamic(
  () => import("./components/coding-challenge").then((m) => m.CodingChallenge),
  { loading },
);
const LearningResources = dynamic(
  () => import("./components/learning-resources").then((m) => m.LearningResources),
  { loading },
);
const CoverLetterViewer = dynamic(
  () => import("./components/cover-letter-viewer").then((m) => m.CoverLetterViewer),
  { loading },
);
const EmailHrPanel = dynamic(() => import("./components/email-hr-panel").then((m) => m.EmailHrPanel), { loading });
const LinkedinDmPanel = dynamic(
  () => import("./components/linkedin-dm-panel").then((m) => m.LinkedinDmPanel),
  { loading },
);
const JobScraperCard = dynamic(
  () => import("./components/job-scraper-card").then((m) => m.JobScraperCard),
  { loading },
);
const ResumeLatexArtifact = dynamic(
  () => import("./resume-latex-artifact").then((m) => m.ResumeLatexArtifact),
  { loading },
);

export type ComponentType =
  | "resume"
  | "cover-letter"
  | "cv-score"
  | "job-recommendations"
  | "job-scraper"
  | "auto-applier"
  | "coding-challenge"
  | "learning-resources"
  | "email-hr"
  | "linkedin-dm"
  | "resume-latex"
  | "cover-letter-latex";

interface ComponentRendererProps {
  type: ComponentType;
  data?: Record<string, unknown>;
  /** Used by embedded tools (e.g. HR email AI draft) — not persisted */
  chatApiKey?: string;
  /** Same model as chat selector — passed to /api/email-draft */
  chatModel?: string;
  /**
   * When false, the resume card is a frozen snapshot for that message only (no shared localStorage).
   * Only the latest resume block in the chat should pass true.
   */
  resumeSyncsWithGlobal?: boolean;
  onSendMessage?: (text: string) => void;
}

export function ComponentRenderer({
  type,
  data,
  chatApiKey,
  chatModel,
  resumeSyncsWithGlobal,
  onSendMessage,
}: ComponentRendererProps) {
  const translationFieldId = useId();
  const [targetLanguage, setTargetLanguage] = useState(TRANSLATION_ORIGINAL);
  const [translatedData, setTranslatedData] = useState<Record<string, unknown> | undefined>(
    data,
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLatex, setTranslatedLatex] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTranslatedData(data);
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!data || targetLanguage === TRANSLATION_ORIGINAL) {
        if (!cancelled) setTranslatedData(data);
        return;
      }
      setIsTranslating(true);
      try {
        const next = await translateDataDeep(data, targetLanguage);
        if (!cancelled) setTranslatedData(next as Record<string, unknown>);
      } catch {
        if (!cancelled) setTranslatedData(data);
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [data, targetLanguage]);

  // Special-case LaTeX: translate "plain text runs" without overwriting saved source.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (targetLanguage === TRANSLATION_ORIGINAL) {
        if (!cancelled) setTranslatedLatex(undefined);
        return;
      }
      const rec = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const latex = typeof rec?.latex === "string" ? rec.latex : "";
      if (!latex.trim()) {
        if (!cancelled) setTranslatedLatex(undefined);
        return;
      }
      try {
        const next = await translateLatexSmart(latex, targetLanguage);
        if (!cancelled) setTranslatedLatex(next);
      } catch {
        if (!cancelled) setTranslatedLatex(undefined);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [data, targetLanguage]);

  const activeData = useMemo(() => translatedData ?? data, [translatedData, data]);

  const header = (
    <div className="mb-2 flex justify-end sm:justify-end">
      <TranslationControls
        id={translationFieldId}
        value={targetLanguage}
        disabled={isTranslating}
        isTranslating={isTranslating}
        onChange={setTargetLanguage}
      />
    </div>
  );

  switch (type) {
    case "resume":
      return (
        <div>
          {header}
          <ResumeViewer
            data={activeData}
            syncWithGlobalResume={
              resumeSyncsWithGlobal !== false && targetLanguage === TRANSLATION_ORIGINAL
            }
          />
        </div>
      );
    case "cover-letter":
      return (
        <div>
          {header}
          <CoverLetterViewer data={activeData as any} persistToLocalStorage={targetLanguage === TRANSLATION_ORIGINAL} />
        </div>
      );
    case "cover-letter-latex": {
      const rec = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const latex = typeof rec?.latex === "string" ? rec.latex : undefined;
      return (
        <div>
          {header}
          <ResumeLatexArtifact initialLatex={latex} translatedLatex={translatedLatex} kind="cover-letter" />
        </div>
      );
    }
    case "cv-score":
      return (
        <div>
          {header}
          <CVScore data={activeData as any} />
        </div>
      );
    case "job-recommendations": {
      const d = activeData as any;
      return (
        <div>
          {header}
          <JobRecommendations data={Array.isArray(d?.links) ? d.links : d?.jobs ?? d} />
        </div>
      );
    }
    case "job-scraper": {
      const d = activeData as any;
      return (
        <div>
          {header}
          <JobScraperCard
            initialQuery={d?.query || ""}
            initialLocation={d?.location || "Remote"}
            initialJobs={Array.isArray(d?.jobs) ? d.jobs : []}
            onSendMessage={onSendMessage}
          />
        </div>
      );
    }
    case "auto-applier":
      return (
        <div>
          {header}
          <AutoApplier />
        </div>
      );
    case "coding-challenge":
      return (
        <div>
          {header}
          <CodingChallenge data={activeData as any} />
        </div>
      );
    case "learning-resources":
      return (
        <div>
          {header}
          <LearningResources data={(activeData as any)?.resources} />
        </div>
      );
    case "email-hr":
      return (
        <div>
          {header}
          <EmailHrPanel data={activeData} chatApiKey={chatApiKey} chatModel={chatModel} />
        </div>
      );
    case "linkedin-dm":
      return (
        <div>
          {header}
          <LinkedinDmPanel data={activeData} />
        </div>
      );
    case "resume-latex": {
      const rec = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const latex = typeof rec?.latex === "string" ? rec.latex : undefined;
      return (
        <div>
          {header}
          <ResumeLatexArtifact initialLatex={latex} translatedLatex={translatedLatex} kind="resume" />
        </div>
      );
    }
    default:
      return null;
  }
}

// ── Response generator (deterministic mock fallback) ─

interface GeneratedResponse {
  text: string;
  componentType?: ComponentType;
  componentData?: Record<string, unknown>;
}

export function generateAIResponse(userInput: string, _apiKey: string, _model: string): GeneratedResponse {
  const lower = userInput.toLowerCase();

  if (lower.includes("resume") || lower.includes("cv") || lower.includes("show me")) {
    return {
      text: "Here's your resume preview. You can edit it directly in the **Editor** tab or customize the template in **Settings**.",
      componentType: "resume",
    };
  }
  if (lower.includes("score") || lower.includes("analyz") || lower.includes("rate")) {
    return {
      text: "I've analyzed your CV against industry benchmarks. Here's your compatibility score:",
      componentType: "cv-score",
      componentData: { score: 85, jobMatch: 78 },
    };
  }
  if (lower.includes("job") || lower.includes("scrape") || lower.includes("search") || lower.includes("recommend") || lower.includes("opportunit")) {
    return {
      text: "Based on your target roles and skills, here is the **Live Job Scraper & Matcher** for finding and tailoring roles:",
      componentType: "job-scraper",
    };
  }
  if (lower.includes("apply") || lower.includes("auto") || lower.includes("automat")) {
    return {
      text: "Starting the automated application flow. I'll search for matching positions, tailor your resume, and submit applications on your behalf:",
      componentType: "auto-applier",
    };
  }
  if (lower.includes("code") || lower.includes("challenge") || lower.includes("algorithm") || lower.includes("leetcode")) {
    return {
      text: "Time to practice! Here's a coding challenge relevant to your target roles. Try to solve it within the time limit:",
      componentType: "coding-challenge",
    };
  }
  if (lower.includes("learn") || lower.includes("course") || lower.includes("skill") || lower.includes("study")) {
    return {
      text: "Here are curated learning resources to help you **level up** the skills most in demand for your target roles:",
      componentType: "learning-resources",
    };
  }
  if (lower.includes("create") || lower.includes("help") || lower.includes("start")) {
    return {
      text: `Here's what I can do for you:\n\n- **Resume** — Build, edit, and customize your resume\n- **Job Scraper & Matching** — Search live developer openings and match with 1 click\n- **MCP Servers** — Connect real-world tools and external services\n- **CV Score** — Analyze compatibility with job descriptions\n- **Auto-Apply** — Let me apply to jobs on your behalf\n- **Coding Challenges** — Sharpen your technical skills\n- **Learning** — Discover courses to fill skill gaps\n\nJust tell me what you'd like to work on!`,
    };
  }

  return {
    text: `I'm your AI career and resume assistant with MCP & Job Scraping capabilities. I can help you with:\n\n1. **Building & Tailoring** your resume and cover letter\n2. **Scraping & Searching** real-time job openings\n3. **Executing MCP Tools** to produce PDFs and analyze qualifications\n4. **Analyzing** your CV score vs job requirements\n5. **Automating** job applications\n6. **Practicing** coding challenges\n\nWhat would you like to work on today?`,
  };
}
