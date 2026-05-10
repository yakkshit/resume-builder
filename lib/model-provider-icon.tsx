"use client";

import {
  Anthropic as AnthropicIcon,
  DeepSeek as DeepSeekIcon,
  Gemini as GeminiIcon,
  Google as GoogleIcon,
  Groq as GroqIcon,
  HuggingFace as HuggingFaceIcon,
  Mistral as MistralIcon,
  OpenAI as OpenAIIcon,
  Meta as MetaIcon,
} from "@lobehub/icons";
import {
  Bot,
  Cpu,
  Globe2,
  HeartHandshake,
  Waves,
  Zap
} from "lucide-react";


type IconWrapProps = {
  Icon: any;
  size: number;
  className?: string | undefined;
};

function wrap({ Icon, size, className }: IconWrapProps) {
  return <Icon size={size} className={className} />;
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
  const p = provider.toLowerCase();

  if (p.includes("openai compatible")) return wrap({ Icon: Bot, size, className });
  if (p.includes("openai")) return wrap({ Icon: OpenAIIcon, size, className });
  if (p.includes("anthropic") || p.includes("claude")) return wrap({ Icon: AnthropicIcon, size, className });
  if (p.includes("google") || p.includes("gemini")) return wrap({ Icon: GeminiIcon, size, className });
  if (p.includes("meta") || p.includes("llama")) return wrap({ Icon: MetaIcon, size, className });
  if (p.includes("deepseek")) return wrap({ Icon: DeepSeekIcon, size, className });
  if (p.includes("groq")) return wrap({ Icon: GroqIcon, size, className });
  if (p.includes("mistral")) return wrap({ Icon: MistralIcon, size, className });
  if (p.includes("hugging")) return wrap({ Icon: HuggingFaceIcon, size, className });
  if (p.includes("cedz") || p.includes("lingo")) return wrap({ Icon: Globe2, size, className });
  if (p.includes("local") || p.includes("custom")) return wrap({ Icon: Cpu, size, className });
  return wrap({ Icon: Globe2, size, className });
}
