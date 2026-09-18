import { GoogleGenerativeAI } from "@google/generative-ai"
import { InferenceClient } from "@huggingface/inference"
import { GoogleGenAI } from "@google/genai"
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from 'ai'
import mime from "mime"
import type { NextRequest } from "next/server"
import { DEFAULT_CHAT_MODEL } from "@/lib/chat-models"

/** Extract text from message (supports v4 content and v5 parts) */
const getMsgText = (m: { content?: string; parts?: Array<{ type: string; text?: string }> }) =>
  m.parts?.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("") ?? m.content ?? ""

const MAX_CONTEXT_TEXT_CHARS = 12_000
const MAX_MEMORY_CONTEXT_CHARS = 10_000
const MAX_RETRIEVAL_CONTEXT_CHARS = 12_000
const MAX_PROFILE_JSON_CHARS = 16_000

function clipForPrompt(value: string | undefined, maxChars: number): string {
  const text = (value ?? "").trim()
  if (!text) return ""
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n…[truncated]` : text
}

/** Helper: stream text chunks to AI SDK v5 UIMessage format. Pass originalMessages so useChat can display the response. */
function streamTextToResponse(
  produce: (write: (text: string) => void) => Promise<void>,
  originalMessages?: unknown[],
): Response {
  const textId = generateId()
  const stream = createUIMessageStream({
    originalMessages: (originalMessages ?? []) as Parameters<typeof createUIMessageStream>[0]["originalMessages"],
    execute: async ({ writer }) => {
      writer.write({ type: "text-start", id: textId })
      await produce((text) => { if (text) writer.write({ type: "text-delta", id: textId, delta: text }) })
      writer.write({ type: "text-end", id: textId })
    },
  })
  return createUIMessageStreamResponse({ stream })
}

import { writeFile } from "fs"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Define available models with their providers and configurations (aligned with UI selector)
const AVAILABLE_MODELS: Record<string, { provider: string; modelId: string; apiKey?: string }> = {
  // Specialized
  "lingo-ai": { provider: "lingo-ai", modelId: "resume-model-v1" },

  // Google Gemini — core chat / multimodal models
  "gemini-3.8-flash": { provider: "google", modelId: "gemini-3.8-flash" },
  "gemini-3.7-flash": { provider: "google", modelId: "gemini-3.7-flash" },
  "gemini-3.7-pro": { provider: "google", modelId: "gemini-3.7-pro" },
  "gemini-3.1-pro-preview": { provider: "google", modelId: "gemini-3.1-pro-preview" },
  "gemini-3-pro-preview": { provider: "google", modelId: "gemini-3-pro-preview" },
  "gemini-3-flash-preview": { provider: "google", modelId: "gemini-3-flash-preview" },
  "gemini-3.1-flash-lite-preview": { provider: "google", modelId: "gemini-3.1-flash-lite-preview" },
  "gemini-3.1-flash-image-preview": { provider: "google", modelId: "gemini-3.1-flash-image-preview" },
  "gemini-3-pro-image-preview": { provider: "google", modelId: "gemini-3-pro-image-preview" },
  "gemini-2.5-flash": { provider: "google", modelId: "gemini-2.5-flash" },
  "gemini-2.5-flash-preview-09-2025": { provider: "google", modelId: "gemini-2.5-flash" },
  "gemini-2.5-flash-image": { provider: "google", modelId: "gemini-2.5-flash" },
  "gemini-2.5-flash-live": { provider: "google", modelId: "gemini-2.5-flash" },
  "gemini-2.5-flash-native-audio-preview-12-2025": { provider: "google", modelId: "gemini-2.5-flash" },
  "gemini-2.5-flash-native-audio-preview-09-2025": { provider: "google", modelId: "gemini-2.5-flash" },
  "gemini-2.5-flash-preview-tts": { provider: "google", modelId: "gemini-2.5-flash" },
  "gemini-2.5-flash-lite": { provider: "google", modelId: "gemini-2.5-flash-lite" },
  "gemini-2.5-flash-lite-preview-09-2025": { provider: "google", modelId: "gemini-2.5-flash-lite" },
  "gemini-2.5-pro": { provider: "google", modelId: "gemini-2.5-pro" },
  "gemini-2.5-pro-preview-tts": { provider: "google", modelId: "gemini-2.5-pro" },
  "gemini-2.0-flash-exp": { provider: "google", modelId: "gemini-2.0-flash-exp" },
  "gemini-2.0-flash": { provider: "google", modelId: "gemini-2.0-flash" },
  "gemini-2.0-flash-001": { provider: "google", modelId: "gemini-2.0-flash" },
  "gemini-2.0-flash-lite": { provider: "google", modelId: "gemini-2.0-flash-lite" },
  "gemini-2.0-flash-lite-001": { provider: "google", modelId: "gemini-2.0-flash-lite" },
  "gemini-2.0-pro": { provider: "google", modelId: "gemini-2.0-pro" },
  "gemini-1.5-pro": { provider: "google", modelId: "gemini-1.5-pro" },
  "gemini-1.5-flash": { provider: "google", modelId: "gemini-1.5-flash" },

  // OpenAI
  "gpt-6-astra": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.6": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.6-luna": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.6-sol": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.6-terra": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.5": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.4-mini": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.4-nano": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.2-pro": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.2": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.2-instant": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.1": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.1-codex": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.3-codex": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.3-codex-spark": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5-mini": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4.1": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4.1-mini": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4o": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4o-mini": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "o3-mini": { provider: "openai", modelId: "o3-mini", apiKey: process.env.OPENAI_API_KEY },
  "o1": { provider: "openai", modelId: "o1", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4-turbo": { provider: "openai", modelId: "gpt-4-turbo", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4": { provider: "openai", modelId: "gpt-4-turbo", apiKey: process.env.OPENAI_API_KEY },
  "gpt-3.5-turbo": { provider: "openai", modelId: "gpt-3.5-turbo", apiKey: process.env.OPENAI_API_KEY },

  // Anthropic Claude
  "claude-sonnet-5": { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-fable-5-1": { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-fable-5": { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-opus-4.8": { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-opus-4.7": { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-opus-4.6": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-opus-4.5": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-opus-4.1": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-sonnet-4.6": { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-sonnet-4.5": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-sonnet-4.0": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-haiku-4.5": { provider: "anthropic", modelId: "claude-3-5-haiku-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-7-sonnet": { provider: "anthropic", modelId: "claude-3-7-sonnet-20250219", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-5-sonnet": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-5-haiku": { provider: "anthropic", modelId: "claude-3-5-haiku-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-opus": { provider: "anthropic", modelId: "claude-3-opus-20240229", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-sonnet": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-haiku": { provider: "anthropic", modelId: "claude-3-5-haiku-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-2.1": { provider: "anthropic", modelId: "claude-2.1", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-2.0": { provider: "anthropic", modelId: "claude-2.0", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-instant-1.2": { provider: "anthropic", modelId: "claude-instant-1.2", apiKey: process.env.ANTHROPIC_API_KEY },

  // xAI Grok
  "grok-4.6": { provider: "xai", modelId: "grok-2-latest", apiKey: process.env.XAI_API_KEY },
  "grok-4.5": { provider: "xai", modelId: "grok-2-latest", apiKey: process.env.XAI_API_KEY },
  "grok-4-fast-reasoning": { provider: "xai", modelId: "grok-2-mini", apiKey: process.env.XAI_API_KEY },
  "grok-4": { provider: "xai", modelId: "grok-2-latest", apiKey: process.env.XAI_API_KEY },
  "grok-3": { provider: "xai", modelId: "grok-2-latest", apiKey: process.env.XAI_API_KEY },
  "grok-3-mini": { provider: "xai", modelId: "grok-2-mini", apiKey: process.env.XAI_API_KEY },

  // DeepSeek
  "deepseek-v4-flash-vision-exp": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-v4-flash": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-v4-pro": { provider: "deepseek", modelId: "deepseek-reasoner", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-chat": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-reasoner": { provider: "deepseek", modelId: "deepseek-reasoner", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-coder": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-coder-v2": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-coder-v2-lite": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },

  // Moonshot AI / Kimi
  "kimi-k3": { provider: "moonshotai", modelId: "moonshot-v1-32k", apiKey: process.env.MOONSHOT_API_KEY },
  "kimi-k2.7-code": { provider: "moonshotai", modelId: "moonshot-v1-32k", apiKey: process.env.MOONSHOT_API_KEY },
  "kimi-k2.6": { provider: "moonshotai", modelId: "moonshot-v1-8k", apiKey: process.env.MOONSHOT_API_KEY },

  // Groq
  "meta-llama/llama-4-scout-17b-16e-instruct": { provider: "groq", modelId: "llama-3.3-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "llama-3.1-8b-instant": { provider: "groq", modelId: "llama-3.1-8b-instant", apiKey: process.env.GROQ_API_KEY },
  "llama-3.1-70b-versatile": { provider: "groq", modelId: "llama-3.1-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "llama-3.3-70b-versatile": { provider: "groq", modelId: "llama-3.3-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "deepseek-r1-distill-llama-70b": { provider: "groq", modelId: "deepseek-r1-distill-llama-70b", apiKey: process.env.GROQ_API_KEY },
  "qwen-qwq-32b": { provider: "groq", modelId: "qwen-2.5-32b", apiKey: process.env.GROQ_API_KEY },
  "openai/gpt-oss-120b": { provider: "groq", modelId: "llama-3.3-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "gemma-4-31b": { provider: "groq", modelId: "gemma2-9b-it", apiKey: process.env.GROQ_API_KEY },
  "mixtral-8x7b-32768": { provider: "groq", modelId: "mixtral-8x7b-32768", apiKey: process.env.GROQ_API_KEY },
  "gemma2-9b-it": { provider: "groq", modelId: "gemma2-9b-it", apiKey: process.env.GROQ_API_KEY },
  "llama-3.1-8b": { provider: "groq", modelId: "llama-3.1-8b-instant", apiKey: process.env.GROQ_API_KEY },
  "llama-3.1-70b": { provider: "groq", modelId: "llama-3.1-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "llama-3.3-70b": { provider: "groq", modelId: "llama-3.3-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "llama3-70b-8192": { provider: "groq", modelId: "llama3-70b-8192", apiKey: process.env.GROQ_API_KEY },

  // Mistral (3.x + mini/magistral/devstral)
  "pixtral-large-latest": { provider: "mistral", modelId: "pixtral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-large-3": { provider: "mistral", modelId: "mistral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-medium-3.1": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-small-3.2": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-medium-3": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-small-3.1": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "ministral-3-14b": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "ministral-3-8b": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "ministral-3-3b": { provider: "mistral", modelId: "mistral-7b-instruct", apiKey: process.env.MISTRAL_API_KEY },
  "magistral-medium-2506": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "magistral-small-2506": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "magistral-medium-1.2": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "magistral-small-1.2": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "devstral-2": { provider: "mistral", modelId: "mistral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
  "devstral-medium-1.0": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "devstral-small-2": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-large-latest": { provider: "mistral", modelId: "mistral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-medium-latest": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-small-latest": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "ministral-8b-latest": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-7b-instruct": { provider: "mistral", modelId: "mistral-7b-instruct", apiKey: process.env.MISTRAL_API_KEY },

  // Together.ai
  "meta-llama/llama-3.1-8b-instruct": { provider: "together", modelId: "meta-llama/Llama-3.1-8B-Instruct-Turbo", apiKey: process.env.TOGETHER_API_KEY },
  "meta-llama/llama-3.1-70b-instruct": { provider: "together", modelId: "meta-llama/Llama-3.1-70B-Instruct-Turbo", apiKey: process.env.TOGETHER_API_KEY },
  "meta-llama/llama-3.3-70b-instruct": { provider: "together", modelId: "meta-llama/Llama-3.3-70B-Instruct-Turbo", apiKey: process.env.TOGETHER_API_KEY },

  // Cohere
  "command-a-03-2025": { provider: "cohere", modelId: "command-r-plus", apiKey: process.env.COHERE_API_KEY },
  "command-a-reasoning-08-2025": { provider: "cohere", modelId: "command-r-plus", apiKey: process.env.COHERE_API_KEY },
  "command-r-plus": { provider: "cohere", modelId: "command-r-plus", apiKey: process.env.COHERE_API_KEY },
  "command-r": { provider: "cohere", modelId: "command-r", apiKey: process.env.COHERE_API_KEY },
  "command-light": { provider: "cohere", modelId: "command-light", apiKey: process.env.COHERE_API_KEY },

  // Alibaba / DeepInfra
  "qwen3-max": { provider: "openai-like", modelId: "qwen-max", apiKey: process.env.DASHSCOPE_API_KEY },
  "qwen-plus": { provider: "openai-like", modelId: "qwen-plus", apiKey: process.env.DASHSCOPE_API_KEY },

  // Perplexity
  "llama-3.1-sonar-large-128k-online": { provider: "perplexity", modelId: "llama-3.1-sonar-large-128k-online", apiKey: process.env.PERPLEXITY_API_KEY },
  "llama-3.1-8b-instruct": { provider: "perplexity", modelId: "llama-3.1-sonar-small-128k-online", apiKey: process.env.PERPLEXITY_API_KEY },
  "llama-3.1-70b-instruct": { provider: "perplexity", modelId: "llama-3.1-sonar-large-128k-online", apiKey: process.env.PERPLEXITY_API_KEY },
  "mixtral-8x7b-instruct": { provider: "perplexity", modelId: "mixtral-8x7b-instruct", apiKey: process.env.PERPLEXITY_API_KEY },

  // Fireworks
  "fireworks-llama-3.1-8b-instruct": { provider: "fireworks", modelId: "accounts/fireworks/models/llama-v3p1-8b-instruct", apiKey: process.env.FIREWORKS_API_KEY },
  "fireworks-llama-3.1-70b-instruct": { provider: "fireworks", modelId: "accounts/fireworks/models/llama-v3p1-70b-instruct", apiKey: process.env.FIREWORKS_API_KEY },
  "fireworks-mixtral-8x7b-instruct": { provider: "fireworks", modelId: "accounts/fireworks/models/mixtral-8x7b-instruct", apiKey: process.env.FIREWORKS_API_KEY },

  // Hugging Face
  "huggingface-endpoint": { provider: "huggingface", modelId: "endpoint", apiKey: process.env.HUGGINGFACE_API_KEY },
  "huggingface-model": { provider: "huggingface", modelId: "model", apiKey: process.env.HUGGINGFACE_API_KEY },
  "huggingface-streaming": { provider: "huggingface", modelId: "streaming", apiKey: process.env.HUGGINGFACE_API_KEY },
  "huggingface-provider": { provider: "huggingface", modelId: "provider", apiKey: process.env.HUGGINGFACE_API_KEY },

  // FcukOff AI
  "cedz-hr-qwen": { provider: "fcukoffai", modelId: "cedz-hr-qwen", apiKey: process.env.CEDZ_LLM_API },

  // Local / Custom
  "local-custom": { provider: "local", modelId: "local-custom" },
  "ollama-local": { provider: "ollama", modelId: "ollama" },
  "lmstudio-local": { provider: "lmstudio", modelId: "lmstudio" },
  "openai-like-local": { provider: "openai-like", modelId: "openai-like" },
}

/** Cedz / Ollama-style UI models (not in AVAILABLE_MODELS). */
const CEDZ_UI_MODELS: Record<string, { provider: string; modelId: string; apiKey?: string }> = {
  "cedz-qwen3-8b": { provider: "cedz", modelId: "qwen3:8b" },
  "cedz-llama3-8b": { provider: "cedz", modelId: "llama3:8b" },
  "cedz-custom": { provider: "cedz", modelId: "custom" },
}

/**
 * Full routing table: all server-supported model ids + Cedz + career chat sidebar ids
 * (components/chat/chat-store.tsx) that are not spelled the same as AVAILABLE_MODELS keys.
 * Previously a short duplicate list omitted gemini-2.5-flash etc. → 400 Invalid model.
 */
const HF_STREAMING = { provider: "huggingface" as const, modelId: "streaming" as const, apiKey: process.env.HUGGINGFACE_API_KEY }
const AVAILABLE_MAP: Record<string, { provider: string; modelId: string; apiKey?: string }> = {
  ...AVAILABLE_MODELS,
  ...CEDZ_UI_MODELS,
  // Career chat: Hub-style ids → HF streaming (customModel carries hub id from client)
  "meta-llama/Llama-3.1-8B-Instruct": HF_STREAMING,
  "deepseek-ai/DeepSeek-V3-0324": HF_STREAMING,
  "Qwen/Qwen2.5-72B-Instruct": HF_STREAMING,
  "hf-custom-hub-aisdk": HF_STREAMING,
  "openai-compatible-aisdk": { provider: "openai-like", modelId: "openai-compatible", apiKey: undefined },
}

/** Same Hub id as chat-store / HF UI, different casing than Together.ai entry; map retired Gemini slugs to 2.5 flash */
const MODEL_ID_ALIASES: Record<string, string> = {
  "meta-llama/llama-3.1-8b-instruct": "meta-llama/Llama-3.1-8B-Instruct",
  "gemini-1.5-pro": "gemini-2.5-flash",
  "gemini-1.5-flash": "gemini-2.5-flash",
  "gemini-2.0-flash": "gemini-2.5-flash",
  "gemini-2.0-flash-001": "gemini-2.5-flash",
  "gemini-2.0-flash-exp": "gemini-2.5-flash",
  "gemini-2.0-pro": "gemini-2.5-flash",
  "gemini-2.0-pro-exp-02-05": "gemini-2.5-flash",
  "gemini-2.0-flash-lite-001": "gemini-2.5-flash-lite",
  "gemini-2.5-flash-preview-09-2025": "gemini-2.5-flash",
  "gemini-2.5-flash-lite-preview-09-2025": "gemini-2.5-flash-lite",
}

// Default model if none specified (efficient for resume/cover letter)
const DEFAULT_MODEL = DEFAULT_CHAT_MODEL

function resolveModelRouting(model: unknown): { id: string; config: { provider: string; modelId: string; apiKey?: string } } {
  const fallback = AVAILABLE_MAP[DEFAULT_MODEL] ? DEFAULT_MODEL : "gemini-2.5-flash"
  const raw = typeof model === "string" ? model.trim() : ""
  const tryDirect = (id: string) => {
    const c = AVAILABLE_MAP[id]
    return c ? { id, config: c } : null
  }
  if (raw) {
    const direct = tryDirect(raw) ?? tryDirect(MODEL_ID_ALIASES[raw] ?? MODEL_ID_ALIASES[raw.toLowerCase()] ?? "")
    if (direct) return direct
    const lower = raw.toLowerCase()
    for (const key of Object.keys(AVAILABLE_MAP)) {
      if (key.toLowerCase() === lower) return { id: key, config: AVAILABLE_MAP[key] }
    }
  }
  return { id: fallback, config: AVAILABLE_MAP[fallback] }
}

// Mock response for when API quota is exceeded
const MOCK_RESPONSES = [
  "I'm sorry, but I can't process your request right now due to API quota limitations. Here are some general resume tips:\n\n1. Tailor your resume to each job application\n2. Use action verbs and quantify achievements\n3. Keep it concise and focused on relevant experience\n4. Proofread carefully for errors\n5. Include keywords from the job description",
  "Due to high demand, I can't access the AI service right now. Consider these resume improvements:\n\n- Make your summary more impactful by focusing on your unique value proposition\n- Ensure your skills section highlights both technical and soft skills relevant to the position\n- For each work experience, focus on achievements rather than just responsibilities",
  "API quota exceeded. While I can't analyze your specific resume right now, here are universal resume tips:\n\n- Use a clean, professional layout with consistent formatting\n- Place the most relevant information at the top\n- Use bullet points for better readability\n- Include metrics and specific results when possible\n- Remove outdated or irrelevant information",
]

// Update the POST function to handle attachedData (no app-level API key required; users provide provider keys in UI)
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON", message: "Request body must be valid JSON." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const {
    messages,
    resumeData,
    resumeLatex,
    coverLetterLatex,
    aiMode,
    model,
    apiKey,
    attachedData,
    attachedFiles,
    contextText,
    customModel,
    customEndpoint,
    customHeaders,
    customAuth,
    chatGlobalProfile,
    memoryContext,
    retrievalContext,
    preferredLanguage,
  } = body as {
    messages?: any[]
    resumeData?: any
    resumeLatex?: string
    coverLetterLatex?: string
    aiMode?: boolean | string
    model?: string
    apiKey?: string
    attachedData?: any
    attachedFiles?: any[]
    contextText?: string
    customModel?: string
    customEndpoint?: string
    customHeaders?: string
    customAuth?: string
    chatGlobalProfile?: Record<string, unknown> | null
    memoryContext?: string
    retrievalContext?: string
    preferredLanguage?: string
  }

  // If using a model with a small 4096 token limit, compress the context sizes
  const isSmallContext = model === "cedz-hr-qwen"

  const MAX_CONTEXT_TEXT_CHARS = isSmallContext ? 1500 : 12_000
  const MAX_MEMORY_CONTEXT_CHARS = isSmallContext ? 1500 : 10_000
  const MAX_RETRIEVAL_CONTEXT_CHARS = isSmallContext ? 1500 : 12_000
  const MAX_PROFILE_JSON_CHARS = isSmallContext ? 3000 : 16_000

  // Create a system message based on the mode
  let systemMessage = "";

  const resumeJson = JSON.stringify(resumeData ?? {})

  if (aiMode) {
    systemMessage = `You are an AI Resume Assistant. The user will give you their resume data and often a job description or request (e.g. "tailor my resume to this job", "update my summary").

Your response must follow this structure every time you suggest resume changes:
1. Write a short human-readable explanation (1–3 sentences) before or after the code block.
2. Include exactly one JSON code block with ONLY the resume fields you are changing. Use this format with no trailing commas or comments:

\`\`\`json
{
  "basicInfo": { "summary": "..." },
  "skills": ["skill1", "skill2"],
  "experience": [{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "...", "highlights": [] }],
  "education": [{ "institution": "...", "degree": "...", "field": "...", "startDate": "...", "endDate": "...", "gpa": "..." }],
  "projects": [{ "name": "...", "description": "...", "technologies": [] }],
  "achievements": [{ "title": "...", "description": "...", "date": "..." }]
}

Rules:
- Output ONLY the keys and values you are modifying. Omit any section you are not changing.
- Never include "profilePicture" in the JSON.
- For partial updates (e.g. only summary), output only: \`\`\`json\n{"basicInfo":{"summary":"Your new summary text."}}\n\`\`\`
- Keep JSON valid: no trailing commas, no comments, use double quotes for strings.
- For "update my summary" or similar: return \`\`\`json\n{"basicInfo":{"summary":"<improved summary>"}}\n\`\`\` and a brief explanation.
- If user asks to create/build/tailor a resume for a job description, you MUST include \`\`\`component:cv ...\`\`\` with resumeData so the app can render the resume tool and PDF preview immediately.

Provided resume data (for context; suggest only changes): ${resumeJson}`
  } else {
    systemMessage = `You are an AI Resume Assistant. The user will ask questions about their resume or ask for improvements.

When you suggest specific text or structure changes, you MUST include exactly one JSON code block with only the fields you are changing, in this format:

\`\`\`json
{"basicInfo":{"summary":"..."},"skills":[],"experience":[],"education":[],"projects":[],"achievements":[]}
\`\`\`

- Include only keys you are modifying. Never include profilePicture.
- Write a short explanation outside the JSON block.
- Keep JSON valid (no trailing commas, double quotes only).
- while writing descriptions make sure there is no **bold** or ## heading or any other markdown formatting. just write the plain text.

Resume data: ${resumeJson}`
  }

  systemMessage += `\n\nImportant: The resume JSON in this system message is the user’s latest snapshot for this request (their saved editor state plus structured resume content from this chat thread). Treat it as the source of truth when suggesting edits unless they paste new material.

Structured UI (use when appropriate; always close fenced blocks with \`\`\`):
- Interactive resume card — use **flat** \`resumeData\` (same keys as the editor / PDF). For \`component:cv\`, emit a complete, tailored snapshot (all sections the user should see on the card). Partial edits alone stay in \`\`\`json\`\`\` blocks as already described above. Example skeleton:
  \`\`\`component:cv\n{"resumeData":{"basicInfo":{"name":"","title":"","email":"","phone":"","location":"","linkedin":"","website":"","summary":"","languages":[]},"experience":[{"company":"","position":"","startDate":"","endDate":"","description":"","highlights":[]}],"education":[{"institution":"","degree":"","field":"","startDate":"","endDate":"","gpa":""}],"skills":[],"projects":[{"name":"","description":"","technologies":[]}],"achievements":[{"title":"","description":"","date":""}]},"template":"modern"}\n\`\`\`
  **Rules:** Top-level keys inside \`resumeData\` must be \`basicInfo\`, \`experience\`, \`education\`, \`skills\`, \`projects\`, \`achievements\` — not \`sections\` / \`items\` trees. Use \`experience[].highlights\` for keyword bullets; \`projects[].technologies\` for stacks; \`basicInfo.summary\` for the summary. **Avoid** \`resumeData.sections\`; the app can normalize it if you slip, but the flat schema is what you should emit. Never include \`profilePicture\`. \`template\` (optional): modern, classic, minimal, professional, elegant, dark, gradient, two-column, gradient-gray, german-cv, multi-colour.
- For requests like "create resume as per job description", prefer \`component:cv\` as the primary structured output (you may include a short explanation outside the fence).
- Cover letter viewer: \`\`\`component:coverLetter\n{"head":"...","body":"...","footer":"..."}\n\`\`\`

LaTeX components — use ONLY when the user clearly asks for LaTeX, academic / print-specific layout, fine typography, or an explicit custom style (e.g. moderncv, two-column LaTeX, European CV). Do NOT add LaTeX for routine “improve my resume” or generic bullet edits; use JSON + \`component:cv\` instead.
- LaTeX CV: \`\`\`component:resumeLatex\n{"latex":"...one JSON string, full compilable .tex..."}\n\`\`\`
- LaTeX cover letter: \`\`\`component:coverLetterLatex\n{"latex":"...full compilable .tex..."}\n\`\`\`
Escape backslashes and newlines inside JSON strings so the fence stays valid.`

  // Omit massive LaTeX source code for small context models to avoid 400 errors
  if (!isSmallContext && typeof resumeLatex === "string" && resumeLatex.trim()) {
    const clip = resumeLatex.length > 200_000 ? resumeLatex.slice(0, 200_000) + "\n% …truncated" : resumeLatex
    systemMessage += `\n\nThe user’s current résumé LaTeX (from the chat editor; revise when they ask):\n\n\`\`\`tex\n${clip}\n\`\`\``
  }
  if (!isSmallContext && typeof coverLetterLatex === "string" && coverLetterLatex.trim()) {
    const clip = coverLetterLatex.length > 200_000 ? coverLetterLatex.slice(0, 200_000) + "\n% …truncated" : coverLetterLatex
    systemMessage += `\n\nThe user’s current cover letter LaTeX (from the chat editor):\n\n\`\`\`tex\n${clip}\n\`\`\``
  }

  // If there's attached data, add it to the system message
  if (attachedData) {
    try {
      // If attachedData is a string that contains JSON, parse it
      const parsedData = typeof attachedData === "string" ? JSON.parse(attachedData) : attachedData
      systemMessage += `\n\nThe user has also attached additional data: ${JSON.stringify(parsedData)}`
    } catch (error) {
      // If it's not valid JSON, just use it as is
      systemMessage += `\n\nThe user has also attached additional data: ${attachedData}`
    }
  }

  // If there are attached files, add them to the system message
  if (attachedFiles && attachedFiles.length > 0) {
    systemMessage += `\n\nThe user has attached the following files:\n`

    for (const file of attachedFiles) {
      if (file.contentType === 'pdf') {
        systemMessage += `\nPDF File: ${file.name} (${file.pages} pages)\nContent: ${file.content}\n`
      } else if (file.contentType === 'document') {
        systemMessage += `\nDocument File: ${file.name}\nContent: ${file.content}\n`
      } else if (file.contentType === 'image') {
        systemMessage += `\nImage File: ${file.name}\nDescription: ${file.content}\n`
      } else if (file.contentType === 'json') {
        systemMessage += `\nJSON File: ${file.name}\nData: ${JSON.stringify(file.content)}\n`
      } else if (file.contentType === 'text' || file.contentType === 'csv') {
        systemMessage += `\nText/CSV File: ${file.name}\nContent: ${file.content}\n`
      } else if (file.contentType === 'excel') {
        systemMessage += `\nExcel File: ${file.name}\nInfo: ${file.content}\n`
      } else {
        systemMessage += `\nFile: ${file.name}\nContent: ${file.content}\n`
      }
    }

    systemMessage += `\nPlease analyze these files and use their content to provide relevant assistance.`
  }

  // If there's context text, add it to the system message
  const clippedContextText = clipForPrompt(contextText, MAX_CONTEXT_TEXT_CHARS)
  if (clippedContextText) {
    systemMessage += `\n\nUser Context: ${clippedContextText}`
  }

  if (chatGlobalProfile && typeof chatGlobalProfile === "object" && !Array.isArray(chatGlobalProfile)) {
    const profileJson = clipForPrompt(JSON.stringify(chatGlobalProfile), MAX_PROFILE_JSON_CHARS)
    if (profileJson) {
      systemMessage += `\n\nGlobal Master Career Profile & Memory Vault:\n${profileJson}\n\nMaster Memory Vault Grounding Rules:\n- Ground strictly on the user's provided Master Memory Vault / Profile data (career goals, summary, skills, work history, projects, education, certifications, languages). Never hallucinate or assume placeholder data (such as John Doe, Spanish, French, etc.).\n- When the user requests a tailored resume, CV score, cover letter, or job application for ANY specific job description or target role, select and prioritize the most relevant achievements, skills, and projects directly from their Memory Vault.`
    }
  }

  const clippedMemoryContext = clipForPrompt(memoryContext, MAX_MEMORY_CONTEXT_CHARS)
  if (clippedMemoryContext) {
    systemMessage += `\n\nLong-term memory context (AI SDK app memory):\n${clippedMemoryContext}`
  }

  const clippedRetrievalContext = clipForPrompt(retrievalContext, MAX_RETRIEVAL_CONTEXT_CHARS)
  if (clippedRetrievalContext) {
    systemMessage += `\n\nRetrieved conversation/context snippets (Memory Vault):\n${clippedRetrievalContext}`
  }

  systemMessage += `\n\nBehavior & Formatting Requirements:
- **Universal Task Completion Mandate**: You are an expert AI Career Copilot. No matter which task the user asks (resume building, job tailoring, ATS score evaluation, web scraping, chart creation, interview preparation, cover letters, LaTeX compilation, cold outreach, career knowledge graph inspection, or GitHub sync), you MUST fulfill the task completely and accurately in this turn. Never refuse or claim inability.
- Use the full conversation history provided in this request as the primary source of user intent.
- Use the user's Master Memory Vault as the ultimate source of truth when tailoring resumes or answering career questions.
- **Page Length & Budget Calibration**:
  - **1-Page Resume Request**: High-impact density. Emit 1 concise summary (2–3 sentences), 6–10 prioritized skills, 2–3 most relevant roles with 2–3 quantified bullet points each, top 2 key projects with tech stack, and concise education & languages.
  - **2-Page Resume Request**: Comprehensive depth. Emit an expanded technical summary, categorized core skill clusters (e.g. Languages, AI & Robotics, Frontend/Mobile, Backend/Cloud), 4–6 detailed roles with 3–4 bullet points each with metrics and impact, 3–5 featured projects with technology stacks, full education, certifications, and languages.
- When user asks to customize for a job description, prioritize direct job requirements and measurable relevance in bullets/skills/summary.

- **Chain of Thought (<think>...</think>) & Tool Declaring**:
  When planning complex tasks, evaluating ATS scores, scraping jobs, visualizing metrics, tailoring resumes, or generating cover letters, wrap your step-by-step reasoning in \\<think\\>...\\</think\\>.
  In your thinking, declare which tool or component you are executing (e.g. 'Using tool: web_scraper', 'Using tool: chart_generator', 'Using tool: search_jobs', 'Using tool: generate_resume_pdf', 'Using tool: calculate_ats_score', 'Using tool: neo4j_career_graph', 'Using tool: github_encrypted_sync').
  This reasoning and tool execution state will stream directly into the user's live reasoning box with visual tool badges.

- **Interactive UI Components (Emit fenced code blocks with \`\`\`component:<name>)**:
  1. **Resume / CV Generator (\`\`\`component:cv)**:
     \`\`\`component:cv
     {
       "resumeData": {
         "basicInfo": { "name": "...", "title": "...", "email": "...", "phone": "...", "location": "...", "linkedin": "...", "website": "...", "summary": "...", "languages": [] },
         "experience": [{ "company": "...", "position": "...", "startDate": "...", "endDate": "...", "description": "...", "highlights": [] }],
         "education": [{ "institution": "...", "degree": "...", "field": "...", "startDate": "...", "endDate": "...", "gpa": "..." }],
         "skills": ["..."],
         "projects": [{ "name": "...", "description": "...", "technologies": [] }],
         "achievements": [{ "title": "...", "description": "...", "date": "..." }]
       },
       "template": "modern"
     }
     \`\`\`
     Templates: modern, classic, minimal, professional, elegant, dark, gradient, two-column, gradient-gray, german-cv, tech-modern, multi-colour.

  2. **Interactive Data Chart (\`\`\`component:chart)**:
     For visualizing salary benchmarks, skill matrices, ATS score breakdown, career trajectory, or job market demand:
     \`\`\`component:chart
     {
       "type": "bar",
       "title": "Skills Match & Market Demand",
       "description": "Comparison between target role requirements and your profile",
       "metrics": "88% Overall Fit",
       "xAxisKey": "skill",
       "categories": ["YourLevel", "MarketDemand"],
       "data": [
         { "skill": "TypeScript", "YourLevel": 90, "MarketDemand": 95 },
         { "skill": "React", "YourLevel": 95, "MarketDemand": 90 },
         { "skill": "Next.js", "YourLevel": 85, "MarketDemand": 88 },
         { "skill": "PostgreSQL", "YourLevel": 80, "MarketDemand": 75 },
         { "skill": "AI SDK", "YourLevel": 85, "MarketDemand": 80 }
       ]
     }
     \`\`\`
     Chart types supported: "bar", "line", "area", "pie", "radar".

  3. **Job Scraping & Search (\`\`\`component:job-scraper)**:
     \`\`\`component:job-scraper
     {
       "query": "Target Role",
       "location": "Location / Remote",
       "jobs": [
         {
           "id": "job-1",
           "title": "Role Title",
           "company": "Company Name",
           "location": "Location",
           "salary": "$X - $Y",
           "link": "https://...",
           "description": "Key requirements and duties...",
           "postedMinutesAgo": 5
         }
       ]
     }
     \`\`\`

  4. **Cover Letter Generator (\`\`\`component:cover-letter)**:
     \`\`\`component:cover-letter
     {
       "head": "Sender & Recipient details, Date, Subject line",
       "body": "Opening hook, core achievements aligned to the role, value proposition, and closing enthusiasm",
       "footer": "Sincerely,\\n[User Name]",
       "template": "modern"
     }
     \`\`\`

  5. **ATS Fit Scorer (\`\`\`component:cv-score)**:
     \`\`\`component:cv-score
     {
       "score": 88,
       "feedback": [
         "Strong match in Next.js and full-stack development experience",
         "Add measurable impact metrics to the backend engineering bullet points",
         "Include keyword 'distributed systems' to pass initial ATS filters"
       ],
       "jobDescription": "Full job description text..."
     }
     \`\`\`

  6. **Job Recommendations (\`\`\`component:job-recommendations)**:
     \`\`\`component:job-recommendations
     {
       "links": [
         { "title": "Senior Frontend Engineer", "company": "Tech Corp", "url": "https://..." }
       ]
     }
     \`\`\`

  7. **Auto-Applier Simulator (\`\`\`component:auto-applier)**:
     \`\`\`component:auto-applier
     {
       "steps": [
         { "action": "Parsing job requirements", "status": "done", "details": "Extracted key technical requirements" },
         { "action": "Tailoring resume & cover letter", "status": "done", "details": "Aligned skills to job spec" },
         { "action": "Submitting application via company portal", "status": "current", "details": "Connecting to ATS endpoint" }
       ]
     }
     \`\`\`

  8. **Coding Interview Challenge (\`\`\`component:coding-challenge)**:
     \`\`\`component:coding-challenge
     {
       "title": "Two Sum / Dynamic Programming Problem",
       "difficulty": "Medium",
       "timeLimit": "30 mins",
       "description": "Problem prompt and constraints...",
       "starterCode": "function solution() { ... }",
       "solution": "Full working code...",
       "testCases": [{ "input": "[2, 7, 11, 15], target = 9", "expected": "[0, 1]" }]
     }
     \`\`\`

  9. **Learning Pick & Resources (\`\`\`component:learning-resources)**:
     \`\`\`component:learning-resources
     {
       "resources": [
         { "title": "Advanced Distributed Systems", "provider": "Coursera / MIT", "url": "https://...", "skills": ["Raft", "Sharding"] }
       ]
     }
     \`\`\`

  10. **HR Cold Outreach Email (\`\`\`component:email-hr)**:
      \`\`\`component:email-hr
      {
        "to": "recruiter@company.com",
        "subject": "Application for Senior Engineer - [Name]",
        "body": "Hi [Name],\\n\\nI came across the Senior Engineer opening...",
        "company": "Company Name",
        "role": "Senior Engineer"
      }
      \`\`\`

  11. **LinkedIn Direct Outreach (\`\`\`component:linkedin-dm)**:
      \`\`\`component:linkedin-dm
      {
        "recipient": "Hiring Manager Name",
        "note": "Personalized 300-char connection note...",
        "fullMessage": "In-depth message following connection..."
      }
      \`\`\`

  12. **LaTeX Resume & Cover Letter (\`\`\`component:resume-latex or \`\`\`component:cover-letter-latex)**:
      \`\`\`component:resume-latex
      {
        "latex": "\\\\documentclass{article} ... \\\\end{document}"
      }
      \`\`\`

  13. **Memory Vault Ingestion (\`\`\`component:memory-vault)**:
      \`\`\`component:memory-vault
      {
        "title": "Ingest Document / Excerpt",
        "content": "Key career accomplishments or notes...",
        "source": "resume.pdf"
      }
      \`\`\`

- **Available MCP Tools**:
  - \`search_jobs\`: Search live jobs by query, location, and seniority.
  - \`scrape_job_posting\`: Scrape and extract requirements from job URLs.
  - \`scrape_github_profile\`: Scrape public repositories, stars, and languages for @username.
  - \`scrape_linkedin_profile\`: Extract structured experience from public LinkedIn profiles.
  - \`generate_resume_pdf\`: Compile and export PDF from resume JSON and template.
  - \`generate_cover_letter_pdf\`: Compile and export PDF cover letter.
  - \`list_templates\`: Retrieve all 12+ resume and cover letter templates.

- **Available REST API Endpoints**:
  - \`/api/chat\`: Core AI Chat with reasoning, tools, and component streaming.
  - \`/api/job-search\`: Real-time job search and scraping endpoint.
  - \`/api/user/profile\`: PL/SQL & PostgreSQL storage for user profile, master vault, and API keys.
  - \`/api/github/sync\`: Zero-knowledge encrypted GitHub and GitLab repository synchronization.
  - \`/api/chat/feedback\`: RLHF training dataset collector and .jsonl export.
  - \`/api/webview/proxy\`: Live Chromium web proxy for interactive web scraping and browsing.
  - \`/api/memory-vault\`: Persistent career knowledge graph and RAG vault.
  - \`/api/email-draft\`: AI-powered cold recruiter email generator.
  - \`/api/generate-pdf\` & \`/api/latex-pdf\`: PDF and LaTeX rendering services.
  - \`/api/mcp\`: Model Context Protocol server exposing JSON-RPC 2.0 tools.`

  // Format the conversation for the AI
  const messagesList = Array.isArray(messages) ? messages : []
  
  if (messagesList.length > 0) {
    const lastMsg = messagesList[messagesList.length - 1]
    if (lastMsg.role === "user") {
      const reminder = `\n\n[SYSTEM REMINDER: You MUST use the interactive markdown components (e.g. \`\`\`component:cv\n{...}\n\`\`\`, \`\`\`component:cover-letter\`, \`\`\`component:job-scraper\`, etc.) to fulfill the request. If generating a resume, output the full \`component:cv\` JSON. Do not just ask for information you already have in the Profile/Memory Vault. Complete the task instantly.]`
      if (typeof lastMsg.content === "string") {
        lastMsg.content += reminder
      }
      if (Array.isArray(lastMsg.parts)) {
        const textPart = lastMsg.parts.find((p: any) => p.type === "text")
        if (textPart) textPart.text += reminder
        else lastMsg.parts.push({ type: "text", text: reminder })
      }
    }
  }

  const formattedMessages = [{ role: "system", content: systemMessage }, ...messagesList]

  const { id: resolvedModelId, config: modelConfig } = resolveModelRouting(model)
  if (!modelConfig) {
    console.error("[api/chat] Model map missing fallback", { model, resolvedModelId })
    return new Response(JSON.stringify({ error: "Invalid model", message: "Selected model is not configured." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Route to the appropriate provider handler
    switch (modelConfig.provider) {
      case "google":
        try {
          return await handleWithGemini(formattedMessages, modelConfig.modelId, apiKey, messagesList)
        } catch (error: any) {
          console.error("Error with Gemini model:", error)
          if (error.message && error.message.includes("429") && error.message.includes("quota")) {
            return handleQuotaExceeded(messagesList)
          }
          try {
            console.warn("Retrying with handleNewGemini...")
            return await handleNewGemini(formattedMessages, modelConfig.modelId, apiKey, messagesList)
          } catch (newGeminiError: any) {
            console.error("Error with New Gemini handler:", newGeminiError)
            throw newGeminiError
          }
          throw error
        }

      case "openai":
        try {
          return await handleWithOpenAI(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with OpenAI model:", error)
          if (error.message && error.message.includes("429") && error.message.includes("quota")) {
            return handleQuotaExceeded(messagesList)
          }
          throw error
        }

      case "anthropic":
        try {
          return await handleWithAnthropic(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with Anthropic model:", error)
          throw error
        }

      case "deepseek":
        try {
          return await handleWithDeepSeek(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with DeepSeek model:", error)
          throw error
        }

      case "groq":
        try {
          return await handleWithGroq(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with Groq model:", error)
          throw error
        }

      case "mistral":
        try {
          return await handleWithMistral(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with Mistral model:", error)
          throw error
        }

      case "together":
        try {
          return await handleWithTogether(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with Together.ai model:", error)
          throw error
        }

      case "cohere":
        try {
          return await handleWithCohere(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with Cohere model:", error)
          throw error
        }

      case "perplexity":
        try {
          return await handleWithPerplexity(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with Perplexity model:", error)
          throw error
        }

      case "fireworks":
        try {
          return await handleWithFireworks(formattedMessages, modelConfig.modelId, apiKey)
        } catch (error: any) {
          console.error("Error with Fireworks model:", error)
          throw error
        }

      case "huggingface":
        try {
          // Career chat sends Hub id as `model` (e.g. Qwen/...) without separate customModel
          const effectiveHfCustomModel =
            typeof customModel === "string" && customModel.trim()
              ? customModel.trim()
              : resolvedModelId.includes("/")
                ? resolvedModelId
                : undefined
          return await handleWithHuggingFace(
            formattedMessages,
            modelConfig.modelId,
            apiKey,
            effectiveHfCustomModel,
            typeof customEndpoint === "string" ? customEndpoint : undefined,
            typeof customHeaders === "string" ? customHeaders : undefined,
            resolvedModelId,
          )
        } catch (error: any) {
          console.error("Error with Hugging Face model:", error)
          throw error
        }


      case "local":
        try {
          return await handleWithLocal(
            formattedMessages,
            modelConfig.modelId,
            apiKey,
            customEndpoint,
            customModel,
            customHeaders,
            customAuth as "custom" | "bearer" | "api-key" | "none" | undefined  ,
          )
        } catch (error: any) {
          console.error("Error with Local model:", error)
          throw error
        }

      case "ollama":
        try {
          return await handleWithOllama(
            formattedMessages,
            modelConfig.modelId,
            apiKey,
            customEndpoint,
            customModel,
          )
        } catch (error: any) {
          console.error("Error with Ollama model:", error)
          throw error
        }

      case "lmstudio":
        try {
          return await handleWithLMStudio(
            formattedMessages,
            modelConfig.modelId,
            apiKey,
            customEndpoint,
            customModel,
          )
        } catch (error: any) {
          console.error("Error with LM Studio model:", error)
          throw error
        }

      case "openai-like":
        try {
          return await handleWithOpenAILike(
            formattedMessages,
            modelConfig.modelId,
            apiKey,
            customEndpoint,
            customModel,
            messagesList,
          )
        } catch (error: any) {
          console.error("Error with OpenAI-like model:", error)
          throw error
        }

      case "fcukoffai":
        try {
          return await handleWithOpenAILike(
            formattedMessages,
            modelConfig.modelId,
            apiKey || process.env.CEDZ_LLM_API,
            "https://api.fcukoffai.com",
            modelConfig.modelId,
            messagesList,
          )
        } catch (error: any) {
          console.error("Error with FcukOff AI model:", error)
          throw error
        }

      case "xai":
        try {
          return await handleWithOpenAILike(
            formattedMessages,
            modelConfig.modelId,
            apiKey || process.env.XAI_API_KEY,
            "https://api.x.ai/v1",
            modelConfig.modelId,
            messagesList,
          )
        } catch (error: any) {
          console.error("Error with xAI model:", error)
          throw error
        }

      case "moonshotai":
        try {
          return await handleWithOpenAILike(
            formattedMessages,
            modelConfig.modelId,
            apiKey || process.env.MOONSHOT_API_KEY,
            "https://api.moonshot.cn/v1",
            modelConfig.modelId,
            messagesList,
          )
        } catch (error: any) {
          console.error("Error with Moonshot AI model:", error)
          throw error
        }

      case "lingo-ai":
        try {
          return await handleWithLingoAI(
            formattedMessages,
            modelConfig.modelId,
            apiKey,
            customModel,
          )
        } catch (error: any) {
          console.error("Error with Lingo AI model:", error)
          throw error
        }

      case "cedz":
        try {
          return await handleWithCedz(
            formattedMessages,
            modelConfig.modelId === "custom" ? customModel || "qwen3:8b" : modelConfig.modelId,
            customEndpoint,
            messagesList,
          )
        } catch (error: any) {
          console.error("Error with Cedz model:", error)
          throw error
        }

      default:
        throw new Error(`Unsupported model provider: ${modelConfig.provider}`)
    }
  } catch (error: any) {
    console.error("Error generating response:", error)
    
    const errorMessage = error.message || ""
    let userMessage = errorMessage || "There was an error processing your request. Please try again later."
    
    if (errorMessage.includes("exceeds the available context size") || errorMessage.includes("context length") || errorMessage.includes("tokens) exceeds")) {
      userMessage = "This request exceeds the model's maximum context size. Please switch to a model with a larger context window (like GPT-4o or Gemini 1.5 Pro) for this task."
    }

    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        message: userMessage,
        log: errorMessage // printing the response log in the payload
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}

// Helper to save files if Gemini returns inlineData (images, etc.)
function saveBinaryFile(fileName: string, content: Buffer) {
  writeFile(fileName, content, "utf8", (err) => {
    if (err) {
      console.error(`Error writing file ${fileName}:`, err)
      return
    }
    console.log(`File ${fileName} saved to file system.`)
  })
}

async function handleWithGemini(messages: any[], modelId: string, apiKey?: string, clientMessages?: unknown[]) {
  try {
    const key =
      apiKey ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY
    if (!key) {
      throw new Error("Google Gemini API key is required. Please provide it in the UI or set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable.")
    }

    const systemMsg = messages.find((m) => m.role === "system")
    const systemContent = systemMsg ? getMsgText(systemMsg) : ""
    const chatMessages = messages.filter((m) => m.role !== "system")

    const genAI = new GoogleGenerativeAI(key)
    const gemini = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: systemContent || undefined,
      generationConfig: { maxOutputTokens: 8192 },
    })

    const geminiHistory = chatMessages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: getMsgText(msg) }],
    }))

    const last = chatMessages[chatMessages.length - 1]
    if (!last || last.role !== "user") {
      throw new Error("Last message must be from user")
    }
    const lastText = getMsgText(last)

    const chat = gemini.startChat({
      history: geminiHistory,
      generationConfig: { maxOutputTokens: 8192 },
    })

    console.log(`Sending message to Gemini model: ${modelId}`)
    const result = await chat.sendMessageStream(lastText)

    const textId = generateId()
    const stream = createUIMessageStream({
      originalMessages: (clientMessages ?? []) as Parameters<typeof createUIMessageStream>[0]["originalMessages"],
      execute: async ({ writer }) => {
        writer.write({ type: "text-start", id: textId })
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) writer.write({ type: "text-delta", id: textId, delta: text })
          }
          writer.write({ type: "text-end", id: textId })
        } catch (error) {
          console.error("Error streaming from Gemini:", error)
          throw error
        }
      },
    })
    return createUIMessageStreamResponse({ stream })
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number }
    if (err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      return handleQuotaExceeded(clientMessages)
    }
    console.error("Error with Gemini model:", error)
    throw error
  }
}

