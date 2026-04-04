"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Code2,
  ChevronDown,
  ChevronUp,
  Timer,
  Copy,
  Cpu,
  Boxes,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ArtifactTrafficLights, type ArtifactPanelMode } from "@/components/chat/chat-artifact-chrome";
import { copyToClipboard } from "@/lib/clipboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface MockInterviewInteractiveProps {
  questions?: string[];
  technicalQuestions?: string[];
  systemDesignQuestions?: string[];
  quizQuestions?: string[];
  codingProblems?: string[];
  role?: string;
}

const shell = cn(
  "overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg",
  "dark:border-white/10 dark:bg-gradient-to-b dark:from-[#1e1e24]/95 dark:to-[#151518]/98",
  "dark:shadow-[0_24px_64px_-28px_rgba(77,165,252,0.2)] dark:backdrop-blur-md"
);

const tabList = cn(
  "flex h-auto min-h-11 w-full gap-0.5 overflow-x-auto rounded-none border-b border-border p-0 dark:border-white/5"
);

const tabTrigger = cn(
  "shrink-0 rounded-none border-b-2 border-transparent px-2 py-2.5 text-[11px] text-muted-foreground sm:px-2.5 sm:text-xs",
  "data-[state=active]:border-primary data-[state=active]:bg-muted/50 data-[state=active]:text-foreground",
  "dark:data-[state=active]:border-[#4da5fc] dark:data-[state=active]:bg-white/5 dark:data-[state=active]:text-white"
);

const panelScroll = "m-0 max-h-[min(420px,50dvh)] space-y-2 overflow-y-auto p-2 sm:p-3";

const itemShell = cn(
  "overflow-hidden rounded-xl border border-border bg-muted/30 transition-colors",
  "dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/12"
);

function PromptRow({
  text,
  expanded,
  onToggle,
  onCopy,
  answerKey,
  answers,
  setAnswers,
  placeholder,
  icon,
  codeStyle,
}: {
  text: string;
  expanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
  answerKey: string;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  placeholder: string;
  icon?: React.ReactNode;
  codeStyle?: boolean;
}) {
  return (
    <div className={itemShell}>
      <div className="flex items-start gap-1 p-2 sm:gap-2 sm:p-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-white/[0.04] dark:focus-visible:ring-[#4da5fc]/40"
        >
          {icon ? <span className="mt-0.5 shrink-0 text-primary dark:text-[#4da5fc]">{icon}</span> : null}
          <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground dark:text-white">{text}</span>
          {expanded ? (
            <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )}
        </button>
        <button
          type="button"
          title="Copy"
          onClick={onCopy}
          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      {expanded && (
        <div className="border-t border-border px-3 pb-3 dark:border-white/5">
          {codeStyle ? (
            <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 dark:border-white/8 dark:bg-[#08080c]">
              <pre className="mb-3 max-h-32 overflow-auto text-xs leading-relaxed text-muted-foreground dark:text-[#9a9aa5]">
                {text}
              </pre>
              <Textarea
                placeholder="Your approach, complexity, and code…"
                value={answers[answerKey] ?? ""}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [answerKey]: e.target.value }))
                }
                className="min-h-[120px] border-border bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground dark:border-white/10 dark:bg-[#050508] dark:text-emerald-400/95 dark:placeholder:text-[#3a3a45]"
              />
            </div>
          ) : (
            <Textarea
              placeholder={placeholder}
              value={answers[answerKey] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [answerKey]: e.target.value }))
              }
              className="mt-3 min-h-[96px] border-border bg-background text-sm text-foreground placeholder:text-muted-foreground dark:border-white/10 dark:bg-[#0c0c10] dark:text-white dark:placeholder:text-[#5a5a65]"
            />
          )}
        </div>
      )}
    </div>
  );
}

function QuestionList({
  items,
  prefix,
  expanded,
  setExpanded,
  answers,
  setAnswers,
  empty,
  placeholders,
  icons,
}: {
  items: string[];
  prefix: string;
  expanded: number | null;
  setExpanded: (n: number | null) => void;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  empty: string;
  placeholders: { default: string; quiz?: string };
  icons?: (i: number) => React.ReactNode;
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <>
      {items.map((q, i) => {
        const text = typeof q === "string" ? q : JSON.stringify(q);
        const key = `${prefix}-${i}`;
        return (
          <PromptRow
            key={key}
            text={text}
            expanded={expanded === i}
            onToggle={() => setExpanded(expanded === i ? null : i)}
            onCopy={() => void copyToClipboard(text)}
            answerKey={key}
            answers={answers}
            setAnswers={setAnswers}
            placeholder={prefix === "quiz" ? (placeholders.quiz ?? placeholders.default) : placeholders.default}
            icon={icons ? icons(i) : undefined}
          />
        );
      })}
    </>
  );
}

