"use client";

import { Zap, Sparkles, Brain } from "lucide-react";
import type { BoltModel } from "@/components/ui/bolt-style-chat";

export const BOLT_MODELS: BoltModel[] = [
  {
    id: "gemini-3.7-flash",
    name: "Gemini 3.7 Flash",
    description: "Hybrid reasoning & speed",
    icon: <Sparkles className="size-4 text-emerald-400" />,
    badge: "Next Gen",
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast & intelligent",
    icon: <Zap className="size-4 text-blue-400" />,
    badge: "Default",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Most capable",
    icon: <Sparkles className="size-4 text-purple-400" />,
    badge: "Pro",
  },
  {
    id: "claude-3-7-sonnet",
    name: "Claude 3.7 Sonnet",
    description: "Hybrid reasoning",
    icon: <Sparkles className="size-4 text-amber-400" />,
    badge: "Hybrid",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI flagship",
    icon: <Brain className="size-4 text-green-400" />,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Fast & efficient",
    icon: <Zap className="size-4 text-emerald-400" />,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    description: "Anthropic flagship",
    icon: <Sparkles className="size-4 text-amber-400" />,
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    description: "Lightning fast",
    icon: <Zap className="size-4 text-cyan-400" />,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    description: "Cost-effective",
    icon: <Brain className="size-4 text-indigo-400" />,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B",
    description: "Groq fast inference",
    icon: <Zap className="size-4 text-orange-400" />,
  },
  {
    id: "cedz",
    name: "Cedz",
    description: "Self-hosted",
    icon: <Brain className="size-4 text-violet-400" />,
  },
  {
    id: "lingo-ai",
    name: "Lingo AI",
    description: "Resume specialist",
    icon: <Sparkles className="size-4 text-pink-400" />,
  },
];

export function getDefaultBoltModelId(): string {
  const first = BOLT_MODELS.find((m) => m.badge === "Default");
  return first?.id ?? BOLT_MODELS[0]?.id ?? "gemini-2.5-flash";
}
