"use client";

import { useState } from "react";
import { Code, Play, CheckCircle2, RotateCcw, Clock } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { ChatArtifactWindow } from "@/components/chat/chat-artifact-chrome";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getVercelOidcToken } from "@/lib/session-secrets";

const STARTER_CODE: Record<string, string> = {
  typescript: `function twoSum(nums: number[], target: number): number[] {
  // Your solution here
  
}`,
  javascript: `function twoSum(nums, target) {
  // Your solution here
  
}`,
  python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # Your solution here
    pass`,
  java: `class Solution {
  public int[] twoSum(int[] nums, int target) {
    return new int[]{0, 1};
  }
}`,
  cpp: `#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
  return {0, 1};
}`,
  go: `package main

func twoSum(nums []int, target int) []int {
  return []int{0, 1}
}`,
  rust: `fn two_sum(nums: Vec<i32>, target: i32) -> Vec<usize> {
    vec![0, 1]
}`,
};

export interface CodingChallengeProps {
  data?: {
    codingProblems?: string[];
  };
}

export function CodingChallenge({ data }: CodingChallengeProps) {
  const problemTitle = "Two Sum";
  // The first problem from data, or fallback instructions if none
  const problemDesc = data?.codingProblems?.[0] || 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.';
  const hasCustomDesc = !!data?.codingProblems?.[0];

  const [lang, setLang] = useState<"typescript" | "javascript" | "python" | "java" | "cpp" | "go" | "rust">("typescript");
  const [code, setCode] = useState(STARTER_CODE.typescript);
  const [status, setStatus] = useState<null | "running" | "pass" | "fail">(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<string | null>(null);
  const [execMode, setExecMode] = useState<"vercel-sandbox" | "local-vm" | null>(null);
  const [execMs, setExecMs] = useState<number | null>(null);

  const handleRun = async () => {
    setRunError(null);
    setRunDetails(null);
    setStatus("running");
    setExecMode(null);
    setExecMs(null);
    try {
      const token = getVercelOidcToken().trim();
      const startedAt = performance.now();

      // Prefer sandbox for TS/JS/Python when token exists.
      if (token && (lang === "typescript" || lang === "javascript" || lang === "python")) {
        const res = await fetch("/api/interview-lab/sandbox-run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oidcToken: token, language: lang, code }),
        });
        const j = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          passed?: boolean;
          output?: string;
          error?: string;
          hint?: string;
          ms?: number;
        };
        setExecMode("vercel-sandbox");
        setExecMs(typeof j.ms === "number" ? Math.round(j.ms) : Math.round(performance.now() - startedAt));

        if (res.ok && j.ok) {
          const passed = Boolean(j.passed);
          setStatus(passed ? "pass" : "fail");
          if (!passed && j.error) setRunError(j.error);
          if (j.output?.trim()) setRunDetails(j.output.trim());
          return;
        }
        // fall back
        setRunError(j.hint || j.error || "Sandbox run failed; falling back to local VM.");
      }

      const res = await fetch("/api/code-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, code }),
      });
      const data = (await res.json().catch(() => null)) as unknown;
      setExecMode("local-vm");
      setExecMs(Math.round(performance.now() - startedAt));

      if (!res.ok) {
        const err = (data as { error?: unknown } | null)?.error;
        setStatus("fail");
        setRunError(typeof err === "string" ? err : `Run failed (${res.status})`);
        return;
      }

      const passed = Boolean((data as { passed?: unknown } | null)?.passed);
      setStatus(passed ? "pass" : "fail");
      const error = (data as { error?: unknown } | null)?.error;
      if (typeof error === "string") setRunError(error);

      const stdout = (data as { stdout?: unknown } | null)?.stdout;
      const stderr = (data as { stderr?: unknown } | null)?.stderr;
      if (typeof stdout === "string" && stdout.trim()) setRunDetails(stdout.trim());
      if (typeof stderr === "string" && stderr.trim()) setRunDetails(stderr.trim());

      const feedback = (data as { feedback?: unknown } | null)?.feedback;
      if (feedback && typeof feedback === "object") {
        const fb = feedback as { summary?: unknown; strengths?: unknown; improvements?: unknown; suggestedNextStep?: unknown };
        const lines = [
          typeof fb.summary === "string" && fb.summary ? `Summary: ${fb.summary}` : "",
          Array.isArray(fb.strengths) && fb.strengths.length ? `Strengths:\n- ${fb.strengths.join("\n- ")}` : "",
          Array.isArray(fb.improvements) && fb.improvements.length ? `Improvements:\n- ${fb.improvements.join("\n- ")}` : "",
          typeof fb.suggestedNextStep === "string" && fb.suggestedNextStep ? `Next step: ${fb.suggestedNextStep}` : "",
        ].filter(Boolean);
        if (lines.length) setRunDetails(lines.join("\n\n"));
      }
    } catch (e) {
      setStatus("fail");
      setRunError(e instanceof Error ? e.message : "Run failed");
    }
  };

  return (
    <ChatArtifactWindow
      variant="light"
      cardClassName="w-full border-border/60 shadow-sm"
      headerClassName="border-b border-border/50 pb-3 !flex-row !items-center"
      contentClassName="space-y-4 pt-4"
      title={
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Code className="w-4 h-4 text-orange-500" />
          Coding Challenge
        </CardTitle>
      }
    >
        {/* Problem header */}
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm mb-1.5">{hasCustomDesc ? "AI Selected Problem" : problemTitle}</h4>
            <div className="flex gap-1.5">
              <Badge className="text-[10px] bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">Easy</Badge>
              {!hasCustomDesc && (
                <>
                  <Badge variant="secondary" className="text-[10px]">Array</Badge>
                  <Badge variant="secondary" className="text-[10px]">Hash Map</Badge>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {hasCustomDesc ? "30 min" : "45 min"}
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div className="text-xs text-muted-foreground space-y-2">
          <p>{problemDesc}</p>
          {!hasCustomDesc && (
            <div className="bg-muted/50 rounded-lg p-3 font-mono text-[10px] leading-relaxed">
              Input: nums = [2,7,11,15], target = 9<br />
              Output: [0,1]<br />
              Explanation: nums[0] + nums[1] = 9
            </div>
          )}
        </div>

        <Separator />

        {/* Code editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Solution</Label>
            <Select
              value={lang}
              onValueChange={(v) => {
                setLang(v as any);
                setCode((STARTER_CODE as any)[v] ?? "");
              }}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript" className="text-xs">TypeScript</SelectItem>
                <SelectItem value="javascript" className="text-xs">JavaScript</SelectItem>
                <SelectItem value="python" className="text-xs">Python</SelectItem>
                <SelectItem value="java" className="text-xs">Java</SelectItem>
                <SelectItem value="cpp" className="text-xs">C++</SelectItem>
                <SelectItem value="go" className="text-xs">Go</SelectItem>
                <SelectItem value="rust" className="text-xs">Rust</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-xl overflow-hidden border border-border/60 bg-neutral-950">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="font-mono text-xs min-h-[140px] bg-transparent border-0 text-neutral-100 focus-visible:ring-0 resize-none p-4"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Status */}
        {status === "pass" && (
          <div className="flex items-center gap-2 text-emerald-600 text-xs">
            <CheckCircle2 className="w-4 h-4" /> All test cases passed! 🎉
          </div>
        )}
        {status === "running" && (
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            Running tests…
          </div>
        )}
        {execMode ? (
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <Badge variant="secondary" className="h-5 rounded-md text-[10px]">
              {execMode === "vercel-sandbox" ? "Vercel Sandbox" : "Local VM"}
            </Badge>
            {typeof execMs === "number" ? <span>{execMs}ms</span> : null}
          </div>
        ) : null}
        {status === "fail" && (
          <div className="text-rose-400 text-xs">
            {runError ? runError : "Some tests failed."}
          </div>
        )}
        {runDetails && status !== "running" && (
          <div className="rounded-lg border border-border/60 bg-neutral-950 p-3 text-[11px] text-muted-foreground font-mono whitespace-pre-wrap max-h-40 overflow-auto">
            {runDetails}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex-1"
            onClick={() => {
              setRunError(null);
              setRunDetails(null);
              setCode((STARTER_CODE as any)[lang] ?? "");
              setStatus(null);
            }}
          >
            <RotateCcw className="w-3 h-3 mr-1.5" /> Reset
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs flex-1 bg-orange-500 hover:bg-orange-600"
            onClick={handleRun}
            disabled={status === "running"}
          >
            <Play className="w-3 h-3 mr-1.5" />
            {status === "running" ? "Running…" : "Run Tests"}
          </Button>
        </div>
    </ChatArtifactWindow>
  );
}
