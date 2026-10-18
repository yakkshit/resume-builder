/**
 * Centralized Model Capabilities Registry
 *
 * Defines the 7 core capabilities of AI models supported by this project:
 * - Thinking (Reasoning / CoT)
 * - Image Input (Vision / Multimodal)
 * - Object Generation (Structured Outputs / JSON Schema)
 * - Tool Usage (Function Calling)
 * - Tool Streaming (Real-time tool execution & progress)
 * - Google Search (Live search grounding)
 * - URL Context (Real-time web link ingestion & grounding)
 *
 * Tailored specifically for the resume/career intelligence platform:
 * ATS audits, live job matching, cloud browser automation, and LaTeX generation.
 */

export type ModelCapabilityKey =
  | "thinking"
  | "imageInput"
  | "objectGeneration"
  | "toolUsage"
  | "toolStreaming"
  | "googleSearch"
  | "urlContext";

export interface ModelCapabilityInfo {
  capability: ModelCapabilityKey;
  label: string;
  shortLabel: string;
  description: string;
  projectUse: string;
  iconName: "Brain" | "Image" | "Box" | "Wrench" | "Zap" | "Search" | "Link2";
  accentColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export const CAPABILITY_METADATA: Record<ModelCapabilityKey, ModelCapabilityInfo> = {
  thinking: {
    capability: "thinking",
    label: "Thinking",
    shortLabel: "Think",
    description: "Extended reasoning & chain-of-thought analysis for complex logical workflows",
    projectUse: "Powers in-depth ATS resume auditing, strict rubric evaluation, and multi-step career gap analysis",
    iconName: "Brain",
    accentColor: "#a855f7",
    badgeBg: "bg-purple-500/15",
    badgeBorder: "border-purple-500/30",
    badgeText: "text-purple-300",
  },
  imageInput: {
    capability: "imageInput",
    label: "Image Input",
    shortLabel: "Vision",
    description: "Multimodal perception for images, diagrams, documents, and visual screenshots",
    projectUse: "Analyzes uploaded resume screenshots, portfolio images, paper resumes, and design system mockups",
    iconName: "Image",
    accentColor: "#38bdf8",
    badgeBg: "bg-sky-500/15",
    badgeBorder: "border-sky-500/30",
    badgeText: "text-sky-300",
  },
  objectGeneration: {
    capability: "objectGeneration",
    label: "Object Generation",
    shortLabel: "Schema",
    description: "Guaranteed structured JSON schema output with strict type validation",
    projectUse: "Generates structured resume fields (work experience, education, skills, ATS scorecards) for auto-merging",
    iconName: "Box",
    accentColor: "#f59e0b",
    badgeBg: "bg-amber-500/15",
    badgeBorder: "border-amber-500/30",
    badgeText: "text-amber-300",
  },
  toolUsage: {
    capability: "toolUsage",
    label: "Tool Usage",
    shortLabel: "Tools",
    description: "Autonomous function calling and external tool invocation",
    projectUse: "Controls autonomous career agents (Browserbase, Kernel cloud browsers, LinkedIn job scrapers, LaTeX compiler)",
    iconName: "Wrench",
    accentColor: "#f43f5e",
    badgeBg: "bg-rose-500/15",
    badgeBorder: "border-rose-500/30",
    badgeText: "text-rose-300",
  },
  toolStreaming: {
    capability: "toolStreaming",
    label: "Tool Streaming",
    shortLabel: "Stream",
    description: "Real-time streaming feedback of tool calls, execution steps, and partial results",
    projectUse: "Displays live step-by-step progress bars and status indicators while searching jobs or browsing candidate sites",
    iconName: "Zap",
    accentColor: "#10b981",
    badgeBg: "bg-emerald-500/15",
    badgeBorder: "border-emerald-500/30",
    badgeText: "text-emerald-300",
  },
  googleSearch: {
    capability: "googleSearch",
    label: "Google Search",
    shortLabel: "Search",
    description: "Live search grounding backed by Google's real-time index",
    projectUse: "Retrieves fresh market job postings, company salary bands, hiring manager news, and active job openings",
    iconName: "Search",
    accentColor: "#3b82f6",
    badgeBg: "bg-blue-500/15",
    badgeBorder: "border-blue-500/30",
    badgeText: "text-blue-300",
  },
  urlContext: {
    capability: "urlContext",
    label: "URL Context",
    shortLabel: "URL",
    description: "Direct URL ingestion and grounding from live web addresses within prompts",
    projectUse: "Ingests target job description URLs (e.g. Greenhouse, Lever, LinkedIn) to tailor resumes directly to live listings",
    iconName: "Link2",
    accentColor: "#14b8a6",
    badgeBg: "bg-teal-500/15",
    badgeBorder: "border-teal-500/30",
    badgeText: "text-teal-300",
  },
};

export const ALL_CAPABILITY_KEYS: readonly ModelCapabilityKey[] = [
  "thinking",
  "imageInput",
  "objectGeneration",
  "toolUsage",
  "toolStreaming",
  "googleSearch",
  "urlContext",
] as const;

export interface ModelCapabilities {
  thinking: boolean;
  imageInput: boolean;
  objectGeneration: boolean;
  toolUsage: boolean;
  toolStreaming: boolean;
  googleSearch: boolean;
  urlContext: boolean;
}

const FULL_SUITE: ModelCapabilities = {
  thinking: true,
  imageInput: true,
  objectGeneration: true,
  toolUsage: true,
  toolStreaming: true,
  googleSearch: true,
  urlContext: true,
};

const STANDARD_MULTIMODAL: ModelCapabilities = {
  thinking: true,
  imageInput: true,
  objectGeneration: true,
  toolUsage: true,
  toolStreaming: true,
  googleSearch: false,
  urlContext: false,
};

const TEXT_ONLY_TOOLS: ModelCapabilities = {
  thinking: false,
  imageInput: false,
  objectGeneration: true,
  toolUsage: true,
  toolStreaming: true,
  googleSearch: false,
  urlContext: false,
};

const REASONING_TEXT_TOOLS: ModelCapabilities = {
  thinking: true,
  imageInput: false,
  objectGeneration: true,
  toolUsage: true,
  toolStreaming: true,
  googleSearch: false,
  urlContext: false,
};

const VISION_TEXT_TOOLS: ModelCapabilities = {
  thinking: false,
  imageInput: true,
  objectGeneration: true,
  toolUsage: true,
  toolStreaming: true,
  googleSearch: false,
  urlContext: false,
};

/**
 * Capability dictionary for known models.
 */
export const MODEL_CAPABILITIES_MAP: Record<string, ModelCapabilities> = {
  // ── Google Gemini Models (AI SDK & GenAI) ──────────────────────────────────
  "gemini-4-argon": { ...FULL_SUITE },
  "gemini-3.8-flash": { ...FULL_SUITE },
  "gemini-3.7-flash": { ...FULL_SUITE },
  "gemini-3.7-pro": { ...FULL_SUITE },
  "gemini-3.6-flash": { ...FULL_SUITE },
  "gemini-3.5-flash": { ...FULL_SUITE },
  "gemini-3.5-flash-lite": { ...FULL_SUITE },
  "gemini-3.1-pro-preview": { ...FULL_SUITE },
  "gemini-3.1-flash-image-preview": { ...FULL_SUITE },
  "gemini-3.1-flash-lite-preview": { ...FULL_SUITE },
  "gemini-3-pro-preview": { ...FULL_SUITE },
  "gemini-3-pro-image-preview": { ...FULL_SUITE },
  "gemini-3-flash-preview": { ...FULL_SUITE },
  "gemini-2.5-pro": { ...FULL_SUITE },
  "gemini-2.5-flash": { ...FULL_SUITE },
  "gemini-2.5-flash-lite": { ...FULL_SUITE },
  "gemini-2.5-flash-lite-preview-06-17": { ...FULL_SUITE },
  "gemini-2.5-flash-lite-preview-09-2025": { ...FULL_SUITE },
  "gemini-2.0-flash": { ...FULL_SUITE },
  "gemini-2.0-pro": { ...FULL_SUITE },
  "gemini-2.0-flash-exp": { ...FULL_SUITE },
  "gemini-1.5-pro": { ...FULL_SUITE },
  "gemini-1.5-flash": { ...FULL_SUITE },
  "gemini-nano-banana-2.1": {
    thinking: false,
    imageInput: true,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: true,
    urlContext: false,
  },

  // ── Google Vertex Models ──────────────────────────────────────────────────
  "vertex/gemini-4-argon": { ...FULL_SUITE },
  "vertex/gemini-3.8-flash": { ...FULL_SUITE },
  "vertex/gemini-3.1-pro-preview": { ...FULL_SUITE },
  "vertex/gemini-3-pro-preview": { ...FULL_SUITE },
  "vertex/gemini-2.5-pro": { ...FULL_SUITE },
  "vertex/gemini-2.5-flash": { ...FULL_SUITE },

  // ── OpenAI Models ─────────────────────────────────────────────────────────
  "gpt-6-astra": { ...STANDARD_MULTIMODAL },
  "gpt-6.1-sol": { ...STANDARD_MULTIMODAL },
  "gpt-6-luna": { ...STANDARD_MULTIMODAL },
  "gpt-6-sol": { ...STANDARD_MULTIMODAL },
  "gpt-5.6": { ...STANDARD_MULTIMODAL },
  "gpt-5.6-luna": { ...STANDARD_MULTIMODAL },
  "gpt-5.6-sol": { ...STANDARD_MULTIMODAL },
  "gpt-5.6-terra": { ...STANDARD_MULTIMODAL },
  "gpt-5.5": { ...STANDARD_MULTIMODAL },
  "gpt-5.4-mini": { ...STANDARD_MULTIMODAL },
  "gpt-5.4-nano": { ...STANDARD_MULTIMODAL },
  "gpt-5.2-pro": { ...STANDARD_MULTIMODAL },
  "gpt-5.2": { ...STANDARD_MULTIMODAL },
  "gpt-5.1": { ...STANDARD_MULTIMODAL },
  "gpt-5.1-codex": { ...STANDARD_MULTIMODAL },
  "gpt-5": { ...STANDARD_MULTIMODAL },
  "gpt-5-mini": { ...STANDARD_MULTIMODAL },
  "gpt-4.1": { ...STANDARD_MULTIMODAL },
  "gpt-4.1-mini": { ...STANDARD_MULTIMODAL },
  "gpt-4o": { ...STANDARD_MULTIMODAL },
  "gpt-4o-mini": { ...STANDARD_MULTIMODAL },
  "o3-mini": { ...REASONING_TEXT_TOOLS },
  "o1": { ...STANDARD_MULTIMODAL },
  "gpt-4-turbo": { ...STANDARD_MULTIMODAL },
  "gpt-3.5-turbo": { ...TEXT_ONLY_TOOLS },

  // ── Anthropic Claude Models ───────────────────────────────────────────────
  "claude-opus-5-5": { ...STANDARD_MULTIMODAL },
  "claude-sonnet-5-5": { ...STANDARD_MULTIMODAL },
  "claude-sonnet-5": { ...STANDARD_MULTIMODAL },
  "claude-haiku-5-5": { ...STANDARD_MULTIMODAL },
  "claude-fable-5-1": { ...STANDARD_MULTIMODAL },
  "claude-fable-5": { ...STANDARD_MULTIMODAL },
  "claude-opus-4-8": { ...STANDARD_MULTIMODAL },
  "claude-opus-4-7": { ...STANDARD_MULTIMODAL },
  "claude-opus-4-6": { ...STANDARD_MULTIMODAL },
  "claude-sonnet-4-6": { ...STANDARD_MULTIMODAL },
  "claude-opus-4-5": { ...STANDARD_MULTIMODAL },
  "claude-sonnet-4-5": { ...STANDARD_MULTIMODAL },
  "claude-haiku-4-5": { ...STANDARD_MULTIMODAL },
  "claude-opus-4-1": { ...STANDARD_MULTIMODAL },
  "claude-sonnet-4-0": { ...STANDARD_MULTIMODAL },
  "claude-3-7-sonnet": { ...STANDARD_MULTIMODAL },
  "claude-3-5-sonnet": { ...STANDARD_MULTIMODAL },
  "claude-3-5-haiku": { ...STANDARD_MULTIMODAL },
  "claude-3-opus": { ...STANDARD_MULTIMODAL },

  // ── xAI Grok Models ───────────────────────────────────────────────────────
  "grok-4.6": { ...STANDARD_MULTIMODAL },
  "grok-4.5": { ...STANDARD_MULTIMODAL },
  "grok-4-fast-reasoning": { ...STANDARD_MULTIMODAL },
  "grok-4": { ...TEXT_ONLY_TOOLS },
  "grok-3": { ...TEXT_ONLY_TOOLS },
  "grok-3-mini": { ...TEXT_ONLY_TOOLS },

  // ── DeepSeek Models ───────────────────────────────────────────────────────
  "deepseek-v4-flash-vision-exp": { ...STANDARD_MULTIMODAL },
  "deepseek-v4-flash": { ...REASONING_TEXT_TOOLS },
  "deepseek-v4-pro": { ...REASONING_TEXT_TOOLS },
  "deepseek-chat": { ...TEXT_ONLY_TOOLS },
  "deepseek-reasoner": { ...REASONING_TEXT_TOOLS },

  // ── Moonshot AI / Kimi ────────────────────────────────────────────────────
  "kimi-k3": { ...VISION_TEXT_TOOLS },
  "kimi-k2.7-code": { ...VISION_TEXT_TOOLS },
  "kimi-k2.6": { ...VISION_TEXT_TOOLS },

  // ── Groq Models ───────────────────────────────────────────────────────────
  "meta-llama/llama-4-scout-17b-16e-instruct": { ...VISION_TEXT_TOOLS },
  "llama-3.3-70b-versatile": { ...TEXT_ONLY_TOOLS },
  "llama-3.1-8b-instant": { ...TEXT_ONLY_TOOLS },
  "deepseek-r1-distill-llama-70b": { ...REASONING_TEXT_TOOLS },
  "qwen-qwq-32b": { ...REASONING_TEXT_TOOLS },
  "openai/gpt-oss-120b": { ...TEXT_ONLY_TOOLS },

  // ── Mistral Models ────────────────────────────────────────────────────────
  "pixtral-large-latest": { ...VISION_TEXT_TOOLS },
  "mistral-large-latest": { ...TEXT_ONLY_TOOLS },
  "magistral-medium-2506": { ...TEXT_ONLY_TOOLS },
  "magistral-small-2506": { ...TEXT_ONLY_TOOLS },
  "mistral-small-latest": { ...TEXT_ONLY_TOOLS },
  "ministral-8b-latest": { ...TEXT_ONLY_TOOLS },

  // ── Cohere Models ─────────────────────────────────────────────────────────
  "command-a-03-2025": { ...TEXT_ONLY_TOOLS },
  "command-a-reasoning-08-2025": { ...REASONING_TEXT_TOOLS },
  "command-r-plus": { ...TEXT_ONLY_TOOLS },
  "command-r": { ...TEXT_ONLY_TOOLS },

  // ── Together AI Models ────────────────────────────────────────────────────
  "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo": {
    thinking: false,
    imageInput: false,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "Qwen/Qwen2.5-72B-Instruct-Turbo": {
    thinking: false,
    imageInput: false,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "deepseek-ai/DeepSeek-V3": {
    thinking: false,
    imageInput: false,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "mistralai/Mixtral-8x22B-Instruct-v0.1": { ...TEXT_ONLY_TOOLS },

  // ── Fireworks Models ──────────────────────────────────────────────────────
  "accounts/fireworks/models/deepseek-r1": {
    thinking: true,
    imageInput: false,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "accounts/fireworks/models/deepseek-v3": {
    thinking: false,
    imageInput: false,
    objectGeneration: true,
    toolUsage: true,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "accounts/fireworks/models/llama-v3p3-70b-instruct": {
    thinking: false,
    imageInput: false,
    objectGeneration: true,
    toolUsage: true,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "accounts/fireworks/models/qwen2-vl-72b-instruct": {
    thinking: false,
    imageInput: true,
    objectGeneration: true,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },

  // ── Alibaba Models ────────────────────────────────────────────────────────
  "qwen3-max": { ...TEXT_ONLY_TOOLS },
  "qwen-plus": { ...TEXT_ONLY_TOOLS },

  // ── DeepInfra Models ──────────────────────────────────────────────────────
  "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": {
    thinking: false,
    imageInput: true,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "meta-llama/Llama-4-Scout-17B-16E-Instruct": {
    thinking: false,
    imageInput: true,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "meta-llama/Llama-3.3-70B-Instruct": {
    thinking: false,
    imageInput: false,
    objectGeneration: true,
    toolUsage: true,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "deepseek-ai/DeepSeek-R1": {
    thinking: true,
    imageInput: false,
    objectGeneration: false,
    toolUsage: false,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },
  "Qwen/QwQ-32B": {
    thinking: true,
    imageInput: false,
    objectGeneration: true,
    toolUsage: true,
    toolStreaming: false,
    googleSearch: false,
    urlContext: false,
  },

  // ── Cerebras Models ───────────────────────────────────────────────────────
  "gpt-oss-120b": { ...TEXT_ONLY_TOOLS },
  "gemma-4-31b": { ...VISION_TEXT_TOOLS },

  // ── Hugging Face Models ───────────────────────────────────────────────────
  "meta-llama/Llama-3.1-8B-Instruct": { ...TEXT_ONLY_TOOLS },
  "moonshotai/Kimi-K2-Instruct": { ...TEXT_ONLY_TOOLS },

  // ── Baseten Models ────────────────────────────────────────────────────────
  "Qwen/Qwen3-235B-A22B-Instruct-2507": { ...TEXT_ONLY_TOOLS },
  "deepseek-ai/DeepSeek-V3.1": { ...TEXT_ONLY_TOOLS },
  "moonshotai/Kimi-K2-Instruct-0905": { ...TEXT_ONLY_TOOLS },

  // ── Specialized / Custom Models ───────────────────────────────────────────
  "lingo-ai": { ...TEXT_ONLY_TOOLS },
  "cedz-hr-qwen": { ...TEXT_ONLY_TOOLS },
  "ollama-local": { ...TEXT_ONLY_TOOLS },
  "openai-compatible-aisdk": { ...TEXT_ONLY_TOOLS },
};

/**
 * Returns capabilities for any model ID.
 * If exact model is not in map, heuristics based on provider/family determine defaults.
 */
export function getModelCapabilities(modelId?: string): ModelCapabilities {
  if (!modelId) return { ...TEXT_ONLY_TOOLS };
  const exact = MODEL_CAPABILITIES_MAP[modelId];
  if (exact) return exact;

  const m = modelId.toLowerCase();

  // Gemini family
  if (m.includes("gemini")) {
    if (m.includes("nano")) {
      return {
        thinking: false,
        imageInput: true,
        objectGeneration: false,
        toolUsage: false,
        toolStreaming: false,
        googleSearch: true,
        urlContext: false,
      };
    }
    return { ...FULL_SUITE };
  }

  // GPT / OpenAI family
  if (m.includes("gpt") || m.includes("o1") || m.includes("o3") || m.includes("openai")) {
    return { ...STANDARD_MULTIMODAL };
  }

  // Claude family
  if (m.includes("claude") || m.includes("anthropic")) {
    return { ...STANDARD_MULTIMODAL };
  }

  // Grok family
  if (m.includes("grok")) {
    return m.includes("4.") ? { ...STANDARD_MULTIMODAL } : { ...TEXT_ONLY_TOOLS };
  }

  // DeepSeek family
  if (m.includes("deepseek")) {
    if (m.includes("vision")) return { ...STANDARD_MULTIMODAL };
    if (m.includes("r1") || m.includes("reasoner") || m.includes("v4")) return { ...REASONING_TEXT_TOOLS };
    return { ...TEXT_ONLY_TOOLS };
  }

  // Vision cues
  if (m.includes("pixtral") || m.includes("vl") || m.includes("vision")) {
    return { ...VISION_TEXT_TOOLS };
  }

  // Reasoning cues
  if (m.includes("reasoning") || m.includes("qwq") || m.includes("r1")) {
    return { ...REASONING_TEXT_TOOLS };
  }

  return { ...TEXT_ONLY_TOOLS };
}

/**
 * Check if a model supports a specific capability.
 */
export function hasModelCapability(modelId: string | undefined, capability: ModelCapabilityKey): boolean {
  return !!getModelCapabilities(modelId)[capability];
}

/**
 * Get active capability keys for a model.
 */
export function getActiveCapabilities(modelId: string | undefined): ModelCapabilityKey[] {
  const caps = getModelCapabilities(modelId);
  return ALL_CAPABILITY_KEYS.filter((key) => caps[key]);
}
