// Basic types
export interface PortfolioLink {
  platform: string
  url: string
  username?: string
}

export interface BasicInfo {
  name: string
  title: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
  summary: string
  profilePicture?: string
  languages?: string[]
  portfolioLinks?: PortfolioLink[] // Added portfolio links
}

export interface Experience {
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
  highlights: string[]
}

export interface Education {
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  gpa: string
}

export interface Project {
  name: string
  description: string
  technologies: string[]
  link?: string
  startDate?: string
  endDate?: string
}

export interface Achievement {
  title: string
  description: string
  date?: string
}

export interface ResumeData {
  language?: string
  basicInfo: BasicInfo
  experience: Experience[]
  education: Education[]
  skills: string[]
  projects?: Project[]
  achievements?: Achievement[]
}

// Import template mappings from index.ts to derive types
import type { resumeTemplates, coverLetterTemplates } from "@/components/pdf-templates"

// Derive Template type from resumeTemplates keys
export type Template = keyof typeof resumeTemplates

export type AIModel =
  | "lingo-ai"
  // Google Gemini
  | "gemini-4-argon"
  | "gemini-3.8-flash"
  | "gemini-3.7-flash"
  | "gemini-3.7-pro"
  | "gemini-3.6-flash"
  | "gemini-3.5-flash"
  | "gemini-3.5-flash-lite"
  | "gemini-3.1-pro-preview"
  | "gemini-3.1-flash-image-preview"
  | "gemini-3.1-flash-lite-preview"
  | "gemini-3-pro-preview"
  | "gemini-3-pro-image-preview"
  | "gemini-3-flash-preview"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.5-flash-lite-preview-06-17"
  | "gemini-2.0-flash"
  | "gemini-2.0-pro"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "gemini-nano-banana-2.1"
  // Google Vertex
  | "vertex/gemini-4-argon"
  | "vertex/gemini-3.8-flash"
  | "vertex/gemini-3.1-pro-preview"
  | "vertex/gemini-3-pro-preview"
  | "vertex/gemini-2.5-pro"
  | "vertex/gemini-2.5-flash"
  // OpenAI
  | "gpt-6-astra"
  | "gpt-6.1-sol"
  | "gpt-6-luna"
  | "gpt-6-sol"
  | "gpt-5.6"
  | "gpt-5.6-luna"
  | "gpt-5.6-sol"
  | "gpt-5.6-terra"
  | "gpt-5.5"
  | "gpt-5.4-mini"
  | "gpt-5.4-nano"
  | "gpt-5.2-pro"
  | "gpt-5.2"
  | "gpt-5.2-instant"
  | "gpt-5.1"
  | "gpt-5.1-codex"
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "o3-mini"
  | "o1"
  | "gpt-4-turbo"
  | "gpt-4"
  | "gpt-3.5-turbo"
  // Anthropic Claude
  | "claude-opus-5-5"
  | "claude-sonnet-5-5"
  | "claude-sonnet-5"
  | "claude-haiku-5-5"
  | "claude-fable-5-1"
  | "claude-fable-5"
  | "claude-opus-4.8"
  | "claude-opus-4.7"
  | "claude-opus-4.6"
  | "claude-opus-4.5"
  | "claude-opus-4.1"
  | "claude-sonnet-4.6"
  | "claude-sonnet-4.5"
  | "claude-sonnet-4.0"
  | "claude-haiku-4.5"
  | "claude-3-7-sonnet"
  | "claude-3-5-sonnet"
  | "claude-3-5-haiku"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "claude-3-haiku"
  // xAI Grok
  | "grok-4.6"
  | "grok-4.5"
  | "grok-4-fast-reasoning"
  | "grok-4"
  | "grok-3"
  | "grok-3-mini"
  // DeepSeek
  | "deepseek-v4-flash-vision-exp"
  | "deepseek-v4-flash"
  | "deepseek-v4-pro"
  | "deepseek-chat"
  | "deepseek-reasoner"
  // Moonshot AI / Kimi
  | "kimi-k3"
  | "kimi-k2.7-code"
  | "kimi-k2.6"
  // Groq & Open Models
  | "meta-llama/llama-4-scout-17b-16e-instruct"
  | "llama-3.3-70b-versatile"
  | "llama-3.1-8b-instant"
  | "deepseek-r1-distill-llama-70b"
  | "qwen-qwq-32b"
  | "openai/gpt-oss-120b"
  | "gemma-4-31b"
  // Mistral
  | "pixtral-large-latest"
  | "mistral-large-latest"
  | "magistral-medium-2506"
  | "magistral-small-2506"
  | "mistral-small-latest"
  | "ministral-8b-latest"
  // Cohere
  | "command-a-03-2025"
  | "command-a-reasoning-08-2025"
  | "command-r-plus"
  | "command-r"
  // Together AI
  | "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo"
  | "Qwen/Qwen2.5-72B-Instruct-Turbo"
  | "deepseek-ai/DeepSeek-V3"
  | "mistralai/Mixtral-8x22B-Instruct-v0.1"
  // Fireworks
  | "accounts/fireworks/models/deepseek-r1"
  | "accounts/fireworks/models/deepseek-v3"
  | "accounts/fireworks/models/llama-v3p3-70b-instruct"
  | "accounts/fireworks/models/qwen2-vl-72b-instruct"
  // Alibaba / DeepInfra
  | "qwen3-max"
  | "qwen-plus"
  | "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8"
  | "meta-llama/Llama-4-Scout-17B-16E-Instruct"
  | "meta-llama/Llama-3.3-70B-Instruct"
  | "deepseek-ai/DeepSeek-R1"
  | "Qwen/QwQ-32B"
  // Cerebras
  | "gpt-oss-120b"
  | "gemma-4-31b"
  // Hugging Face
  | "meta-llama/Llama-3.1-8B-Instruct"
  | "moonshotai/Kimi-K2-Instruct"
  // Baseten
  | "Qwen/Qwen3-235B-A22B-Instruct-2507"
  | "deepseek-ai/DeepSeek-V3.1"
  | "moonshotai/Kimi-K2-Instruct-0905"
  | "huggingface-endpoint"
  | "huggingface-model"
  | "huggingface-streaming"
  | "huggingface-provider"
  | "local-custom"
  | "ollama-local"
  | "lmstudio-local"
  | "openai-like-local"
  | "cedz-qwen3-8b"
  | "cedz-llama3-8b"
  | "cedz-custom"
  | (string & {});


// Cover Letter Types
export interface CoverLetterData {
  head: string
  body: string
  footer: string
}

// Derive CoverLetterTemplate type from coverLetterTemplates keys
export type CoverLetterTemplate = keyof typeof coverLetterTemplates