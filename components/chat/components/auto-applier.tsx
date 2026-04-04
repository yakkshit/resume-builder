"use client";

import { useState, useEffect } from "react";
import { Play, Pause, CheckCircle2, XCircle, Loader2, Clock, Globe } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { ChatArtifactWindow } from "@/components/chat/chat-artifact-chrome";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

type StepStatus = "pending" | "running" | "done" | "failed";

interface Step {
  label: string;
  description: string;
  status: StepStatus;
  duration: number;
}

const INITIAL_STEPS: Step[] = [
  { label: "Searching open positions", description: "Scanning LinkedIn, Indeed, Glassdoor…", status: "pending", duration: 1800 },
  { label: "Analyzing job requirements", description: "Matching your profile to role requirements", status: "pending", duration: 1400 },
  { label: "Tailoring your resume", description: "Adjusting keywords for ATS compatibility", status: "pending", duration: 2000 },
  { label: "Filling application form", description: "Entering your personal information", status: "pending", duration: 2200 },
  { label: "Uploading documents", description: "Attaching resume and cover letter", status: "pending", duration: 1200 },
  { label: "Submitting application", description: "Finalising and submitting…", status: "pending", duration: 1000 },
];

export function AutoApplier() {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);

  const completedCount = steps.filter((s) => s.status === "done").length;
  const progress = (completedCount / steps.length) * 100;

  useEffect(() => {
    if (!running) return;
    if (currentStep >= steps.length) { setRunning(false); return; }

    // Mark current as running
    setSteps((prev) =>
      prev.map((s, i) => (i === currentStep ? { ...s, status: "running" } : s))
    );

    const timer = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => (i === currentStep ? { ...s, status: "done" } : s))
      );
      setCurrentStep((n) => n + 1);
    }, steps[currentStep]?.duration ?? 1500);

    return () => clearTimeout(timer);
  }, [running, currentStep, steps]);

  const handleStart = () => {
    setSteps(INITIAL_STEPS);
    setCurrentStep(0);
    setRunning(true);
  };

  const isFinished = completedCount === steps.length;

  return (
    <ChatArtifactWindow
      variant="light"
      cardClassName="w-full border-border/60 shadow-sm"
      headerClassName="border-b border-border/50 pb-3 !flex-row !items-center"
      contentClassName="space-y-4 pt-4"
      title={
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Play className="w-4 h-4 text-emerald-500" />
          Auto Job Applier
        </CardTitle>
      }
    >
        {/* Mini browser simulation */}
        <div className="rounded-xl overflow-hidden border border-border/60">
          <div className="flex items-center gap-2 bg-muted/60 px-3 py-2 border-b border-border/40">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
            <div className="flex-1 bg-background/50 rounded px-3 py-0.5 text-[10px] text-muted-foreground flex items-center gap-1.5">
              <Globe className="w-3 h-3" />
              {currentStep >= 0 ? "https://careers.techcorp.com/apply/senior-developer" : "about:blank"}
            </div>
          </div>
          <div className="bg-background p-4 min-h-[80px] space-y-2">
            {running && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="h-2 bg-indigo-500/20 rounded animate-pulse w-1/3" />
                <div className="h-7 bg-muted rounded" />
                <div className="h-7 bg-muted rounded" />
                <div className="h-4 bg-indigo-500/10 rounded animate-pulse w-1/2 mt-2" />
              </motion.div>
            )}
            {isFinished && (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Application submitted successfully!</span>
              </div>
            )}
            {!running && !isFinished && (
              <p className="text-xs text-muted-foreground">Click Start to begin automated application</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedCount}/{steps.length} steps</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step list */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="flex-shrink-0 mt-0.5">
                {step.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {step.status === "running" && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />}
                {step.status === "failed" && <XCircle className="w-4 h-4 text-rose-500" />}
                {step.status === "pending" && <Clock className="w-4 h-4 text-muted-foreground/40" />}
              </div>
              <div>
                <p className={`text-xs font-medium ${step.status === "pending" ? "text-muted-foreground/50" : ""}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!running && (
            <Button
              className="flex-1 h-8 text-xs bg-emerald-500 hover:bg-emerald-600"
              onClick={handleStart}
              disabled={running}
            >
              <Play className="w-3 h-3 mr-1.5" />
              {isFinished ? "Apply Again" : "Start Auto-Apply"}
            </Button>
          )}
          {running && (
            <Button
              variant="outline"
              className="flex-1 h-8 text-xs border-rose-500/40 text-rose-500 hover:bg-rose-500/10"
              onClick={() => setRunning(false)}
            >
              <Pause className="w-3 h-3 mr-1.5" /> Stop
            </Button>
          )}
        </div>
    </ChatArtifactWindow>
  );
}
