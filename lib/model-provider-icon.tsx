"use client";

import React from "react";
import {
  Bot,
  Cpu,
  Globe2,
  Sparkles,
  Zap,
} from "lucide-react";

/** Clean SVG brand icons for AI providers */
function OpenAIIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 8.937a4.485 4.485 0 0 1 2.366-1.973V12.6a.766.766 0 0 0 .388.677l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 8.937zm16.597 3.855l-5.833-3.387L15.119 8.24a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.666zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 10.27V7.934a.08.08 0 0 1 .033-.061l4.839-2.795a4.504 4.504 0 0 1 6.666 4.636zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V7.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.612-1.5z" />
    </svg>
  );
}

function AnthropicIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13.827 3.5h3.696L24 20.5h-3.696l-1.547-3.618H11.24L9.693 20.5H6l7.827-17zm3.178 10.518l-1.89-4.42-1.89 4.42h3.78zM4.773 3.5H8.47L3.696 20.5H0L4.773 3.5z" />
    </svg>
  );
}

function GeminiIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.04 1.5c.34 3.78 2.68 6.12 6.46 6.46-3.78.34-6.12 2.68-6.46 6.46-.34-3.78-2.68-6.12-6.46-6.46 3.78-.34 6.12-2.68 6.46-6.46zm6.5 10c.23 2.54 1.8 4.11 4.34 4.34-2.54.23-4.11 1.8-4.34 4.34-.23-2.54-1.8-4.11-4.34-4.34 2.54-.23 4.11-1.8 4.34-4.34z" />
    </svg>
  );
}

function MetaIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 4.41 2.87 8.15 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.46-1.11-1.46-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48 3.97-1.34 6.83-5.08 6.83-9.49 0-5.5-4.46-9.96-9.96-9.96z" />
    </svg>
  );
}

function DeepSeekIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  );
}

function HuggingFaceIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-3.5-9a1.5 1.5 0 1 0-1.5-1.5A1.5 1.5 0 0 0 8.5 11zm7 0a1.5 1.5 0 1 0-1.5-1.5 1.5 1.5 0 0 0 1.5 1.5zm-3.5 5.5a4.5 4.5 0 0 0 3.8-2.1.75.75 0 0 0-1.28-.78 3 3 0 0 1-5.04 0 .75.75 0 0 0-1.28.78A4.5 4.5 0 0 0 12 16.5z" />
    </svg>
  );
}

/** Provider label from chat-store → compact brand pictogram. */
export function ModelProviderIcon({
  provider,
  className,
  size = 16,
}: {
  provider: string;
  className?: string;
  size?: number;
}) {
  const p = (provider || "").toLowerCase();

  if (p.includes("openai compatible")) return <Bot size={size} className={className} />;
  if (p.includes("openai")) return <OpenAIIcon size={size} className={className} />;
  if (p.includes("anthropic") || p.includes("claude")) return <AnthropicIcon size={size} className={className} />;
  if (p.includes("google") || p.includes("gemini")) return <GeminiIcon size={size} className={className} />;
  if (p.includes("meta") || p.includes("llama")) return <MetaIcon size={size} className={className} />;
  if (p.includes("deepseek")) return <DeepSeekIcon size={size} className={className} />;
  if (p.includes("groq")) return <Zap size={size} className={className} />;
  if (p.includes("mistral")) return <Sparkles size={size} className={className} />;
  if (p.includes("hugging")) return <HuggingFaceIcon size={size} className={className} />;
  if (p.includes("cedz") || p.includes("lingo")) return <Globe2 size={size} className={className} />;
  if (p.includes("local") || p.includes("custom")) return <Cpu size={size} className={className} />;
  return <Globe2 size={size} className={className} />;
}
