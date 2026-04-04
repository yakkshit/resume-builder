"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { CardTitle } from "@/components/ui/card";
import { ChatArtifactWindow } from "@/components/chat/chat-artifact-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ExternalLink,
  FileText,
  Mail,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Target,
  Pencil,
  Settings,
  Copy,
  ChevronDown,
  Sparkles,
  ListChecks,
  Link2,
  CheckCircle2,
} from "lucide-react";
import { MockInterviewInteractive } from "./mock-interview-interactive";
import type { ResumeData, Template } from "@/lib/types";
import { mergeResumeDataWithDefault } from "@/lib/sanitize-resume-data";
import ResumeEditor from "@/components/resume-coverletter/resume-editor";
import { resumeTemplates } from "@/components/pdf-templates";
import { cn } from "@/lib/utils";
import { copyToClipboard } from "@/lib/clipboard";

/** Shared shell for chat-embedded artifacts */
const CHAT_ARTIFACT = cn(
  "overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#1e1e24]/95 to-[#151518]/98",
  "shadow-[0_24px_64px_-28px_rgba(77,165,252,0.2)] backdrop-blur-md"
);
const CHAT_ARTIFACT_HEADER = "flex flex-row items-center gap-3 border-b border-white/10 bg-white/[0.04] py-3 px-4";

// Dynamic PDF viewer (client-only)
const PdfPreviewClient = dynamic(
  () => import("@/components/resume-coverletter/pdf-viewer"),
  { ssr: false }
);

export interface ComponentPropsMap {
  cv: {
    resumeData: ResumeData;
    template?: Template;
    setResumeData?: (data: ResumeData | ((prev: ResumeData) => ResumeData)) => void;
    setTemplate?: (t: Template) => void;
  };
  coverLetter: { head: string; body: string; footer: string };
  jobLinks: { links: Array<{ title: string; url: string; company?: string }> };
  cvScorer: { score: number; feedback: string[]; jobDescription?: string };
  course: { title: string; provider: string; url?: string; skills: string[] };
  mockInterview: {
    /** Behavioral / STAR prompts (alias: `behavioralQuestions`) */
    questions?: string[];
    behavioralQuestions?: string[];
    technicalQuestions?: string[];
    systemDesignQuestions?: string[];
    quizQuestions?: string[];
    codingProblems?: string[];
    role?: string;
  };
  hrNote: { subject: string; body: string; to?: string };
  jobApplySimulator: { steps: Array<{ action: string; status: "pending" | "done" | "current" | "failed"; details?: string }> };
}

export type ComponentType = keyof ComponentPropsMap;

