"use client";

import { ResumeViewer } from "./components/resume-viewer";
import { CVScore } from "./components/cv-score";
import { JobRecommendations } from "./components/job-recommendations";
import { AutoApplier } from "./components/auto-applier";
import { MockInterview } from "./components/mock-interview";
import { CodingChallenge } from "./components/coding-challenge";
import { LearningResources } from "./components/learning-resources";
import { CoverLetterViewer } from "./components/cover-letter-viewer";
import { EmailHrPanel } from "./components/email-hr-panel";
import { LinkedinDmPanel } from "./components/linkedin-dm-panel";
import { InterviewLabPanel } from "./interview-lab-panel";
import { ResumeLatexArtifact } from "./resume-latex-artifact";

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
  switch (type) {
    case "resume":
      return <ResumeViewer data={data} syncWithGlobalResume={resumeSyncsWithGlobal !== false} />;
    case "cover-letter":       return <CoverLetterViewer data={data as any} />;
    case "cover-letter-latex": {
      const rec = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const latex = typeof rec?.latex === "string" ? rec.latex : undefined;
      return <ResumeLatexArtifact initialLatex={latex} kind="cover-letter" />;
    }
    case "cv-score":           return <CVScore data={data as any} />;
    case "job-recommendations": {
      const d = data as any;
      // Server/UI typically emits jobLinks format: { links: [{ title, url, company }] }
      // Our in-chat component uses JobRecommendations; accept either `links` or `jobs`.
      return <JobRecommendations data={Array.isArray(d?.links) ? d.links : d?.jobs ?? d} />;
    }
    case "auto-applier":       return <AutoApplier />;
    case "mock-interview":     return <MockInterview data={data as any} />;
    case "coding-challenge":   return <CodingChallenge data={data as any} />;
    case "learning-resources": return <LearningResources data={(data as any)?.resources} />;
    case "email-hr":           return <EmailHrPanel data={data} chatApiKey={chatApiKey} chatModel={chatModel} />;
    case "linkedin-dm":        return <LinkedinDmPanel data={data} />;
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
      );
    }
    case "resume-latex": {
      const rec = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const latex = typeof rec?.latex === "string" ? rec.latex : undefined;
      return <ResumeLatexArtifact initialLatex={latex} kind="resume" />;
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