async function handleNewGemini(
  messages: any[],
  modelId: string,
  apiKey?: string,
  clientMessages?: unknown[],
) {
  try {
    const key =
      apiKey ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY
    if (!key) {
      throw new Error("Google Gemini API key is required. Please provide it in the UI or set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable.")
    }

    const systemMsg = messages.find((m) => m.role === "system")
    const systemContent = systemMsg ? getMsgText(systemMsg) : ""
    const chatMessages = messages.filter((m) => m.role !== "system")

    const contents: { role: "user" | "model"; parts: { text: string }[] }[] = chatMessages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: getMsgText(msg) }],
    }))

    if (contents.length > 0 && contents[0].role !== "user") {
      const firstText = contents[0].parts[0].text
      contents[0] = { role: "user", parts: [{ text: (systemContent ? systemContent + "\n\n" : "") + "[Assistant]: " + firstText }] }
    } else if (systemContent && contents.length > 0) {
      contents[0].parts[0].text = systemContent + "\n\n" + contents[0].parts[0].text
    }

    const ai = new GoogleGenAI({ apiKey: key })
    const config: { responseModalities: string[] } = { responseModalities: ["TEXT"] }

    const response = await ai.models.generateContentStream({
      model: modelId || "gemini-2.0-flash",
      config,
      contents,
    })

    const textId = generateId()
    const stream = createUIMessageStream({
      originalMessages: (clientMessages ?? []) as Parameters<typeof createUIMessageStream>[0]["originalMessages"],
      execute: async ({ writer }) => {
        writer.write({ type: "text-start", id: textId })
        try {
          for await (const chunk of response) {
            if (chunk.text) {
              writer.write({ type: "text-delta", id: textId, delta: chunk.text })
            }
          }
          writer.write({ type: "text-end", id: textId })
        } catch (err) {
          console.error("Error streaming from New Gemini:", err)
          throw err
        }
      },
    })
    return createUIMessageStreamResponse({ stream })
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number }
    if (err?.message?.includes("429") || err?.message?.includes("quota") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      return handleQuotaExceeded(clientMessages)
    }
    console.error("Error with New Gemini model:", error)
    throw error
  }
}

