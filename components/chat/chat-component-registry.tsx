"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ExternalLink, FileText, Mail, Briefcase, GraduationCap, MessageSquare, Target, Pencil, Settings } from "lucide-react";
import { MockInterviewInteractive } from "./mock-interview-interactive";
import type { ResumeData, Template } from "@/lib/types";
import ResumeEditor from "@/components/resume-coverletter/resume-editor";
import { resumeTemplates } from "@/components/pdf-templates";
import { cn } from "@/lib/utils";

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
  mockInterview: { questions: string[]; codingProblems?: string[]; role?: string };
  hrNote: { subject: string; body: string; to?: string };
  jobApplySimulator: { steps: Array<{ action: string; status: "pending" | "done" | "current"; details?: string }> };
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
      <Card className="overflow-hidden border-2 border-white/10 bg-[#1a1a1e] shadow-xl">
        <CardHeader className="py-2 bg-white/5 border-b border-white/10">
          <CardTitle className="text-sm flex items-center gap-2 text-white">
            <FileText className="h-4 w-4" />
            CV Builder
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-2 border-white/10 bg-[#1a1a1e] shadow-xl">
      <CardHeader className="py-2 bg-white/5 border-b border-white/10">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <FileText className="h-4 w-4" />
          CV Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[400px]">
        <PdfPreviewClient resumeData={resumeData} template={template} />
      </CardContent>
    </Card>
  );
}

