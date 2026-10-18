"use client";

import { useCallback, useEffect, useState } from "react";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AttachedFile {
  name: string;
  size: number;
  type: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  componentType?: string;
  componentData?: Record<string, unknown>;
  timestamp: number;
  attachedFiles?: AttachedFile[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatSettings {
  apiKey: string;
  model: string;
  contextWindow: string; // context text/instructions passed with each request
  /** When true, assistant replies that include resume JSON are merged into stored resumeData */
  autoMergeAssistantResume: boolean;
  /** Base URL for OpenAI-compatible provider (e.g. https://api.openai.com/v1 or proxy root) */
  openAiCompatBaseUrl: string;
  /** Model id sent to the OpenAI-compatible /v1/chat/completions endpoint */
  openAiCompatModel: string;
  /** Optional Hugging Face Hub model id override (legacy HF + HF AI SDK curated picks) */
  huggingFaceCustomModel: string;
  /** Optional override for “model docs” link in Integrations (else .env NEXT_PUBLIC_MULTI_MODEL_*) */
  integrationsDocsUrlOverride: string;
  /**
   * Vercel OIDC / PAT for Sandbox “test” from the sidebar — session only, never persisted.
   * Prefer `vercel env pull` → VERCEL_OIDC_TOKEN on the server.
   */
  vercelOidcToken: string;
  /** Optional OpenAI key for server-side clip transcription (Whisper); session only, never persisted. */
  openaiTranscriptionApiKey: string;
  /** Default language for AI generation and translation UI. */
  defaultLanguage: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const SESSIONS_STORAGE_ID = "ai-chat-sessions";
const SETTINGS_STORAGE_ID = "ai-chat-settings";

export const AVAILABLE_MODELS = [
  // Google Gemini
  { value: "gemini-4-argon", label: "Gemini 4 Argon (Flagship Reasoning)", provider: "Google" },
  { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash (Next Gen)", provider: "Google" },
  { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash", provider: "Google" },
  { value: "gemini-3.7-pro", label: "Gemini 3.7 Pro", provider: "Google" },
  { value: "gemini-3.6-flash", label: "Gemini 3.6 Flash", provider: "Google" },
  { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash", provider: "Google" },
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite", provider: "Google" },
  { value: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro Preview", provider: "Google" },
  { value: "gemini-3.1-flash-image-preview", label: "Gemini 3.1 Flash Image", provider: "Google" },
  { value: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite", provider: "Google" },
  { value: "gemini-3-pro-preview", label: "Gemini 3.0 Pro Preview", provider: "Google" },
  { value: "gemini-3-pro-image-preview", label: "Gemini 3.0 Pro Image", provider: "Google" },
  { value: "gemini-3-flash-preview", label: "Gemini 3.0 Flash Preview", provider: "Google" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", provider: "Google" },
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", provider: "Google" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", provider: "Google" },
  { value: "gemini-2.5-flash-lite-preview-06-17", label: "Gemini 2.5 Flash Lite (06-17)", provider: "Google" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", provider: "Google" },
  { value: "gemini-2.0-pro", label: "Gemini 2.0 Pro", provider: "Google" },
  { value: "gemini-nano-banana-2.1", label: "Gemini Nano Banana 2.1", provider: "Google" },

  // Google Vertex
  { value: "vertex/gemini-4-argon", label: "Gemini 4 Argon (Vertex)", provider: "Google Vertex" },
  { value: "vertex/gemini-3.8-flash", label: "Gemini 3.8 Flash (Vertex)", provider: "Google Vertex" },
  { value: "vertex/gemini-3.1-pro-preview", label: "Gemini 3.1 Pro (Vertex)", provider: "Google Vertex" },
  { value: "vertex/gemini-3-pro-preview", label: "Gemini 3.0 Pro (Vertex)", provider: "Google Vertex" },
  { value: "vertex/gemini-2.5-pro", label: "Gemini 2.5 Pro (Vertex)", provider: "Google Vertex" },
  { value: "vertex/gemini-2.5-flash", label: "Gemini 2.5 Flash (Vertex)", provider: "Google Vertex" },

  // OpenAI
  { value: "gpt-6-astra", label: "GPT-6 Astra (Preview)", provider: "OpenAI" },
  { value: "gpt-6.1-sol", label: "GPT-6.1 Sol", provider: "OpenAI" },
  { value: "gpt-6-luna", label: "GPT-6 Luna", provider: "OpenAI" },
  { value: "gpt-6-sol", label: "GPT-6 Sol", provider: "OpenAI" },
  { value: "gpt-5.6", label: "GPT-5.6", provider: "OpenAI" },
  { value: "gpt-5.6-luna", label: "GPT-5.6 Luna", provider: "OpenAI" },
  { value: "gpt-5.6-sol", label: "GPT-5.6 Sol", provider: "OpenAI" },
  { value: "gpt-5.6-terra", label: "GPT-5.6 Terra", provider: "OpenAI" },
  { value: "gpt-5.5", label: "GPT-5.5", provider: "OpenAI" },
  { value: "gpt-5.4-mini", label: "GPT-5.4 Mini", provider: "OpenAI" },
  { value: "gpt-5.4-nano", label: "GPT-5.4 Nano", provider: "OpenAI" },
  { value: "gpt-5.2-pro", label: "GPT-5.2 Pro", provider: "OpenAI" },
  { value: "gpt-5.2", label: "GPT-5.2", provider: "OpenAI" },
  { value: "gpt-5.1", label: "GPT-5.1", provider: "OpenAI" },
  { value: "gpt-5.1-codex", label: "GPT-5.1 Codex", provider: "OpenAI" },
  { value: "gpt-5", label: "GPT-5", provider: "OpenAI" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", provider: "OpenAI" },
  { value: "gpt-4.1", label: "GPT-4.1", provider: "OpenAI" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "OpenAI" },
  { value: "gpt-4o", label: "GPT-4o", provider: "OpenAI" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", provider: "OpenAI" },
  { value: "o3-mini", label: "o3 Mini", provider: "OpenAI" },
  { value: "o1", label: "o1 Reasoning", provider: "OpenAI" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo", provider: "OpenAI" },

  // Anthropic Claude
  { value: "claude-opus-5-5", label: "Claude Opus 5.5", provider: "Anthropic" },
  { value: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", provider: "Anthropic" },
  { value: "claude-sonnet-5", label: "Claude Sonnet 5", provider: "Anthropic" },
  { value: "claude-haiku-5-5", label: "Claude Haiku 5.5", provider: "Anthropic" },
  { value: "claude-fable-5-1", label: "Claude Fable 5.1", provider: "Anthropic" },
  { value: "claude-fable-5", label: "Claude Fable 5", provider: "Anthropic" },
  { value: "claude-opus-4-8", label: "Claude Opus 4.8", provider: "Anthropic" },
  { value: "claude-opus-4-7", label: "Claude Opus 4.7", provider: "Anthropic" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "Anthropic" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "Anthropic" },
  { value: "claude-opus-4-5", label: "Claude Opus 4.5", provider: "Anthropic" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", provider: "Anthropic" },
  { value: "claude-haiku-4-5", label: "Claude Haiku 4.5", provider: "Anthropic" },
  { value: "claude-opus-4-1", label: "Claude Opus 4.1", provider: "Anthropic" },
  { value: "claude-sonnet-4-0", label: "Claude Sonnet 4.0", provider: "Anthropic" },
  { value: "claude-3-7-sonnet", label: "Claude 3.7 Sonnet", provider: "Anthropic" },
  { value: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku", provider: "Anthropic" },

  // xAI Grok
  { value: "grok-4.6", label: "Grok 4.6", provider: "xAI" },
  { value: "grok-4.5", label: "Grok 4.5", provider: "xAI" },
  { value: "grok-4-fast-reasoning", label: "Grok 4 Fast Reasoning", provider: "xAI" },
  { value: "grok-4", label: "Grok 4", provider: "xAI" },
  { value: "grok-3", label: "Grok 3", provider: "xAI" },
  { value: "grok-3-mini", label: "Grok 3 Mini", provider: "xAI" },

  // DeepSeek
  { value: "deepseek-v4-flash-vision-exp", label: "DeepSeek V4 Flash Vision", provider: "DeepSeek" },
  { value: "deepseek-v4-flash", label: "DeepSeek V4 Flash", provider: "DeepSeek" },
  { value: "deepseek-v4-pro", label: "DeepSeek V4 Pro", provider: "DeepSeek" },
  { value: "deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek" },
  { value: "deepseek-reasoner", label: "DeepSeek R1", provider: "DeepSeek" },

  // Moonshot AI (Kimi)
  { value: "kimi-k3", label: "Kimi K3", provider: "Moonshot AI" },
  { value: "kimi-k2.7-code", label: "Kimi K2.7 Code", provider: "Moonshot AI" },
  { value: "kimi-k2.6", label: "Kimi K2.6", provider: "Moonshot AI" },

  // Groq
  { value: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout (Groq)", provider: "Groq" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", provider: "Groq" },
  { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B", provider: "Groq" },
  { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 (Groq)", provider: "Groq" },
  { value: "qwen-qwq-32b", label: "Qwen QwQ 32B (Groq)", provider: "Groq" },
  { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B (Groq)", provider: "Groq" },

  // Mistral
  { value: "pixtral-large-latest", label: "Pixtral Large", provider: "Mistral" },
  { value: "mistral-large-latest", label: "Mistral Large", provider: "Mistral" },
  { value: "magistral-medium-2506", label: "Magistral Medium", provider: "Mistral" },
  { value: "magistral-small-2506", label: "Magistral Small", provider: "Mistral" },
  { value: "mistral-small-latest", label: "Mistral Small", provider: "Mistral" },
  { value: "ministral-8b-latest", label: "Ministral 8B", provider: "Mistral" },

  // Cohere
  { value: "command-a-03-2025", label: "Command A", provider: "Cohere" },
  { value: "command-a-reasoning-08-2025", label: "Command A Reasoning", provider: "Cohere" },
  { value: "command-r-plus", label: "Command R+", provider: "Cohere" },
  { value: "command-r", label: "Command R", provider: "Cohere" },

  // Together AI
  { value: "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo", provider: "Together AI" },
  { value: "Qwen/Qwen2.5-72B-Instruct-Turbo", label: "Qwen 2.5 72B Turbo", provider: "Together AI" },
  { value: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3 (Together)", provider: "Together AI" },
  { value: "mistralai/Mixtral-8x22B-Instruct-v0.1", label: "Mixtral 8x22B", provider: "Together AI" },

  // Fireworks
  { value: "accounts/fireworks/models/deepseek-r1", label: "DeepSeek R1 (Fireworks)", provider: "Fireworks" },
  { value: "accounts/fireworks/models/deepseek-v3", label: "DeepSeek V3 (Fireworks)", provider: "Fireworks" },
  { value: "accounts/fireworks/models/llama-v3p3-70b-instruct", label: "Llama 3.3 70B (Fireworks)", provider: "Fireworks" },
  { value: "accounts/fireworks/models/qwen2-vl-72b-instruct", label: "Qwen2 VL 72B (Fireworks)", provider: "Fireworks" },

  // Alibaba
  { value: "qwen3-max", label: "Qwen 3 Max", provider: "Alibaba" },
  { value: "qwen-plus", label: "Qwen Plus", provider: "Alibaba" },

  // DeepInfra
  { value: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", label: "Llama 4 Maverick (DeepInfra)", provider: "DeepInfra" },
  { value: "meta-llama/Llama-4-Scout-17B-16E-Instruct", label: "Llama 4 Scout (DeepInfra)", provider: "DeepInfra" },
  { value: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 70B (DeepInfra)", provider: "DeepInfra" },
  { value: "deepseek-ai/DeepSeek-R1", label: "DeepSeek R1 (DeepInfra)", provider: "DeepInfra" },
  { value: "Qwen/QwQ-32B", label: "Qwen QwQ 32B (DeepInfra)", provider: "DeepInfra" },

  // Cerebras
  { value: "gpt-oss-120b", label: "GPT-OSS 120B (Cerebras)", provider: "Cerebras" },
  { value: "gemma-4-31b", label: "Gemma 4 31B (Cerebras)", provider: "Cerebras" },

  // Hugging Face
  { value: "meta-llama/Llama-3.1-8B-Instruct", label: "Llama 3.1 8B (HF)", provider: "Hugging Face" },
  { value: "moonshotai/Kimi-K2-Instruct", label: "Kimi K2 (HF)", provider: "Hugging Face" },

  // Baseten
  { value: "Qwen/Qwen3-235B-A22B-Instruct-2507", label: "Qwen 3 235B (Baseten)", provider: "Baseten" },
  { value: "deepseek-ai/DeepSeek-V3.1", label: "DeepSeek V3.1 (Baseten)", provider: "Baseten" },
  { value: "moonshotai/Kimi-K2-Instruct-0905", label: "Kimi K2 0905 (Baseten)", provider: "Baseten" },

  // Local & Custom
  { value: "cedz-hr-qwen", label: "Cedz HR Qwen", provider: "FcukOff AI" },
  { value: "ollama-local", label: "Ollama (Local)", provider: "Ollama" },
  { value: "openai-compatible-aisdk", label: "OpenAI-Compatible / Custom", provider: "OpenAI Compatible" },
];

const DEFAULT_SETTINGS: ChatSettings = {
  apiKey: "",
  model: "gemini-2.5-flash",
  contextWindow: "",
  autoMergeAssistantResume: true,
  openAiCompatBaseUrl: "",
  openAiCompatModel: "gpt-4o-mini",
  huggingFaceCustomModel: "",
  integrationsDocsUrlOverride: "",
  vercelOidcToken: "",
  openaiTranscriptionApiKey: "",
  defaultLanguage: "en",
};

// ── Helpers ────────────────────────────────────────────────────────────────

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = tryLocalStorageGet(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  tryLocalStorageSet(key, JSON.stringify(value));
}

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Manages all chat sessions (persistence + CRUD). */
export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentId, setCurrentId] = useState<string>("");

  // Hydrate from localStorage
  useEffect(() => {
    const stored = loadFromStorage<ChatSession[]>(SESSIONS_STORAGE_ID, []);
    if (stored.length > 0) {
      setSessions(stored);
      setCurrentId(stored[0].id);
    } else {
      const fresh = createSession();
      setSessions([fresh]);
      setCurrentId(fresh.id);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    if (sessions.length > 0) saveToStorage(SESSIONS_STORAGE_ID, sessions);
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === currentId) ?? null;

  const createSession = useCallback((): ChatSession => {
    return {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }, []);

  const addSession = useCallback(() => {
    const s = {
      id: generateId(),
      title: "New Chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
    return s;
  }, []);

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        if (id === currentId && next.length > 0) setCurrentId(next[0].id);
        else if (next.length === 0) {
          const fresh = {
            id: generateId(),
            title: "New Chat",
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setCurrentId(fresh.id);
          return [fresh];
        }
        return next;
      });
    },
    [currentId]
  );

  const appendMessage = useCallback(
    (sessionId: string, msg: ChatMessage) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const messages = [...s.messages, msg];
          return {
            ...s,
            messages,
            title: messages.find((m) => m.role === "user")?.content.slice(0, 60) ?? s.title,
            updatedAt: Date.now(),
          };
        })
      );
    },
    []
  );

  const exportSession = useCallback(
    (id: string): string => {
      const s = sessions.find((sess) => sess.id === id);
      return JSON.stringify(s ?? {}, null, 2);
    },
    [sessions]
  );

  const importSession = useCallback((json: string) => {
    const s = JSON.parse(json) as ChatSession;
    s.id = generateId(); // avoid collision
    setSessions((prev) => [s, ...prev]);
    setCurrentId(s.id);
  }, []);

  return {
    sessions,
    currentId,
    setCurrentId,
    currentSession,
    addSession,
    deleteSession,
    appendMessage,
    exportSession,
    importSession,
  };
}

/** Manages API settings (model, key, context window). */
export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = loadFromStorage<Partial<ChatSettings>>(SETTINGS_STORAGE_ID, {});
    // Secrets must NOT persist in browser storage; merge so new keys get defaults.
    setSettings({
      ...DEFAULT_SETTINGS,
      ...stored,
      apiKey: "",
      vercelOidcToken: "",
      openaiTranscriptionApiKey: "",
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<ChatSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      const {
        apiKey: _apiKey,
        vercelOidcToken: _vercel,
        openaiTranscriptionApiKey: _openaiTx,
        ...persistable
      } = next;
      saveToStorage(SETTINGS_STORAGE_ID, persistable as ChatSettings);
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