// OpenAI handler
async function handleWithOpenAI(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.OPENAI_API_KEY
    if (!key) {
      throw new Error("OpenAI API key is required. Please provide it in the UI or set OPENAI_API_KEY environment variable.")
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch (e) {
              console.error("Error parsing OpenAI stream chunk:", e)
            }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with OpenAI model:", error)
    throw error
  }
}

// Anthropic handler (Messages API with streaming)
async function handleWithAnthropic(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error("Anthropic API key is required. Please provide it in the UI or set ANTHROPIC_API_KEY environment variable.")
    }

    const systemContent = (() => { const m = messages.find((x) => x.role === "system"); return m ? getMsgText(m) : "" })()
    const chatMessages = messages.filter((m) => m.role !== "system").map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: getMsgText(msg),
    }))

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 8192,
        system: systemContent,
        messages: chatMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            try {
              const json = JSON.parse(data)
              if (json.type === "content_block_delta" && json.delta?.text) write(json.delta.text)
            } catch {
              // Ignore parse errors for event types like message_start
            }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Anthropic model:", error)
    throw error
  }
}

// DeepSeek handler
async function handleWithDeepSeek(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.DEEPSEEK_API_KEY
    if (!key) {
      throw new Error("DeepSeek API key is required. Please provide it in the UI or set DEEPSEEK_API_KEY environment variable.")
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch (e) {
              console.error("Error parsing DeepSeek stream chunk:", e)
            }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with DeepSeek model:", error)
    throw error
  }
}

