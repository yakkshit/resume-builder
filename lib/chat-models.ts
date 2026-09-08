/**
 * Curated AI model IDs supported by this project (stable APIs).
 * Grouped by provider for the UI.
 */
export const CHAT_MODELS_BY_PROVIDER: Record<string, readonly string[]> = {
  "Cedz": ["cedz-qwen3-8b", "cedz-llama3-8b", "cedz-custom"],
  "Lingo AI": ["lingo-ai"],
  "Google Gemini": [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.7-pro",
    "gemini-3.1-pro-preview",
    "gemini-3-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash",
    "gemini-2.0-pro",
  ],
  "OpenAI": [
    "gpt-6-astra",
    "gpt-5.6",
    "gpt-5.6-luna",
    "gpt-5.6-sol",
    "gpt-5.6-terra",
    "gpt-5.5",
    "gpt-5.4-mini",
    "gpt-5.4-nano",
    "gpt-5.2-pro",
    "gpt-5.2",
    "gpt-5.1",
    "gpt-5",
    "gpt-5-mini",
    "gpt-4.1",
    "gpt-4.1-mini",
    "gpt-4o",
    "gpt-4o-mini",
    "o3-mini",
    "o1",
    "gpt-4-turbo",
    "gpt-3.5-turbo",
  ],
  "Anthropic Claude": [
    "claude-sonnet-5",
    "claude-fable-5-1",
    "claude-fable-5",
    "claude-opus-4.8",
    "claude-opus-4.7",
    "claude-opus-4.6",
    "claude-opus-4.5",
    "claude-sonnet-4.6",
    "claude-sonnet-4.5",
    "claude-haiku-4.5",
    "claude-3-7-sonnet",
    "claude-3-5-sonnet",
    "claude-3-5-haiku",
    "claude-3-opus",
  ],
  "xAI Grok": [
    "grok-4.6",
    "grok-4.5",
    "grok-4-fast-reasoning",
    "grok-4",
    "grok-3",
    "grok-3-mini",
  ],
  "DeepSeek": [
    "deepseek-v4-flash-vision-exp",
    "deepseek-v4-flash",
    "deepseek-v4-pro",
    "deepseek-chat",
    "deepseek-reasoner",
  ],
  "Moonshot AI (Kimi)": [
    "kimi-k3",
    "kimi-k2.7-code",
    "kimi-k2.6",
  ],
  "Groq": [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b",
    "qwen-qwq-32b",
    "openai/gpt-oss-120b",
  ],
  "Mistral": [
    "pixtral-large-latest",
    "mistral-large-latest",
    "magistral-medium-2506",
    "magistral-small-2506",
    "mistral-small-latest",
    "ministral-8b-latest",
  ],
  "Cohere": [
    "command-a-03-2025",
    "command-a-reasoning-08-2025",
    "command-r-plus",
    "command-r",
  ],
  "Hugging Face": ["huggingface-endpoint", "huggingface-model", "huggingface-streaming", "huggingface-provider"],
  "Hugging Face (AI SDK)": [
    "meta-llama/Llama-3.1-8B-Instruct",
    "deepseek-ai/DeepSeek-V3-0324",
    "Qwen/Qwen2.5-72B-Instruct",
    "hf-custom-hub-aisdk",
  ],
  "Local / Custom": ["local-custom", "ollama-local", "lmstudio-local", "openai-like-local"],
} as const

export const CHAT_MODEL_IDS = Object.values(CHAT_MODELS_BY_PROVIDER).flat() as readonly string[]

export type ChatModelId = (typeof CHAT_MODEL_IDS)[number]

// Use a stable, non-deprecated default Gemini model
export const DEFAULT_CHAT_MODEL: ChatModelId = "gemini-2.5-flash"
