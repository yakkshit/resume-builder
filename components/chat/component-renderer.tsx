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
const ChartViewer = dynamic(
  () => import("./components/chart-viewer").then((m) => m.ChartViewer),
  { loading },
);
const BrowserController = dynamic(
  () => import("./components/browser-controller").then((m) => m.BrowserController),
  { loading },
);

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PanelRightOpen, PanelRightClose, Sparkles, Layout } from "lucide-react";

export type ComponentType =
  | "resume"
  | "cover-letter"
  | "cv-score"
  | "job-recommendations"
  | "job-scraper"
  | "chart"
  | "auto-applier"
  | "coding-challenge"
  | "learning-resources"
  | "email-hr"
  | "linkedin-dm"
  | "resume-latex"
  | "cover-letter-latex"
  | "browser";

export const COMPONENT_TITLES: Record<ComponentType, string> = {
  resume: "Resume Preview & Editor",
  "cover-letter": "Cover Letter Document",
  "resume-latex": "LaTeX Resume Document",
  "cover-letter-latex": "LaTeX Cover Letter",
  "cv-score": "CV Match Score & Insights",
  "job-recommendations": "Recommended Opportunities",
  "job-scraper": "Live Job Scraper & Matcher",
  chart: "Career Analytics & Metrics",
  "auto-applier": "Autonomous Job Applier",
  "coding-challenge": "Technical Coding Challenge",
  "learning-resources": "Curated Skill Roadmap",
  "email-hr": "HR Email Outreach Assistant",
  "linkedin-dm": "LinkedIn Networking Messenger",
  browser: "Autonomous Browser Controller",
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
  onSendMessage?: (text: string) => void;
  componentId?: string;
  onPopOutToSide?: (opts: { id: string; type: ComponentType; data?: Record<string, unknown>; title: string }) => void;
  onDockToChat?: () => void;
  isInSideStage?: boolean;
  isSideActive?: boolean;
}

export function ComponentRenderer({
  type,
  data,
  chatApiKey,
  chatModel,
  resumeSyncsWithGlobal,
  onSendMessage,
  componentId,
  onPopOutToSide,
  onDockToChat,
  isInSideStage,
  isSideActive,
}: ComponentRendererProps) {
  const translationFieldId = useId();
  const [targetLanguage, setTargetLanguage] = useState(TRANSLATION_ORIGINAL);
  const [translatedData, setTranslatedData] = useState<Record<string, unknown> | undefined>(
    data,
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedLatex, setTranslatedLatex] = useState<string | undefined>(undefined);

  const isTemplateType =
    type === "resume" ||
    type === "cover-letter" ||
    type === "resume-latex" ||
    type === "cover-letter-latex";

  const title = COMPONENT_TITLES[type] || "Interactive Component";

  useEffect(() => {
    setTranslatedData(data);
  }, [data]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      // Only translate template content (resume and cover-letter documents)
      if (!isTemplateType || !data || targetLanguage === TRANSLATION_ORIGINAL) {
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
  }, [data, targetLanguage, isTemplateType]);

  // Special-case LaTeX: translate "plain text runs" without overwriting saved source.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!isTemplateType || targetLanguage === TRANSLATION_ORIGINAL) {
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
  }, [data, targetLanguage, isTemplateType]);

  const activeData = useMemo(
    () => (isTemplateType ? translatedData ?? data : data),
    [isTemplateType, translatedData, data]
  );

  // If this component is currently active in the side stage and we are rendering in the chat stream, show an interactive Google-grade placeholder card
  if (isSideActive && !isInSideStage) {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center size-7 rounded-lg bg-primary/15 text-primary">
            <Layout className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{title}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              Currently open in the right side canvas
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDockToChat}
          className="h-7 text-xs gap-1.5 rounded-md border-primary/30 hover:bg-primary/10 text-primary"
        >
          <PanelRightClose className="size-3.5" />
          <span>Bring into Chat</span>
        </Button>
      </div>
    );
  }

  const header = (
    <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
      <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-primary/70" />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        {isTemplateType && (
          <TranslationControls
            id={translationFieldId}
            value={targetLanguage}
            disabled={isTranslating}
            isTranslating={isTranslating}
            onChange={setTargetLanguage}
          />
        )}
        {onPopOutToSide && !isInSideStage && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onPopOutToSide({
                      id: componentId || `${type}-${Date.now()}`,
                      type,
                      data: activeData,
                      title,
                    })
                  }
                  className="h-7 px-2 text-[11px] gap-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <PanelRightOpen className="size-3.5" />
                  <span className="hidden sm:inline">Side Panel</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Open in side-by-side workspace panel
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isInSideStage && onDockToChat && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onDockToChat}
                  className="h-7 px-2 text-[11px] gap-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <PanelRightClose className="size-3.5" />
                  <span className="hidden sm:inline">Dock to Chat</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Dock back into chat bubble
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
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
    case "cv-score":
      return (
        <div>
          {header}
          <CVScore data={data as any} />
        </div>
      );
    case "job-recommendations": {
      const d = data as any;
      return (
        <div>
          {header}
          <JobRecommendations data={Array.isArray(d?.links) ? d.links : d?.jobs ?? d} />
        </div>
      );
    }
    case "job-scraper": {
      const d = data as any;
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
    case "chart":
      return (
        <div>
          {header}
          <ChartViewer data={data as any} />
        </div>
      );
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
          <CodingChallenge data={data as any} />
        </div>
      );
    case "learning-resources":
      return (
        <div>
          {header}
          <LearningResources data={data as any} />
        </div>
      );
    case "email-hr":
      return (
        <div>
          {header}
          <EmailHrPanel data={data} chatApiKey={chatApiKey} chatModel={chatModel} />
        </div>
      );
    case "linkedin-dm":
      return (
        <div>
          {header}
          <LinkedinDmPanel data={data} />
        </div>
      );
    case "browser":
      return (
        <div>
          {header}
          <BrowserController data={data as any} onSendMessage={onSendMessage} />
        </div>
      );
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