// Groq handler
async function handleWithGroq(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.GROQ_API_KEY
    if (!key) {
      throw new Error("Groq API key is required. Please provide it in the UI or set GROQ_API_KEY environment variable.")
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Groq API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch (e) {
              console.error("Error parsing Groq stream chunk:", e)
            }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Groq model:", error)
    throw error
  }
}

// Mistral handler
async function handleWithMistral(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.MISTRAL_API_KEY
    if (!key) {
      throw new Error("Mistral API key is required. Please provide it in the UI or set MISTRAL_API_KEY environment variable.")
    }

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Mistral API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch (e) {
              console.error("Error parsing Mistral stream chunk:", e)
            }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Mistral model:", error)
    throw error
  }
}

// Together.ai handler
async function handleWithTogether(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.TOGETHER_API_KEY
    if (!key) {
      throw new Error("Together.ai API key is required. Please provide it in the UI or set TOGETHER_API_KEY environment variable.")
    }

    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Together.ai error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Together.ai model:", error)
    throw error
  }
}

// Cohere handler
async function handleWithCohere(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.COHERE_API_KEY
    if (!key) {
      throw new Error("Cohere API key is required. Please provide it in the UI or set COHERE_API_KEY environment variable.")
    }

    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        message: getMsgText(messages[messages.length - 1] ?? {}),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Cohere API error: ${response.status} - ${errorText}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with Cohere model:", error)
    throw error
  }
}