export function MockInterviewInteractive({
  questions = [],
  technicalQuestions = [],
  systemDesignQuestions = [],
  quizQuestions = [],
  codingProblems = [],
  role = "",
}: MockInterviewInteractiveProps) {
  const [expandedB, setExpandedB] = useState<number | null>(0);
  const [expandedT, setExpandedT] = useState<number | null>(null);
  const [expandedS, setExpandedS] = useState<number | null>(null);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [expandedC, setExpandedC] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [codeSolutions, setCodeSolutions] = useState<Record<string, string>>({});
  const [codeLang, setCodeLang] = useState<Record<string, "typescript" | "javascript" | "python" | "java" | "cpp" | "go" | "rust">>({});
  const [codeRunState, setCodeRunState] = useState<
    Record<string, { status: "idle" | "running" | "pass" | "fail"; error?: string; details?: string }>
  >({});
  const [currentTab, setCurrentTab] = useState("behavioral");
  const [submitted, setSubmitted] = useState(false);
  const [totalScore, setTotalScore] = useState<number | null>(null);
  const [review, setReview] = useState<Record<string, { score: number; feedback: string; correction: string }>>({});
  const [fallbackRole, setFallbackRole] = useState(role || "General Software Engineer");
  const [fallbackType, setFallbackType] = useState<"mixed" | "hr" | "technical">("mixed");
  const [artifactPanelMode, setArtifactPanelMode] = useState<ArtifactPanelMode>("expanded");

  const inputQ = Array.isArray(questions) ? questions : [];
  const inputT = Array.isArray(technicalQuestions) ? technicalQuestions : [];
  const inputSD = Array.isArray(systemDesignQuestions) ? systemDesignQuestions : [];
  const inputQuiz = Array.isArray(quizQuestions) ? quizQuestions : [];
  const inputP = Array.isArray(codingProblems) ? codingProblems : [];

  const hasProvidedContent =
    inputQ.length > 0 || inputT.length > 0 || inputSD.length > 0 || inputQuiz.length > 0 || inputP.length > 0;

  const fallbackBehavioral = [
    `Tell me about yourself and why you are a fit for a ${fallbackRole} role.`,
    "Describe a challenging situation and how you handled it using STAR.",
  ];
  const fallbackTechnical = [
    `Explain a technical decision you made recently as a ${fallbackRole} and the tradeoffs.`,
    "How would you debug a production issue where latency suddenly increases by 3x?",
  ];
  const fallbackSystem = [
    "Design a scalable notification service (email + push). What are the core components?",
  ];
  const fallbackQuiz = [
    "What is the difference between horizontal and vertical scaling?",
    "When would you choose eventual consistency?",
  ];
  const fallbackCoding = [
    "Implement two-sum: return indices of two numbers that add up to target.",
  ];

  const qList = hasProvidedContent
    ? inputQ
    : fallbackType === "technical"
      ? []
      : fallbackBehavioral;
  const tList = hasProvidedContent
    ? inputT
    : fallbackType === "hr"
      ? []
      : fallbackTechnical;
  const sdList = hasProvidedContent ? inputSD : fallbackType === "hr" ? [] : fallbackSystem;
  const quizList = hasProvidedContent ? inputQuiz : fallbackType === "hr" ? [] : fallbackQuiz;
  const pList = hasProvidedContent ? inputP : fallbackType === "hr" ? [] : fallbackCoding;

  const evaluateAnswer = (question: string, answer: string) => {
    const a = (answer || "").trim();
    if (!a) {
      return {
        score: 0,
        feedback: "No answer submitted.",
        correction: "Provide a concise, structured answer with concrete details and outcomes.",
      };
    }
    const words = a.split(/\s+/).filter(Boolean).length;
    let score = Math.min(10, Math.max(2, Math.floor(words / 12)));
    const hasNumbers = /\d/.test(a);
    const hasStructure = /(situation|task|action|result|because|therefore|tradeoff|impact)/i.test(a);
    if (hasNumbers) score += 1;
    if (hasStructure) score += 1;
    if (score > 10) score = 10;
    return {
      score,
      feedback:
        score >= 8
          ? "Strong answer with good structure."
          : score >= 5
            ? "Good base, but add sharper structure and measurable impact."
            : "Too shallow. Add context, action details, and measurable outcomes.",
      correction: `Improved outline for "${question}":\n1) Context/Situation\n2) Your approach and reasoning\n3) Key tradeoff(s)\n4) Quantified result and learning`,
    };
  };

  const handleSubmitAll = () => {
    const nextReview: Record<string, { score: number; feedback: string; correction: string }> = {};
    let sum = 0;
    let count = 0;
    const packs: Array<{ list: string[]; prefix: string }> = [
      { list: qList, prefix: "b" },
      { list: tList, prefix: "t" },
      { list: sdList, prefix: "sd" },
      { list: quizList, prefix: "quiz" },
    ];
    for (const pack of packs) {
      pack.list.forEach((q, i) => {
        const key = `${pack.prefix}-${i}`;
        const res = evaluateAnswer(q, answers[key] ?? "");
        nextReview[key] = res;
        sum += res.score;
        count += 1;
      });
    }
    setReview(nextReview);
    setTotalScore(count ? Math.round((sum / (count * 10)) * 100) : 0);
    setSubmitted(true);
  };

  const runCodeSubmission = async (idx: number) => {
    const key = `c-${idx}`;
    const language = codeLang[key] || "javascript";
    const code = codeSolutions[key] || "";
    if (!code.trim()) {
      setCodeRunState((prev) => ({ ...prev, [key]: { status: "fail", error: "Please write a solution before submitting." } }));
      return;
    }
    setCodeRunState((prev) => ({ ...prev, [key]: { status: "running" } }));
    try {
      const res = await fetch("/api/code-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        setCodeRunState((prev) => ({
          ...prev,
          [key]: {
            status: "fail",
            error: data?.error || `Submission failed (${res.status})`,
          },
        }));
        return;
      }
      const passed = Boolean(data?.passed);
      const feedbackText =
        data?.feedback && typeof data.feedback === "object"
          ? [
              data.feedback.summary ? `Summary: ${data.feedback.summary}` : "",
              Array.isArray(data.feedback.strengths) && data.feedback.strengths.length
                ? `Strengths:\n- ${data.feedback.strengths.join("\n- ")}`
                : "",
              Array.isArray(data.feedback.improvements) && data.feedback.improvements.length
                ? `Improvements:\n- ${data.feedback.improvements.join("\n- ")}`
                : "",
              data.feedback.suggestedNextStep ? `Next: ${data.feedback.suggestedNextStep}` : "",
            ]
              .filter(Boolean)
              .join("\n\n")
          : undefined;
      setCodeRunState((prev) => ({
        ...prev,
        [key]: {
          status: passed ? "pass" : "fail",
          error: passed ? undefined : data?.error || "Some tests failed.",
          details:
            (typeof data?.stdout === "string" && data.stdout.trim() ? data.stdout : "") ||
            (typeof data?.stderr === "string" && data.stderr.trim() ? data.stderr : "") ||
            feedbackText,
        },
      }));
    } catch (e) {
      setCodeRunState((prev) => ({
        ...prev,
        [key]: { status: "fail", error: e instanceof Error ? e.message : "Submission failed." },
      }));
    }
  };

  return (
    <Card className={shell} data-no-selection-popover="true">
      <CardHeader className="flex flex-col gap-2 border-b border-border bg-muted/30 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-row flex-wrap items-center gap-2">
          <ArtifactTrafficLights variant="dark" panelMode={artifactPanelMode} setPanelMode={setArtifactPanelMode} />
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm text-foreground dark:text-white">
            <MessageSquare className="h-4 w-4 shrink-0 text-primary dark:text-[#4da5fc]" />
            <span className="font-medium">
              Mock interview
              {role ? <span className="font-normal text-muted-foreground dark:text-[#8a8a8f]"> — {role}</span> : null}
            </span>
          </div>
          <Badge
            variant="outline"
            className="ml-auto shrink-0 border-primary/30 bg-primary/10 text-[10px] font-normal text-primary dark:border-[#4da5fc]/30 dark:bg-[#4da5fc]/10 dark:text-[#9cc8fc]"
          >
            <Timer className="mr-1 h-3 w-3" />
            Interactive
          </Badge>
        </div>
        {artifactPanelMode === "hidden" ? (
          <p className="text-[10px] text-muted-foreground dark:text-[#8a8a8f]">Green dot restores the panel</p>
        ) : artifactPanelMode === "compact" ? (
          <span className="text-[10px] text-muted-foreground dark:text-[#8a8a8f]">Green expands · Yellow shrinks</span>
        ) : null}
      </CardHeader>
      {artifactPanelMode !== "hidden" ? (
      <CardContent
        className={cn(
          "p-0",
          artifactPanelMode === "compact" && "max-h-[min(320px,48vh)] overflow-y-auto overflow-x-hidden",
        )}
      >
        {!hasProvidedContent && (
          <div className="border-b border-border p-3 dark:border-white/10">
            <p className="mb-2 text-xs text-muted-foreground">
              No interview context provided. Configure quick defaults and start practicing.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={fallbackRole}
                onChange={(e) => setFallbackRole(e.target.value)}
                placeholder="Target role (e.g., Frontend Engineer)"
                className="h-9"
              />
              <Select value={fallbackType} onValueChange={(v) => setFallbackType(v as "mixed" | "hr" | "technical")}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed interview</SelectItem>
                  <SelectItem value="hr">HR / Behavioral</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className={tabList}>
            <TabsTrigger value="behavioral" className={tabTrigger}>
              <MessageSquare className="mr-1 h-3 w-3.5 shrink-0 sm:mr-1.5" />
              <span className="whitespace-nowrap">
                Beh. <span className="opacity-70">({qList.length})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="technical" className={tabTrigger}>
              <Cpu className="mr-1 h-3 w-3.5 shrink-0 sm:mr-1.5" />
              <span className="whitespace-nowrap">
                Tech <span className="opacity-70">({tList.length})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="system" className={tabTrigger}>
              <Boxes className="mr-1 h-3 w-3.5 shrink-0 sm:mr-1.5" />
              <span className="whitespace-nowrap">
                System <span className="opacity-70">({sdList.length})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="coding" className={tabTrigger}>
              <Code2 className="mr-1 h-3 w-3.5 shrink-0 sm:mr-1.5" />
              <span className="whitespace-nowrap">
                Code <span className="opacity-70">({pList.length})</span>
              </span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className={tabTrigger}>
              <ListChecks className="mr-1 h-3 w-3.5 shrink-0 sm:mr-1.5" />
              <span className="whitespace-nowrap">
                Quiz <span className="opacity-70">({quizList.length})</span>
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="behavioral" className={panelScroll}>
            <QuestionList
              items={qList}
              prefix="b"
              expanded={expandedB}
              setExpanded={setExpandedB}
              answers={answers}
              setAnswers={setAnswers}
              empty="No behavioral questions in this response."
              placeholders={{
                default: "Draft your answer (STAR: situation, task, action, result)…",
              }}
            />
          </TabsContent>

          <TabsContent value="technical" className={panelScroll}>
            <QuestionList
              items={tList}
              prefix="t"
              expanded={expandedT}
              setExpanded={setExpandedT}
              answers={answers}
              setAnswers={setAnswers}
              empty="No technical questions yet — ask for role-specific trivia, APIs, or debugging."
              placeholders={{
                default: "Explain concepts, tradeoffs, and examples…",
              }}
              icons={() => <Cpu className="h-4 w-4" />}
            />
          </TabsContent>

          <TabsContent value="system" className={panelScroll}>
            <QuestionList
              items={sdList}
              prefix="sd"
              expanded={expandedS}
              setExpanded={setExpandedS}
              answers={answers}
              setAnswers={setAnswers}
              empty="No system design prompts — ask for scalability, storage, or API design."
              placeholders={{
                default: "Outline components, data flow, bottlenecks, and tradeoffs…",
              }}
              icons={() => <Boxes className="h-4 w-4" />}
            />
          </TabsContent>

          <TabsContent value="coding" className={panelScroll}>
            {pList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No coding problems in this response.</p>
            ) : (
              pList.map((p, i) => {
                const text = typeof p === "string" ? p : JSON.stringify(p);
                return (
                  <div key={i} className={cn(itemShell, "dark:hover:border-[#4da5fc]/20")}>
                    <div className="flex items-start gap-1 p-2 sm:gap-2 sm:p-3">
                    <button
                      type="button"
                      onClick={() => setExpandedC(expandedC === i ? null : i)}
                        className="flex min-w-0 flex-1 items-start gap-2 rounded-lg text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-white/[0.04] dark:focus-visible:ring-[#4da5fc]/40"
                    >
                        <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-[#4da5fc]" aria-hidden />
                        <span className="min-w-0 flex-1 text-sm font-medium leading-snug text-foreground dark:text-white">
                        {text}
                      </span>
                        {expandedC === i ? (
                          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        ) : (
                          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        )}
                      </button>
                      <button
                        type="button"
                        title="Copy prompt"
                        onClick={() => void copyToClipboard(text)}
                        className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      </div>
                    {expandedC === i && (
                      <div className="border-t border-border px-3 pb-3 dark:border-white/5">
                        <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 dark:border-white/8 dark:bg-[#08080c]">
                          <pre className="mb-3 max-h-32 overflow-auto text-xs leading-relaxed text-muted-foreground dark:text-[#9a9aa5]">
                            {text}
                          </pre>
                          <Textarea
                            placeholder="Your approach, complexity, and code…"
                            value={codeSolutions[`c-${i}`] ?? ""}
                            onChange={(e) =>
                              setCodeSolutions((prev) => ({ ...prev, [`c-${i}`]: e.target.value }))
                            }
                            className="min-h-[120px] border-border bg-background font-mono text-xs text-foreground placeholder:text-muted-foreground dark:border-white/10 dark:bg-[#050508] dark:text-emerald-400/95 dark:placeholder:text-[#3a3a45]"
                          />
                          <div className="mt-2 flex items-center gap-2">
                            <Select
                              value={codeLang[`c-${i}`] || "javascript"}
                              onValueChange={(v) =>
                                setCodeLang((prev) => ({
                                  ...prev,
                                  [`c-${i}`]: v as "typescript" | "javascript" | "python" | "java" | "cpp" | "go" | "rust",
                                }))
                              }
                            >
                              <SelectTrigger className="h-8 w-[130px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="javascript">JavaScript</SelectItem>
                                <SelectItem value="typescript">TypeScript</SelectItem>
                                <SelectItem value="python">Python</SelectItem>
                                <SelectItem value="java">Java</SelectItem>
                                <SelectItem value="cpp">C++</SelectItem>
                                <SelectItem value="go">Go</SelectItem>
                                <SelectItem value="rust">Rust</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => void runCodeSubmission(i)}
                              disabled={codeRunState[`c-${i}`]?.status === "running"}
                            >
                              {codeRunState[`c-${i}`]?.status === "running" ? "Submitting..." : "Submit solution"}
                            </Button>
                          </div>
                          {codeRunState[`c-${i}`]?.status === "pass" && (
                            <p className="mt-2 text-xs text-emerald-500">Passed tests. Nice work.</p>
                          )}
                          {codeRunState[`c-${i}`]?.status === "fail" && (
                            <p className="mt-2 text-xs text-rose-500">
                              {codeRunState[`c-${i}`]?.error || "Submission failed."}
                            </p>
                          )}
                          {codeRunState[`c-${i}`]?.details ? (
                            <pre className="mt-2 max-h-24 overflow-auto rounded-md border border-border bg-background p-2 text-[11px] text-muted-foreground">
                              {codeRunState[`c-${i}`]?.details}
                            </pre>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="quiz" className={panelScroll}>
            <QuestionList
              items={quizList}
              prefix="quiz"
              expanded={expandedQ}
              setExpanded={setExpandedQ}
              answers={answers}
              setAnswers={setAnswers}
              empty="No quick-fire quiz items — ask for rapid Q&A or trivia."
              placeholders={{
                default: "Short answer…",
                quiz: "Answer in 1–3 sentences…",
              }}
              icons={() => <ListChecks className="h-4 w-4" />}
            />
          </TabsContent>
        </Tabs>
        <div className="border-t border-border p-3 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Submit all written answers to get score + corrections.
            </p>
            <Button size="sm" onClick={handleSubmitAll}>
              Submit interview answers
            </Button>
          </div>
          {submitted && (
            <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/30 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <p className="text-sm font-semibold text-foreground dark:text-white">
                Result: {totalScore ?? 0} / 100
              </p>
              <div className="space-y-2">
                {Object.entries(review).map(([key, r]) => (
                  <div key={key} className="rounded-md border border-border bg-background p-2 dark:border-white/10 dark:bg-[#0b0b10]">
                    <p className="text-xs font-medium text-foreground dark:text-white">
                      {key}: {r.score}/10
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{r.feedback}</p>
                    <pre className="mt-1 whitespace-pre-wrap text-[11px] text-muted-foreground">{r.correction}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      ) : null}
    </Card>
  );
}
