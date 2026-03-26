"use client";

import { useState } from "react";
import { Code, Play, CheckCircle2, RotateCcw, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

  const [lang, setLang] = useState("typescript");
  const [code, setCode] = useState(STARTER_CODE.typescript);
  const [status, setStatus] = useState<null | "running" | "pass" | "fail">(null);

  const handleRun = () => {
    setStatus("running");
    setTimeout(() => setStatus("pass"), 1800);
  };

  return (
    <Card className="w-full border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Code className="w-4 h-4 text-orange-500" />
          Coding Challenge
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Select value={lang} onValueChange={(v) => { setLang(v); setCode(STARTER_CODE[v] ?? ""); }}>
              <SelectTrigger className="h-7 w-[130px] text-xs border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="typescript" className="text-xs">TypeScript</SelectItem>
                <SelectItem value="javascript" className="text-xs">JavaScript</SelectItem>
                <SelectItem value="python" className="text-xs">Python</SelectItem>
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

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs flex-1"
            onClick={() => { setCode(STARTER_CODE[lang] ?? ""); setStatus(null); }}
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
      </CardContent>
    </Card>
  );
}
