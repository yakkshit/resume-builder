"use client";

import type { ComponentType, SVGProps } from "react";
import {
  Anthropic,
  DeepSeek,
  Gemini,
  Google,
  Groq,
  HuggingFace,
  Mistral,
  OpenAI,
} from "@lobehub/icons";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function wrap(
  Icon: ComponentType<IconProps>,
  size: number,
  className?: string,
) {
  return <Icon size={size} className={className} />;
}

/** Provider label from chat-store `AVAILABLE_MODELS[].provider` → LobeHub brand icon. */
export function ModelProviderIcon({
  provider,
  className,
  size = 16,
}: {
  provider: string;
  className?: string;
  size?: number;
}) {
  const p = provider.toLowerCase();
  if (p.includes("hugging")) return wrap(HuggingFace, size, className);
  if (p.includes("openai compatible")) return wrap(OpenAI, size, className);
  if (p.includes("openai")) return wrap(OpenAI, size, className);
  if (p.includes("anthropic") || p.includes("claude")) return wrap(Anthropic, size, className);
  if (p.includes("google") || p.includes("gemini")) return wrap(Gemini, size, className);
  if (p.includes("deepseek")) return wrap(DeepSeek, size, className);
  if (p.includes("groq")) return wrap(Groq, size, className);
  if (p.includes("mistral")) return wrap(Mistral, size, className);
  if (p.includes("cedz") || p.includes("lingo")) return wrap(Google, size, className);
  if (p.includes("local") || p.includes("custom")) return wrap(Google, size, className);
  return wrap(Google, size, className);
}
