"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Check, Sparkles, MessageSquarePlus, Tag, Send } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ChatFeedbackProps {
  messageId: string;
  sessionId?: string;
  prompt: string;
  response: string;
  onFeedbackSubmitted?: (isPositive: boolean) => void;
}

const FEEDBACK_TAGS = [
  "Accurate & Clear",
  "Great Formatting",
  "Hallucination",
  "Missing Skills",
  "Too Verbose",
  "Tone Too Casual",
  "Outdated Tech",
  "Perfect Resume Tailoring",
];

export function ChatFeedback({
  messageId,
  sessionId,
  prompt,
  response,
  onFeedbackSubmitted,
}: ChatFeedbackProps) {
  const [feedbackState, setFeedbackState] = useState<"none" | "up" | "down">("none");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [correction, setCorrection] = useState("");
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleVote = async (isPositive: boolean) => {
    const newState = isPositive ? "up" : "down";
    setFeedbackState(newState);
    setRating(isPositive ? 5 : 1);
    setPopoverOpen(true);

    // Initial quick ping
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: `fb_${messageId}_${Date.now()}`,
          messageId,
          sessionId: sessionId || "default",
          prompt,
          response,
          rating: isPositive ? 5 : 1,
          isPositive,
          tags: isPositive ? ["Helpful"] : ["Needs Improvement"],
          timestamp: Date.now(),
        }),
      });
      onFeedbackSubmitted?.(isPositive);
    } catch {
      // Offline fallback
    }
  };

  const handleSubmitDetailed = async () => {
    setIsSubmitting(true);
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: `fb_${messageId}_${Date.now()}`,
          messageId,
          sessionId: sessionId || "default",
          prompt,
          response,
          rating,
          isPositive: feedbackState === "up",
          correction: correction.trim() || undefined,
          comments: comments.trim() || undefined,
          tags: selectedTags,
          timestamp: Date.now(),
        }),
      });
      setSubmitted(true);
      setTimeout(() => {
        setPopoverOpen(false);
        setSubmitted(false);
      }, 1200);
    } catch (e) {
      console.warn("Failed to submit detailed feedback:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleVote(true)}
              aria-label="Helpful reply"
              className={`p-1 rounded-md text-xs transition-colors hover:bg-muted ${
                feedbackState === "up"
                  ? "text-emerald-500 bg-emerald-500/10 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => handleVote(false)}
              aria-label="Unhelpful reply"
              className={`p-1 rounded-md text-xs transition-colors hover:bg-muted ${
                feedbackState === "down"
                  ? "text-rose-500 bg-rose-500/10 font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          className="w-80 p-4 bg-background/95 backdrop-blur-xl border-border/80 shadow-2xl rounded-xl space-y-3 z-50 text-xs"
        >
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Model Training Feedback (RLHF)</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                feedbackState === "up"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}
            >
              {feedbackState === "up" ? "Positive Example" : "Negative / Correction"}
            </span>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Tag className="w-3 h-3" /> Select feedback tags:
            </span>
            <div className="flex flex-wrap gap-1">
              {FEEDBACK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 text-primary font-medium"
                        : "bg-muted/40 border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ideal / Corrected Answer (DPO Dataset generation) */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <MessageSquarePlus className="w-3 h-3" /> Ideal / Corrected Answer (Optional):
            </span>
            <Textarea
              placeholder="What should the model have generated instead? (Used to fine-tune future responses)"
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              className="text-xs min-h-[60px] resize-none bg-muted/20"
            />
          </div>

          {/* Comments */}
          <div className="space-y-1">
            <Textarea
              placeholder="Additional feedback comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="text-xs min-h-[45px] resize-none bg-muted/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setPopoverOpen(false)}
              className="h-7 text-xs px-2.5"
            >
              Close
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitDetailed}
              disabled={isSubmitting}
              className="h-7 text-xs px-3 bg-primary font-semibold shadow-xs"
            >
              {submitted ? (
                <span className="flex items-center gap-1 text-emerald-200">
                  <Check className="w-3.5 h-3.5" /> Saved for Training
                </span>
              ) : isSubmitting ? (
                "Saving..."
              ) : (
                <span className="flex items-center gap-1">
                  <Send className="w-3 h-3" /> Submit RLHF
                </span>
              )}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
