/**
 * Curated AI model IDs supported by this project (stable APIs).
 * Grouped by provider for the UI.
 */
export const CHAT_MODELS_BY_PROVIDER: Record<string, readonly string[]> = {
  "Cedz": ["cedz-qwen3-8b", "cedz-llama3-8b", "cedz-custom"],
  "Lingo AI": ["lingo-ai"],
  // Core text/multimodal Gemini chat models only (no TTS / audio-only / embeddings here)
  "Google Gemini": [
    "gemini-3.1-pro-preview",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
  ],
  "OpenAI": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  "Anthropic Claude": ["claude-3-5-sonnet", "claude-3-5-haiku"],
  "DeepSeek": ["deepseek-chat"],
  "Groq": ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"],
  "Mistral": ["mistral-large-latest", "mistral-medium-latest", "mistral-small-latest"],
  "Hugging Face": ["huggingface-endpoint", "huggingface-model", "huggingface-streaming", "huggingface-provider"],
  /** Preset Hub models in career chat (components/chat/chat-store.tsx) — drives customModel / server Hub id */
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