// Perplexity handler
async function handleWithPerplexity(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.PERPLEXITY_API_KEY
    if (!key) {
      throw new Error("Perplexity API key is required. Please provide it in the UI or set PERPLEXITY_API_KEY environment variable.")
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Perplexity model:", error)
    throw error
  }
}

// Fireworks handler
async function handleWithFireworks(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.FIREWORKS_API_KEY
    if (!key) {
      throw new Error("Fireworks API key is required. Please provide it in the UI or set FIREWORKS_API_KEY environment variable.")
    }

    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(`Fireworks API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Fireworks model:", error)
    throw error
  }
}

// Hugging Face handler
async function handleWithHuggingFace(
  messages: any[],
  modelId: string,
  apiKey?: string,
  customModel?: string,
  customEndpoint?: string,
  customHeaders?: string,
  /** UI model id from /api/chat body (e.g. Hub preset `Qwen/...`) when `modelId` is `streaming`. */
  uiResolvedModelId?: string,
) {
  try {
    const hubFromUi =
      typeof uiResolvedModelId === "string" &&
      uiResolvedModelId.includes("/") &&
      !["hf-custom-hub-aisdk", "openai-compatible-aisdk"].includes(uiResolvedModelId)
        ? uiResolvedModelId
        : undefined
    const model = (typeof customModel === "string" && customModel.trim()) || hubFromUi || "meta-llama/Llama-3.1-8B-Instruct"

    // Get API key from UI or environment
    const hfToken = apiKey || process.env.HUGGINGFACE_API_KEY

    if (!hfToken) {
      throw new Error("Hugging Face API key is required. Please provide it in the UI or set HUGGINGFACE_API_KEY environment variable.")
    }

    // Create InferenceClient instance
    const client = new InferenceClient(hfToken)

    // Handle different Hugging Face configuration types
    switch (modelId) {
      case "endpoint":
        // Endpoint-based chat completion
        if (!customEndpoint) {
          throw new Error("Custom endpoint is required for endpoint-based Hugging Face models")
        }

        const endpointClient = client.endpoint(customEndpoint)
        const endpointResponse = await endpointClient.chatCompletion({
          model: model,
          messages: messages.map(msg => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: getMsgText(msg),
          })),
        })

        const endpointContent = endpointResponse.choices[0]?.message?.content || "No response generated"
        return new Response(endpointContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        })

      case "model":
        // Standard chat completion API
        const modelResponse = await client.chatCompletion({
          model: model,
          messages: messages.map(msg => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: getMsgText(msg),
          })),
        })

        const modelContent = modelResponse.choices[0]?.message?.content || "No response generated"
        return new Response(modelContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        })

      case "streaming":
        return streamTextToResponse(async (write) => {
          for await (const chunk of client.chatCompletionStream({
            model: model,
            messages: messages.map(msg => ({
              role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
              content: getMsgText(msg),
            })),
          })) {
            const content = chunk.choices[0]?.delta?.content
            if (content) write(content)
          }
        })

      case "provider":
        // Provider-based chat completion
        let provider = undefined
        if (customHeaders) {
          try {
            const parsedHeaders = JSON.parse(customHeaders)
            if (parsedHeaders.provider) {
              provider = parsedHeaders.provider
            }
          } catch (error) {
            console.warn("Invalid custom headers format:", error)
          }
        }

        if (!provider) {
          throw new Error("Provider is required for provider-based Hugging Face models")
        }

        const providerResponse = await client.chatCompletion({
          model: model,
          messages: messages.map(msg => ({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: getMsgText(msg),
          })),
          provider: provider,
        })

        const providerContent = providerResponse.choices[0]?.message?.content || "No response generated"
        return new Response(providerContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        })

      default:
        throw new Error(`Unsupported Hugging Face model type: ${modelId}`)
    }
  } catch (error) {
    console.error("Error with Hugging Face model:", error)
    throw error
  }
}

// Local model handler
async function handleWithLocal(
  messages: any[],
  modelId: string,
  apiKey: string | undefined,
  customEndpoint?: string,
  customModel?: string,
  customHeaders?: string,
  customAuth?: "bearer" | "api-key" | "custom" | "none",
) {
  try {
    const endpoint = customEndpoint || "http://localhost:8000/v1/chat/completions"
    const model = customModel || "local-model"

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Handle different authentication methods
    if (customAuth === "bearer" && apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    } else if (customAuth === "api-key" && apiKey) {
      headers["X-API-Key"] = apiKey
    } else if (customAuth === "custom" && customHeaders) {
      try {
        const parsedHeaders = JSON.parse(customHeaders)
        Object.assign(headers, parsedHeaders)
      } catch (error) {
        console.warn("Invalid custom headers format:", error)
      }
    }

    // Add custom headers if provided
    if (customHeaders && customAuth !== "custom") {
      try {
        const parsedHeaders = JSON.parse(customHeaders)
        Object.assign(headers, parsedHeaders)
      } catch (error) {
        console.warn("Invalid custom headers format:", error)
      }
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Local API error: ${response.status}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Local model:", error)
    throw error
  }
}

// Ollama handler
async function handleWithOllama(
  messages: any[],
  modelId: string,
  apiKey: string | undefined,
  customEndpoint?: string,
  customModel?: string,
) {
  try {
    const endpoint = customEndpoint || "http://127.0.0.1:11434"
    const model = customModel || "llama3.1:8b"

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            try {
              const json = JSON.parse(data)
              const text = json.message?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Ollama model:", error)
    throw error
  }
}

// LM Studio handler
async function handleWithLMStudio(
  messages: any[],
  modelId: string,
  apiKey: string | undefined,
  customEndpoint?: string,
  customModel?: string,
) {
  try {
    const endpoint = customEndpoint || "http://localhost:1234"
    const model = customModel || "local-model"

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with LM Studio model:", error)
    throw error
  }
}

// OpenAI-like handler
async function handleWithOpenAILike(
  messages: any[],
  modelId: string,
  apiKey: string | undefined,
  customEndpoint?: string,
  customModel?: string,
  clientMessages?: unknown[],
) {
  try {
    const endpoint = customEndpoint || "http://localhost:8000"
    const model = customModel || "local-model"

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg) || " ",
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenAI-like API error ${response.status}:`, errorText)
      throw new Error(`OpenAI-like API error: ${response.status} - ${errorText}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    }, clientMessages)
  } catch (error) {
    console.error("Error with OpenAI-like model:", error)
    throw error
  }
}

// Lingo AI handler
// Cedz / Ollama-style generate API: POST /api/generate with { model, prompt, stream: true }
async function handleWithCedz(
  messages: any[],
  modelId: string,
  baseUrl?: string,
  clientMessages?: unknown[],
) {
  const url = (baseUrl || process.env.CEDZ_API_URL || "").replace(/\/$/, "")
  if (!url) {
    throw new Error("Cedz API URL is required. Set CEDZ_API_URL in .env or provide the endpoint in the Cedz model settings (e.g. https://your-ngrok-url.ngrok-free.app).")
  }
  // Accept either a base URL (https://host) or a full generate URL (https://host/api/generate)
  const generateUrl = url.endsWith("/api/generate") ? url : `${url}/api/generate`
  const systemMsg = messages.find((m) => m.role === "system")
  const systemContent = systemMsg ? getMsgText(systemMsg) : ""
  const chatMessages = messages.filter((m) => m.role !== "system")
  const promptParts: string[] = []
  if (systemContent) promptParts.push(`System: ${systemContent}`)
  for (const msg of chatMessages) {
    const role = msg.role === "user" ? "User" : "Assistant"
    promptParts.push(`${role}: ${getMsgText(msg)}`)
  }
  const prompt = promptParts.join("\n\n")
  const response = await fetch(generateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify({ model: modelId, prompt, stream: true }),
  })
  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    console.error("Cedz API error", {
      status: response.status,
      url: generateUrl,
      model: modelId,
      body: errText?.slice?.(0, 2000) ?? errText,
    })
    throw new Error(`Cedz API error: ${response.status} - ${errText}`)
  }
  const textId = generateId()
  const stream = createUIMessageStream({
    originalMessages: (clientMessages ?? []) as Parameters<typeof createUIMessageStream>[0]["originalMessages"],
    execute: async ({ writer }) => {
      writer.write({ type: "text-start", id: textId })
      const reader = response.body?.getReader()
      if (reader) {
        const dec = new TextDecoder()
        let buf = ""
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += dec.decode(value, { stream: true })
            const lines = buf.split("\n")
            buf = lines.pop() || ""
            for (const line of lines) {
              const t = line.trim()
              if (!t) continue
              try {
                const j = JSON.parse(t)
                // Cedz/Ollama NDJSON: emit only response (visible reply); skip thinking
                if (typeof j.response === "string" && j.response) writer.write({ type: "text-delta", id: textId, delta: j.response })
                else if (typeof j.token === "string" && j.token) writer.write({ type: "text-delta", id: textId, delta: j.token })
              } catch (_err) {
                if (!t.startsWith("data:") && !t.startsWith("{")) writer.write({ type: "text-delta", id: textId, delta: t + "\n" })
              }
            }
          }
          if (buf.trim()) {
            try {
              const j = JSON.parse(buf)
              if (typeof j.response === "string" && j.response) writer.write({ type: "text-delta", id: textId, delta: j.response })
            } catch (_err) {
              writer.write({ type: "text-delta", id: textId, delta: buf })
            }
          }
        } catch (e) {
          console.error("Cedz stream read error:", e)
          throw e
        }
      }
      writer.write({ type: "text-end", id: textId })
    },
  })
  return createUIMessageStreamResponse({ stream })
}

async function handleWithLingoAI(
  messages: any[],
  modelId: string,
  apiKey: string | undefined,
  customModel?: string,
) {
  try {
    const endpoint = process.env.LINGOAI || "http://model.yakkshit.com/api/chat/completions"
    const model = customModel || "resume-model-v1"

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model,
        messages: messages.map(msg => ({
          role: msg.role === "system" ? "system" : msg.role === "assistant" ? "assistant" : "user",
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Lingo AI API error: ${response.status}`)
    }

    return streamTextToResponse(async (write) => {
      const reader = response.body?.getReader()
      if (!reader) return
      let partial = ""
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = new TextDecoder().decode(value)
        const lines = (partial + chunk).split("\n")
        partial = lines.pop() || ""
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim()
            if (data === "[DONE]") continue
            try {
              const json = JSON.parse(data)
              const text = json.choices[0]?.delta?.content
              if (text) write(text)
            } catch { /* ignore */ }
          }
        }
      }
    })
  } catch (error) {
    console.error("Error with Lingo AI model:", error)
    throw error
  }
}

function handleQuotaExceeded(clientMessages?: unknown[]) {
  const mockResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  return streamTextToResponse(async (write) => {
    const chunks = mockResponse.split(". ")
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i] + (i < chunks.length - 1 ? ". " : "")
      write(chunk)
      await new Promise((r) => setTimeout(r, 80))
    }
  }, clientMessages)
}