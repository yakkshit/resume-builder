"use client";

import { Sparkles, ChevronRight, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CVScoreData {
  score?: number;
  jobMatch?: number;
  strengths?: string[];
  improvements?: string[];
}

export function CVScore({ data = {} }: { data?: CVScoreData }) {
  const score = data.score ?? 85;
  const match = data.jobMatch ?? 78;
  const strengths = data.strengths ?? [
    "Strong technical skills section",
    "Quantified achievements",
    "Relevant work experience",
  ];
  const improvements = data.improvements ?? [
    "Add more quantifiable metrics",
    "Include certifications",
    "Expand summary section",
  ];

  const getColor = (v: number) =>
    v >= 80 ? "text-emerald-500" : v >= 60 ? "text-amber-500" : "text-rose-500";

  return (
    <Card className="w-full border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          CV Score Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-center">
            <p className={`text-2xl font-bold ${getColor(score)}`}>{score}%</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3" /> CV Score
            </p>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-center">
            <p className={`text-2xl font-bold ${getColor(match)}`}>{match}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">Job Match</p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Overall CV Score</span>
              <span className="font-medium">{score}%</span>
            </div>
            <Progress value={score} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Job Description Match</span>
              <span className="font-medium">{match}%</span>
            </div>
            <Progress value={match} className="h-1.5" />
          </div>
        </div>

        {/* Strengths */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Strengths
          </p>
          <div className="space-y-1">
            {strengths.map((s) => (
              <div key={s} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-1 h-1 rounded-full bg-emerald-500 flex-shrink-0" />
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Improvements */}
        <div>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> To Improve
          </p>
          <div className="space-y-1">
            {improvements.map((r) => (
              <div key={r} className="flex items-center gap-2 text-xs text-muted-foreground">
                <ChevronRight className="w-3 h-3 text-amber-500 flex-shrink-0" />
                {r}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
