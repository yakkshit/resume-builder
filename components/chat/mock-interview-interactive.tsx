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
import { copyToClipboard } from "@/lib/clipboard";

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
  const [currentTab, setCurrentTab] = useState("behavioral");

  const qList = Array.isArray(questions) ? questions : [];
  const tList = Array.isArray(technicalQuestions) ? technicalQuestions : [];
  const sdList = Array.isArray(systemDesignQuestions) ? systemDesignQuestions : [];
  const quizList = Array.isArray(quizQuestions) ? quizQuestions : [];
  const pList = Array.isArray(codingProblems) ? codingProblems : [];

  return (
    <Card className={shell} data-no-selection-popover="true">
      <CardHeader className="flex flex-row items-center gap-3 border-b border-border bg-muted/30 px-4 py-3 dark:border-white/10 dark:bg-white/[0.04]">
        <CardTitle className="flex flex-1 flex-wrap items-center gap-2 text-sm text-foreground dark:text-white">
          <MessageSquare className="h-4 w-4 shrink-0 text-primary dark:text-[#4da5fc]" />
          <span>
            Mock interview
            {role ? <span className="font-normal text-muted-foreground dark:text-[#8a8a8f]"> — {role}</span> : null}
          </span>
          <Badge
            variant="outline"
            className="ml-auto border-primary/30 bg-primary/10 text-[10px] font-normal text-primary dark:border-[#4da5fc]/30 dark:bg-[#4da5fc]/10 dark:text-[#9cc8fc]"
          >
            <Timer className="mr-1 h-3 w-3" />
            Interactive
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
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
      </CardContent>
    </Card>
  );
}
