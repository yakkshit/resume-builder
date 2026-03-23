"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Code2, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface MockInterviewInteractiveProps {
  questions?: string[];
  codingProblems?: string[];
  role?: string;
}

export function MockInterviewInteractive({
  questions = [],
  codingProblems = [],
  role = "",
}: MockInterviewInteractiveProps) {
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [expandedC, setExpandedC] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [codeSolutions, setCodeSolutions] = useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = useState("behavioral");

  const qList = Array.isArray(questions) ? questions : [];
  const pList = Array.isArray(codingProblems) ? codingProblems : [];

  return (
    <Card className="border border-white/10 bg-[#1a1a1e]/80 overflow-hidden">
      <CardHeader className="py-3 border-b border-white/5">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#1172e2]" />
          Mock Interview {role && `— ${role}`}
          <Badge variant="outline" className="ml-auto text-[10px] border-[#1172e2]/30 text-[#1172e2]">
            Interactive
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="w-full rounded-none border-b border-white/5 bg-transparent h-12 gap-0 p-0">
            <TabsTrigger
              value="behavioral"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1172e2] data-[state=active]:bg-white/5"
            >
              <MessageSquare className="h-3.5 w-3.5 mr-2" />
              Behavioral ({qList.length})
            </TabsTrigger>
            <TabsTrigger
              value="coding"
              className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1172e2] data-[state=active]:bg-white/5"
            >
              <Code2 className="h-3.5 w-3.5 mr-2" />
              Coding ({pList.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="behavioral" className="m-0 p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {qList.length === 0 ? (
              <p className="text-sm text-[#8a8a8f] py-4 text-center">No questions yet</p>
            ) : (
              qList.map((q, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/5 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-medium text-white pr-2">
                      {typeof q === "string" ? q : JSON.stringify(q)}
                    </span>
                    {expandedQ === i ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[#8a8a8f]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#8a8a8f]" />
                    )}
                  </button>
                  {expandedQ === i && (
                    <div className="px-3 pb-3 border-t border-white/5">
                      <Textarea
                        placeholder="Type your answer here..."
                        value={answers[`q-${i}`] ?? ""}
                        onChange={(e) =>
                          setAnswers((prev) => ({ ...prev, [`q-${i}`]: e.target.value }))
                        }
                        className="mt-3 min-h-[80px] bg-[#0f0f0f] border-white/10 text-white text-sm"
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="coding" className="m-0 p-3 space-y-2 max-h-[400px] overflow-y-auto">
            {pList.length === 0 ? (
              <p className="text-sm text-[#8a8a8f] py-4 text-center">No coding problems yet</p>
            ) : (
              pList.map((p, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/5 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedC(expandedC === i ? null : i)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-medium text-white pr-2 flex items-center gap-2">
                      <Code2 className="h-3.5 w-3.5 text-[#1172e2] shrink-0" />
                      {typeof p === "string" ? p : JSON.stringify(p)}
                    </span>
                    {expandedC === i ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-[#8a8a8f]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#8a8a8f]" />
                    )}
                  </button>
                  {expandedC === i && (
                    <div className="px-3 pb-3 border-t border-white/5">
                      <div className="mt-3 rounded-lg bg-[#0f0f0f] border border-white/5 p-2">
                        <pre className="text-xs text-[#8a8a8f] font-mono mb-2 overflow-x-auto">
                          {typeof p === "string" ? p : JSON.stringify(p)}
                        </pre>
                        <Textarea
                          placeholder="Write your solution..."
                          value={codeSolutions[`c-${i}`] ?? ""}
                          onChange={(e) =>
                            setCodeSolutions((prev) => ({ ...prev, [`c-${i}`]: e.target.value }))
                          }
                          className="min-h-[120px] bg-[#0a0a0c] border-white/5 text-green-400 font-mono text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