function CvComponent({
  resumeData,
  template = "modern",
  setResumeData,
  setTemplate,
}: ComponentPropsMap["cv"]) {
  const isEditable = !!setResumeData;

  if (isEditable) {
    return (
      <ChatArtifactWindow
        variant="dark"
        cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
        headerClassName={cn(CHAT_ARTIFACT_HEADER, "!flex-row !items-center flex-wrap gap-2 py-2")}
        contentClassName="space-y-0 p-3 pt-0"
        title={
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
              <FileText className="h-4 w-4 text-[#4da5fc]" />
              CV Builder
            </CardTitle>
            <p className="text-[11px] text-[#8a8a8f] sm:max-w-[55%] sm:text-right">
              Use the <span className="text-white/80">Editor</span> tab to edit fields; changes save to your chat resume.
            </p>
          </div>
        }
      >
          <Tabs defaultValue="pdf" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pdf" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                PDF View
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Template
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pdf" className="mt-3">
              <div className="h-[380px] rounded-lg overflow-hidden border">
                <PdfPreviewClient resumeData={resumeData} template={template} />
              </div>
            </TabsContent>
            <TabsContent value="editor" className="mt-3">
              <div className="max-h-[400px] overflow-y-auto rounded-lg border p-4">
                <ResumeEditor
                  resumeData={resumeData}
                  setResumeData={setResumeData!}
                />
              </div>
            </TabsContent>
            <TabsContent value="settings" className="mt-3">
              <div className="space-y-4 p-2">
                <div>
                  <Label>Select Template</Label>
                  <Select
                    value={template}
                    onValueChange={(v) => setTemplate?.(v as Template)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose template" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(resumeTemplates).map((key) => (
                        <SelectItem key={key} value={key}>
                          {key.charAt(0).toUpperCase() +
                            key.slice(1).replace(/-/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
      </ChatArtifactWindow>
    );
  }

  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={cn(CHAT_ARTIFACT_HEADER, "py-2")}
      contentClassName="p-0"
      title={
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <FileText className="h-4 w-4 text-[#4da5fc]" />
          CV Preview
        </CardTitle>
      }
    >
      <div className="h-[400px]">
        <PdfPreviewClient resumeData={resumeData} template={template} />
      </div>
    </ChatArtifactWindow>
  );
}

function CoverLetterComponent({ head, body, footer }: ComponentPropsMap["coverLetter"]) {
  const [bodyOpen, setBodyOpen] = useState(true);
  const fullLetter = [safeStr(head), safeStr(body), safeStr(footer)].filter(Boolean).join("\n\n");

  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={cn(CHAT_ARTIFACT_HEADER, "justify-between gap-2")}
      contentClassName="p-0"
      title={
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Sparkles className="h-4 w-4 text-[#4da5fc]" />
          Cover letter
        </CardTitle>
      }
      trailing={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 gap-1.5 shrink-0 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
          onClick={() => void copyToClipboard(fullLetter)}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy all
        </Button>
      }
    >
        <div className="space-y-0 px-4 py-3 text-[#e8e8ed]">
          <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed border-l-2 border-[#4da5fc]/50 pl-3">
            {safeStr(head)}
          </p>
          <Collapsible open={bodyOpen} onOpenChange={setBodyOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 h-8 w-full justify-between px-2 text-[#a0a0a5] hover:bg-white/5 hover:text-white"
              >
                <span className="text-xs font-medium">Body</span>
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", bodyOpen && "rotate-180")}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="whitespace-pre-wrap rounded-xl border border-white/5 bg-[#0f0f12]/80 p-3 text-sm leading-relaxed text-[#cfcfd3]">
                {safeStr(body)}
              </div>
            </CollapsibleContent>
          </Collapsible>
          <p className="whitespace-pre-wrap pt-3 text-sm text-[#8a8a8f]">{safeStr(footer)}</p>
        </div>
    </ChatArtifactWindow>
  );
}

function JobLinksComponent({ links }: ComponentPropsMap["jobLinks"]) {
  const linksList = Array.isArray(links) ? links : [];
  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={CHAT_ARTIFACT_HEADER}
      contentClassName="space-y-2 p-4 pt-0"
      title={
        <CardTitle className="text-sm flex flex-wrap items-center gap-2 text-white">
          <Briefcase className="h-4 w-4 text-[#4da5fc]" />
          Job matches
          <Badge variant="outline" className="border-white/15 bg-white/5 text-[10px] text-[#a0a0a5]">
            {linksList.length} roles
          </Badge>
        </CardTitle>
      }
    >
        {linksList.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#8a8a8f]">No links in this response.</p>
        ) : (
          linksList.map((link, i) => {
            const item =
              typeof link === "object" && link !== null
                ? (link as { url?: string; title?: string; company?: string })
                : {};
            const url = typeof item.url === "string" && item.url ? item.url : "";
            const title = safeStr(item.title) || url || "Untitled role";
            return (
              <div
                key={i}
                className="group flex items-stretch gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3 transition-all hover:border-[#4da5fc]/25 hover:bg-white/[0.05] hover:shadow-[0_12px_40px_-24px_rgba(77,165,252,0.35)]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-white">{title}</span>
                    {item.company ? (
                      <Badge variant="secondary" className="shrink-0 border-0 bg-white/10 text-[10px] text-[#cfcfd3]">
                        {safeStr(item.company)}
                      </Badge>
                    ) : null}
                  </div>
                  {url ? (
                    <p className="mt-1 truncate font-mono text-[11px] text-[#6a6a75]">{url}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:items-center">
                  {url ? (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 text-[#a0a0a5] hover:bg-white/10 hover:text-white"
                        title="Copy URL"
                        onClick={() => void copyToClipboard(url)}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-9 gap-1 border-white/10 bg-[#1172e2]/20 text-xs text-white hover:bg-[#1172e2]/30"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
    </ChatArtifactWindow>
  );
}

function safeStr(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object" && "title" in (val as object)) return String((val as { title?: unknown }).title ?? "");
  if (typeof val === "object" && "description" in (val as object)) return String((val as { description?: unknown }).description ?? "");
  if (typeof val === "object" && "name" in (val as object)) return String((val as { name?: unknown }).name ?? "");
  return JSON.stringify(val);
}

function CvScorerComponent({ score, feedback, jobDescription }: ComponentPropsMap["cvScorer"]) {
  const percentage = Math.min(100, Math.max(0, typeof score === "number" ? score : Number(score) || 0));
  const ringColor =
    percentage >= 70
      ? "from-emerald-400/80 to-emerald-600/50"
      : percentage >= 50
        ? "from-amber-400/80 to-amber-600/50"
        : "from-rose-400/80 to-rose-600/50";
  const labelColor =
    percentage >= 70 ? "text-emerald-300" : percentage >= 50 ? "text-amber-300" : "text-rose-300";
  const feedbackList = Array.isArray(feedback) ? feedback : [];
  const [jdOpen, setJdOpen] = useState(false);

  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={CHAT_ARTIFACT_HEADER}
      contentClassName="space-y-5 p-4 pt-0"
      title={
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Target className="h-4 w-4 text-[#4da5fc]" />
          CV vs. job description
        </CardTitle>
      }
    >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={cn(
              "relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br p-[3px] sm:mx-0",
              ringColor
            )}
          >
            <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#121215]">
              <span className={cn("text-2xl font-bold tabular-nums", labelColor)}>{percentage}</span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#6a6a75]">
                match
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-wider text-[#6a6a75]">
              <span>Fit breakdown</span>
              <span className={labelColor}>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2 bg-white/10" />
            <p className="text-xs text-[#8a8a8f]">
              Higher scores mean stronger alignment with the role&apos;s stated requirements.
            </p>
          </div>
        </div>

        {jobDescription ? (
          <Collapsible open={jdOpen} onOpenChange={setJdOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 w-full justify-between px-2 text-[#a0a0a5] hover:bg-white/5 hover:text-white"
              >
                <span className="text-xs font-medium">Job description reference</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", jdOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-white/5 bg-[#0f0f12]/90 p-3 text-xs leading-relaxed text-[#b0b0b8]">
                {safeStr(jobDescription)}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ) : null}

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8a8a8f]">
            <ListChecks className="h-3.5 w-3.5 text-[#4da5fc]" />
            Feedback
          </div>
          <ul className="space-y-2">
            {feedbackList.length === 0 ? (
              <li className="text-sm text-[#8a8a8f]">No detailed feedback in this payload.</li>
            ) : (
              feedbackList.map((f, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-sm text-[#e0e0e5]"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4da5fc]/80" />
                  <span className="leading-relaxed">{safeStr(f)}</span>
                </li>
              ))
            )}
          </ul>
        </div>
    </ChatArtifactWindow>
  );
}

function CourseComponent({ title, provider, url, skills }: ComponentPropsMap["course"]) {
  const skillsList = Array.isArray(skills) ? skills : [];
  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={CHAT_ARTIFACT_HEADER}
      contentClassName="space-y-4 p-4 pt-0"
      title={
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <GraduationCap className="h-4 w-4 text-[#4da5fc]" />
          Learning pick
        </CardTitle>
      }
    >
        <div>
          <h3 className="text-base font-semibold text-white leading-snug">{safeStr(title)}</h3>
          <p className="mt-1 text-sm text-[#8a8a8f]">{safeStr(provider)}</p>
        </div>
        {skillsList.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {skillsList.map((s, i) => (
              <Badge
                key={i}
                variant="outline"
                className="border-[#4da5fc]/20 bg-[#4da5fc]/10 text-[11px] font-normal text-[#b8dcfc]"
              >
                {safeStr(s)}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {url ? (
            <Button
              size="sm"
              className="gap-2 bg-gradient-to-r from-[#1172e2] to-[#4da5fc] text-white shadow-lg shadow-[#1172e2]/20 hover:opacity-95"
              asChild
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                Open course
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-white/15 bg-transparent text-xs text-[#cfcfd3]"
            onClick={() =>
              void copyToClipboard(
                [safeStr(title), safeStr(provider), url ? String(url) : ""].filter(Boolean).join("\n")
              )
            }
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy details
          </Button>
        </div>
    </ChatArtifactWindow>
  );
}

function MockInterviewComponent({
  questions,
  behavioralQuestions,
  technicalQuestions,
  systemDesignQuestions,
  quizQuestions,
  codingProblems,
  role,
}: ComponentPropsMap["mockInterview"]) {
  const behavioral =
    Array.isArray(behavioralQuestions) && behavioralQuestions.length > 0
      ? behavioralQuestions
      : Array.isArray(questions)
        ? questions
        : [];
  const pList = Array.isArray(codingProblems) ? codingProblems : [];
  return (
    <MockInterviewInteractive
      questions={behavioral.map((q) => safeStr(q))}
      technicalQuestions={(Array.isArray(technicalQuestions) ? technicalQuestions : []).map((q) => safeStr(q))}
      systemDesignQuestions={(Array.isArray(systemDesignQuestions) ? systemDesignQuestions : []).map((q) =>
        safeStr(q)
      )}
      quizQuestions={(Array.isArray(quizQuestions) ? quizQuestions : []).map((q) => safeStr(q))}
      codingProblems={pList.map((p) => safeStr(p))}
      role={role ? safeStr(role) : undefined}
    />
  );
}

function HRNoteComponent({ subject, body, to }: ComponentPropsMap["hrNote"]) {
  const mailto =
    to && safeStr(to).includes("@")
      ? `mailto:${encodeURIComponent(safeStr(to))}?subject=${encodeURIComponent(safeStr(subject))}&body=${encodeURIComponent(safeStr(body))}`
      : "";
  const combined = [
    to ? `To: ${safeStr(to)}` : "",
    safeStr(subject),
    "",
    safeStr(body),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={cn(CHAT_ARTIFACT_HEADER, "justify-between gap-2")}
      contentClassName="space-y-3 p-4 pt-0"
      title={
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Mail className="h-4 w-4 text-[#4da5fc]" />
          HR email draft
        </CardTitle>
      }
      trailing={
        <div className="flex shrink-0 flex-wrap gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
            onClick={() => void copyToClipboard(combined)}
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy
          </Button>
          {mailto ? (
            <Button size="sm" className="h-8 gap-1 bg-[#1172e2]/90 text-xs hover:bg-[#1172e2]" asChild>
              <a href={mailto}>
                <ExternalLink className="h-3.5 w-3.5" />
                Mail app
              </a>
            </Button>
          ) : null}
        </div>
      }
    >
        {to ? (
          <p className="text-xs font-medium text-[#8a8a8f]">
            To: <span className="text-[#cfcfd3]">{safeStr(to)}</span>
          </p>
        ) : null}
        <div className="rounded-xl border border-white/8 bg-[#0f0f12]/80 px-3 py-2">
          <p className="text-sm font-semibold text-white">{safeStr(subject)}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-sm leading-relaxed whitespace-pre-wrap text-[#e0e0e5]">
          {safeStr(body)}
        </div>
    </ChatArtifactWindow>
  );
}

function JobApplySimulatorComponent({ steps }: ComponentPropsMap["jobApplySimulator"]) {
  const stepsList = Array.isArray(steps) ? steps : [];
  const failedIdx = useMemo(
    () => stepsList.findIndex((s) => typeof s === "object" && s !== null && (s as any).status === "failed"),
    [stepsList]
  );

  const initialIdx = useMemo(() => {
    const currentIdx = stepsList.findIndex((s) => typeof s === "object" && s !== null && (s as any).status === "current");
    if (currentIdx >= 0) return currentIdx;
    const firstTodo = stepsList.findIndex((s) => typeof s === "object" && s !== null && (s as any).status !== "done");
    return firstTodo >= 0 ? firstTodo : 0;
  }, [stepsList]);

  const [activeIdx, setActiveIdx] = useState<number>(initialIdx);
  const [mode, setMode] = useState<"idle" | "running" | "done" | "failed">("idle");

  useEffect(() => {
    setActiveIdx(initialIdx);
    setMode("idle");
  }, [initialIdx]);

  useEffect(() => {
    if (mode !== "running") return;

    const isFailingNow = failedIdx >= 0 && activeIdx === failedIdx;
    if (isFailingNow) {
      setMode("failed");
      return;
    }

    const isLast = activeIdx >= stepsList.length - 1;
    if (isLast) {
      setMode("done");
      return;
    }

    const t = window.setTimeout(() => {
      setActiveIdx((prev) => Math.min(prev + 1, stepsList.length - 1));
    }, 1800);

    return () => window.clearTimeout(t);
  }, [mode, activeIdx, failedIdx, stepsList.length]);

  const stepState = (i: number): "pending" | "current" | "done" | "failed" => {
    if (failedIdx >= 0 && mode === "failed") {
      if (i === failedIdx) return "failed";
      if (i < failedIdx) return "done";
      return "pending";
    }
    if (mode === "done") {
      return i <= activeIdx ? "done" : "pending";
    }
    if (mode === "running") {
      if (i === activeIdx) return "current";
      return i < activeIdx ? "done" : "pending";
    }
    // idle
    return i === activeIdx ? "current" : i < activeIdx ? "done" : "pending";
  };

  const headline =
    mode === "failed"
      ? "Application Failed"
      : mode === "done"
        ? "Application Submitted"
        : mode === "running"
          ? "Applying..."
          : "Ready to apply";

  return (
    <ChatArtifactWindow
      variant="dark"
      cardClassName={cn(CHAT_ARTIFACT, "border-white/10")}
      headerClassName={cn(CHAT_ARTIFACT_HEADER, "flex-wrap py-2")}
      contentClassName="p-4 pt-0"
      title={
        <CardTitle className="text-sm flex flex-wrap items-center gap-2 text-white">
          Job Application Simulator
          <span className="text-[11px] font-normal text-[#8a8a8f] truncate">{headline}</span>
        </CardTitle>
      }
      trailing={
        <div className="flex flex-wrap items-center gap-2">
          {mode !== "running" ? (
            <Button
              size="sm"
              variant="secondary"
              className="h-8"
              onClick={() => setMode("running")}
              disabled={!stepsList.length}
            >
              Start
            </Button>
          ) : (
            <Button size="sm" variant="secondary" className="h-8" onClick={() => setMode("idle")}>
              Pause
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            onClick={() => {
              setActiveIdx(initialIdx);
              setMode("idle");
            }}
            disabled={!stepsList.length}
          >
            Reset
          </Button>
        </div>
      }
    >
        <div className="space-y-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0e] p-3 font-mono text-xs text-emerald-400/95">
          {stepsList.map((step, i) => {
            const s =
              typeof step === "object" && step !== null
                ? (step as { action?: string; details?: string; status?: string })
                : ({} as any);
            const state = stepState(i);
            return (
              <div key={i} className="flex items-start gap-2">
                <span
                  className={
                    state === "done"
                      ? "text-green-500"
                      : state === "failed"
                        ? "text-rose-400"
                        : state === "current"
                          ? "text-amber-400 animate-pulse"
                          : "text-neutral-500"
                  }
                >
                  {state === "done" ? "✓" : state === "failed" ? "!" : state === "current" ? "→" : "○"}
                </span>
                <span className="text-[#c8c8d0]">
                  {safeStr(s.action)}
                  {state === "failed" && <span className="ml-2 text-rose-300">(Failed)</span>}
                  {mode === "done" && i === stepsList.length - 1 && <span className="ml-2 text-green-300">(Submitted)</span>}
                </span>
                {s.details && <span className="text-neutral-500">— {safeStr(s.details)}</span>}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-[#6a6a75]">
          Simulation only — real auto-apply needs a browser extension or automation you control.
        </p>
    </ChatArtifactWindow>
  );
}

export const CHAT_COMPONENT_REGISTRY: Record<
  ComponentType,
  (props: ComponentPropsMap[ComponentType]) => React.ReactElement
> = {
  cv: CvComponent as (p: ComponentPropsMap["cv"]) => React.ReactElement,
  coverLetter: CoverLetterComponent,
  jobLinks: JobLinksComponent,
  cvScorer: CvScorerComponent,
  course: CourseComponent,
  mockInterview: MockInterviewComponent,
  hrNote: HRNoteComponent,
  jobApplySimulator: JobApplySimulatorComponent,
};

export interface CvComponentContext {
  resumeData: import("@/lib/types").ResumeData;
  setResumeData: (data: import("@/lib/types").ResumeData | ((prev: import("@/lib/types").ResumeData) => import("@/lib/types").ResumeData)) => void;
  template: import("@/lib/types").Template;
  setTemplate: (t: import("@/lib/types").Template) => void;
}

export function renderChatComponent(
  type: ComponentType,
  props: unknown,
  context?: { cv?: CvComponentContext }
): React.ReactElement | null {
  const Component = CHAT_COMPONENT_REGISTRY[type];
  if (!Component || props == null || typeof props !== "object" || Array.isArray(props)) return null;
  try {
    let mergedProps = { ...(props as Record<string, unknown>) };
    if (type === "cv") {
      // Live React state must win over frozen JSON from the assistant message, or edits never apply.
      const rawRd = context?.cv?.resumeData ?? mergedProps.resumeData;
      const rawTpl = context?.cv?.template ?? mergedProps.template;
      const tplStr = typeof rawTpl === "string" ? rawTpl : "modern";
      const safeTemplate = (tplStr in resumeTemplates ? tplStr : "modern") as Template;
      mergedProps = {
        ...mergedProps,
        resumeData: mergeResumeDataWithDefault(rawRd),
        template: safeTemplate,
        ...(context?.cv
          ? {
              setResumeData: context.cv.setResumeData,
              setTemplate: context.cv.setTemplate,
            }
          : {}),
      };
    }
    const element = React.createElement(Component, mergedProps as ComponentPropsMap[ComponentType]);
    return React.isValidElement(element) ? element : null;
  } catch {
    return null;
  }
}
