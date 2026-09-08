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
  | "gemini-3.8-flash"
  | "gemini-3.7-flash"
  | "gemini-3.7-pro"
  | "gemini-3.1-pro-preview"
  | "gemini-3-pro-preview"
  | "gemini-3-flash-preview"
  | "gemini-3.1-flash-lite-preview"
  | "gemini-3.1-flash-image-preview"
  | "gemini-3-pro-image-preview"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite"
  | "gemini-2.0-flash"
  | "gemini-2.0-pro"
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  // OpenAI
  | "gpt-6-astra"
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
  | "claude-sonnet-5"
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
  // Alibaba / DeepInfra
  | "qwen3-max"
  | "qwen-plus"
  | "devstral-medium-1.0"
  | "devstral-small-2"
  | "mistral-large-latest"
  | "mistral-medium-latest"
  | "mistral-small-latest"
  | "mistral-7b-instruct"
  | "meta-llama/llama-3.1-8b-instruct"
  | "meta-llama/llama-3.1-70b-instruct"
  | "meta-llama/llama-3.3-70b-instruct"
  | "command-r-plus"
  | "command-r"
  | "command-light"
  | "llama-3.1-sonar-large-128k-online"
  | "llama-3.1-8b-instruct"
  | "llama-3.1-70b-instruct"
  | "mixtral-8x7b-instruct"
  | "fireworks-llama-3.1-8b-instruct"
  | "fireworks-llama-3.1-70b-instruct"
  | "fireworks-mixtral-8x7b-instruct"
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
  | "cedz-custom";


// Cover Letter Types
export interface CoverLetterData {
  head: string
  body: string
  footer: string
}

// Derive CoverLetterTemplate type from coverLetterTemplates keys
export type CoverLetterTemplate = keyof typeof coverLetterTemplates