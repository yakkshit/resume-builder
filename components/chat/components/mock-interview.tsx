"use client";

import { useState } from "react";
import { GraduationCap, Clock, ChevronLeft, ChevronRight, Mic } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Question {
  question: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: string;
  tip: string;
}

const QUESTIONS: Question[] = [
  {
    question: "Tell me about yourself and your professional background.",
    difficulty: "Easy",
    category: "Behavioral",
    tip: "Use the Present-Past-Future formula: current role → key experience → why this role.",
  },
  {
    question: "Describe a challenging project and how you overcame obstacles.",
    difficulty: "Medium",
    category: "Behavioral",
    tip: "Use the STAR method: Situation, Task, Action, Result.",
  },
  {
    question: "Explain the difference between REST and GraphQL APIs.",
    difficulty: "Medium",
    category: "Technical",
    tip: "Cover query flexibility, over-fetching, and use cases for each.",
  },
  {
    question: "How do you handle conflicting priorities under tight deadlines?",
    difficulty: "Hard",
    category: "Behavioral",
    tip: "Mention stakeholder communication, prioritisation frameworks, and trade-offs.",
  },
];

const difficultyColor: Record<string, string> = {
  Easy: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  Medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  Hard: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

export interface MockInterviewProps {
  data?: {
    questions?: string[];
    role?: string;
  };
}

export function MockInterview({ data }: MockInterviewProps) {
  const dynamicQuestions: Question[] | null = data?.questions?.map((q) => ({
    question: q,
    difficulty: "Medium",
    category: "Interview",
    tip: "Use the STAR method: Situation, Task, Action, Result.",
  })) || null;

  const activeQuestions = dynamicQuestions || QUESTIONS;

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(activeQuestions.length).fill(""));
  const [showTip, setShowTip] = useState(false);

  const q = activeQuestions[current];

  return (
    <Card className="w-full border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <GraduationCap className="w-4 h-4 text-purple-500" />
          Mock Interview Practice
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Question {current + 1} of {activeQuestions.length}</span>
            <Badge className={`text-[10px] border ${difficultyColor[q.difficulty]}`}>{q.difficulty}</Badge>
          </div>
          <Progress value={((current + 1) / activeQuestions.length) * 100} className="h-1.5" />
        </div>

        {/* Question */}
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-purple-500">{current + 1}</span>
            </div>
            <div>
              <Badge variant="secondary" className="text-[10px] mb-2">{q.category}</Badge>
              <p className="text-sm font-medium">{q.question}</p>
            </div>
          </div>
        </div>

        {/* Tip */}
        {showTip && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
            💡 <span className="font-semibold">Tip:</span> {q.tip}
          </div>
        )}

        {/* Answer */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Your Answer</Label>
          <Textarea
            placeholder="Start typing your answer here…"
            value={answers[current]}
            onChange={(e) => {
              const updated = [...answers];
              updated[current] = e.target.value;
              setAnswers(updated);
            }}
            className="text-sm min-h-[100px] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setShowTip(!showTip)}
          >
            {showTip ? "Hide tip" : "Show tip"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setCurrent(Math.max(0, current - 1))}
              disabled={current === 0}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-purple-500 hover:bg-purple-600"
              onClick={() => setCurrent(Math.min(activeQuestions.length - 1, current + 1))}
              disabled={current === activeQuestions.length - 1}
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
