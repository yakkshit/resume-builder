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
const MockInterview = dynamic(() => import("./components/mock-interview").then((m) => m.MockInterview), { loading });
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
const InterviewLabPanel = dynamic(
  () => import("./interview-lab-panel").then((m) => m.InterviewLabPanel),
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
  | "auto-applier"
  | "mock-interview"
  | "coding-challenge"
  | "learning-resources"
  | "email-hr"
  | "linkedin-dm"
  | "interview-lab"
  | "resume-latex"
  | "cover-letter-latex";

export type InterviewLabRenderContext = {
  apiKey: string;
  model: string;
  openaiTranscriptionApiKey: string;
  vercelOidcToken: string;
  onSwitchToGemini?: () => void;
  onToast?: (
    variant: "default" | "success" | "error" | "warning",
    message: string,
    meta?: { docsUrl?: string },
  ) => void;
};

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
  /** Required when rendering `interview-lab` inline in chat */
  interviewLabContext?: InterviewLabRenderContext;
}

export function ComponentRenderer({
  type,
  data,
  chatApiKey,
  chatModel,
  resumeSyncsWithGlobal,
  interviewLabContext,
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
      // Server/UI typically emits jobLinks format: { links: [{ title, url, company }] }
      // Our in-chat component uses JobRecommendations; accept either `links` or `jobs`.
      return (
        <div>
          {header}
          <JobRecommendations data={Array.isArray(d?.links) ? d.links : d?.jobs ?? d} />
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
    case "mock-interview":
      return (
        <div>
          {header}
          <MockInterview data={activeData as any} />
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
    case "interview-lab": {
      const ctx = interviewLabContext;
      if (!ctx) {
        return (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            Interview Lab needs chat settings (API keys). Open Interview Lab from the toolbar instead.
          </p>
        );
      }
      return (
        <div>
          {header}
          <InterviewLabPanel
            variant="embedded"
            open
            onOpenChange={() => {}}
            apiKey={ctx.apiKey}
            model={ctx.model}
            openaiTranscriptionApiKey={ctx.openaiTranscriptionApiKey}
            vercelOidcToken={ctx.vercelOidcToken}
            onSwitchToGemini={ctx.onSwitchToGemini}
            onToast={ctx.onToast}
          />
        </div>
      );
    }
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
    default:                   return null;
  }
}

// ── Response generator (deterministic mock — replace with real AI SDK call) ─

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
  if (lower.includes("job") || lower.includes("recommend") || lower.includes("opportunit")) {
    return {
      text: "Based on your profile and skills, here are the **top job matches** for you right now:",
      componentType: "job-recommendations",
    };
  }
  if (lower.includes("apply") || lower.includes("auto") || lower.includes("automat")) {
    return {
      text: "Starting the automated application flow. I'll search for matching positions, tailor your resume, and submit applications on your behalf:",
      componentType: "auto-applier",
    };
  }
  if (lower.includes("interview") || lower.includes("practice") || lower.includes("prepare")) {
    return {
      text: "Let's warm up for your interview! Here are practice questions tailored to your target role:",
      componentType: "mock-interview",
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
      text: `Here's what I can do for you:\n\n- **Resume** — Build, edit, and customize your resume\n- **CV Score** — Analyze compatibility with job descriptions\n- **Job Matches** — Find roles tailored to your profile\n- **Auto-Apply** — Let me apply to jobs on your behalf\n- **Mock Interview** — Practice with curated questions\n- **Coding Challenges** — Sharpen your technical skills\n- **Learning** — Discover courses to fill skill gaps\n\nJust tell me what you'd like to work on!`,
    };
  }

  return {
    text: `I'm your AI career assistant. I can help you with:\n\n1. **Building** a tailored resume\n2. **Analyzing** your CV score vs job descriptions\n3. **Finding** matching job opportunities\n4. **Automating** job applications\n5. **Preparing** for technical interviews\n6. **Practicing** coding challenges\n7. **Discovering** learning resources\n\nWhat would you like to work on today?`,
  };
}