function CoverLetterComponent({ head, body, footer }: ComponentPropsMap["coverLetter"]) {
  return (
    <Card className="border-2 border-white/10 bg-[#1a1a1e] shadow-xl">
      <CardHeader className="py-2 bg-white/5 border-b border-white/10">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Mail className="h-4 w-4" />
          Cover Letter
        </CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm dark:prose-invert max-w-none py-4 text-[#e0e0e5]">
        <p className="whitespace-pre-wrap font-medium">{safeStr(head)}</p>
        <div className="whitespace-pre-wrap my-4">{safeStr(body)}</div>
        <p className="whitespace-pre-wrap text-[#8a8a8f] text-sm">{safeStr(footer)}</p>
      </CardContent>
    </Card>
  );
}

function JobLinksComponent({ links }: ComponentPropsMap["jobLinks"]) {
  const linksList = Array.isArray(links) ? links : [];
  return (
    <Card className="border-2 border-white/10 bg-[#1a1a1e] shadow-xl">
      <CardHeader className="py-2 bg-white/5 border-b border-white/10">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Briefcase className="h-4 w-4" />
          Job Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 space-y-2">
        {linksList.map((link, i) => {
          const item = typeof link === "object" && link !== null ? link as { url?: string; title?: string; company?: string } : {};
          const url = typeof item.url === "string" ? item.url : "#";
          return (
            <a
              key={i}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="font-medium truncate flex-1">{safeStr(item.title)}</span>
              {item.company && (
                <Badge variant="secondary" className="ml-2 shrink-0">{safeStr(item.company)}</Badge>
              )}
              <ExternalLink className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </a>
          );
        })}
      </CardContent>
    </Card>
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
  const percentage = Math.min(100, Math.max(0, typeof score === "number" ? score : 0));
  const color = percentage >= 70 ? "text-green-600" : percentage >= 50 ? "text-amber-600" : "text-red-600";
  const feedbackList = Array.isArray(feedback) ? feedback : [];
  return (
    <Card className="border-2 border-white/10 bg-[#1a1a1e] shadow-xl">
      <CardHeader className="py-2 bg-white/5 border-b border-white/10">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Target className="h-4 w-4" />
          CV Score
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-4 border-primary/20">
            <span className={cn("text-2xl font-bold", color)}>{percentage}%</span>
          </div>
          {jobDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{safeStr(jobDescription).slice(0, 120)}...</p>
          )}
        </div>
        <ul className="space-y-1 text-sm">
          {feedbackList.map((f, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-primary">•</span>
              {safeStr(f)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CourseComponent({ title, provider, url, skills }: ComponentPropsMap["course"]) {
  const skillsList = Array.isArray(skills) ? skills : [];
  return (
    <Card className="border-2 border-white/10 bg-[#1a1a1e] shadow-xl">
      <CardHeader className="py-2 bg-white/5 border-b border-white/10">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <GraduationCap className="h-4 w-4" />
          Recommended Course
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 space-y-2">
        <p className="font-medium">{safeStr(title)}</p>
        <p className="text-sm text-muted-foreground">{safeStr(provider)}</p>
        <div className="flex flex-wrap gap-1">
          {skillsList.map((s, i) => (
            <Badge key={i} variant="outline" className="text-xs">{safeStr(s)}</Badge>
          ))}
        </div>
        {url && (
          <Button variant="link" size="sm" className="p-0 h-auto" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              View Course <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function MockInterviewComponent({ questions, codingProblems, role }: ComponentPropsMap["mockInterview"]) {
  const qList = Array.isArray(questions) ? questions : [];
  const pList = Array.isArray(codingProblems) ? codingProblems : [];
  return (
    <MockInterviewInteractive
      questions={qList.map((q) => safeStr(q))}
      codingProblems={pList.map((p) => safeStr(p))}
      role={role ? safeStr(role) : undefined}
    />
  );
}

function HRNoteComponent({ subject, body, to }: ComponentPropsMap["hrNote"]) {
  return (
    <Card className="border-2 border-white/10 bg-[#1a1a1e] shadow-xl">
      <CardHeader className="py-2 bg-white/5 border-b border-white/10">
        <CardTitle className="text-sm flex items-center gap-2 text-white">
          <Mail className="h-4 w-4" />
          Note to HR
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3 space-y-2">
        {to && <p className="text-xs text-muted-foreground">To: {safeStr(to)}</p>}
        <p className="font-medium">{safeStr(subject)}</p>
        <p className="text-sm whitespace-pre-wrap">{safeStr(body)}</p>
      </CardContent>
    </Card>
  );
}

function JobApplySimulatorComponent({ steps }: ComponentPropsMap["jobApplySimulator"]) {
  const stepsList = Array.isArray(steps) ? steps : [];
  return (
    <Card className="border-2 overflow-hidden">
      <CardHeader className="py-2 bg-muted/50 flex flex-row items-center gap-2">
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <CardTitle className="text-sm flex items-center gap-2">
          Job Application Simulator
        </CardTitle>
      </CardHeader>
      <CardContent className="py-3">
        <div className="space-y-2 font-mono text-xs bg-neutral-900 text-green-400 p-3 rounded-lg overflow-x-auto">
          {stepsList.map((step, i) => {
            const s = typeof step === "object" && step !== null ? step as { action?: string; status?: string; details?: string } : {};
            const status = s.status as string | undefined;
            return (
              <div key={i} className="flex items-start gap-2">
                <span className={status === "done" ? "text-green-500" : status === "current" ? "text-amber-400" : "text-neutral-500"}>
                  {status === "done" ? "✓" : status === "current" ? "→" : "○"}
                </span>
                <span>{safeStr(s.action)}</span>
                {s.details && <span className="text-neutral-500">— {safeStr(s.details)}</span>}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This is a visual simulation. Install a browser extension for actual auto-apply.
        </p>
      </CardContent>
    </Card>
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
  if (!Component || !props || typeof props !== "object") return null;
  try {
    let mergedProps = { ...(props as Record<string, unknown>) };
    if (type === "cv" && context?.cv) {
      mergedProps = {
        ...mergedProps,
        resumeData: mergedProps.resumeData ?? context.cv.resumeData,
        template: mergedProps.template ?? context.cv.template,
        setResumeData: context.cv.setResumeData,
        setTemplate: context.cv.setTemplate,
      };
    }
    const element = React.createElement(Component, mergedProps as ComponentPropsMap[ComponentType]);
    return React.isValidElement(element) ? element : null;
  } catch {
    return null;
  }
}
