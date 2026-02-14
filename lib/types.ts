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
    | "gemini-3-flash-preview"
    | "gemini-3-pro-preview"
    | "gemini-3-pro-image-preview"
    | "gemini-2.5-flash"
    | "gemini-2.5-flash-preview-09-2025"
    | "gemini-2.5-flash-image"
    | "gemini-2.5-flash-live"
    | "gemini-2.5-flash-native-audio-preview-12-2025"
    | "gemini-2.5-flash-native-audio-preview-09-2025"
    | "gemini-2.5-flash-preview-tts"
    | "gemini-2.5-flash-lite"
    | "gemini-2.5-flash-lite-preview-09-2025"
    | "gemini-2.5-pro"
    | "gemini-2.5-pro-preview-tts"
    | "gemini-2.0-flash-exp"
    | "gemini-2.0-flash"
    | "gemini-2.0-flash-001"
    | "gemini-2.0-flash-lite"
    | "gemini-2.0-flash-lite-001"
    | "gemini-2.0-pro"
    | "gemini-1.5-pro"
    | "gemini-1.5-flash"
    | "gpt-5"
    | "gpt-5.2"
    | "gpt-5.2-instant"
    | "gpt-5.3-codex"
    | "gpt-5.3-codex-spark"
    | "gpt-4o"
    | "gpt-4o-mini"
    | "gpt-4-turbo"
    | "gpt-4"
    | "gpt-3.5-turbo"
    | "claude-opus-4.6"
    | "claude-opus-4.5"
    | "claude-sonnet-5"
    | "claude-sonnet-4.5"
    | "claude-haiku-4.5"
    | "claude-3-5-sonnet"
    | "claude-3-5-haiku"
    | "claude-3-opus"
    | "claude-3-sonnet"
    | "claude-3-haiku"
    | "claude-2.1"
    | "claude-2.0"
    | "claude-instant-1.2"
    | "deepseek-chat"
    | "deepseek-reasoner"
    | "deepseek-coder"
    | "deepseek-coder-v2"
    | "deepseek-coder-v2-lite"
    | "llama-3.1-8b-instant"
    | "llama-3.1-70b-versatile"
    | "llama-3.3-70b-versatile"
    | "mixtral-8x7b-32768"
    | "gemma2-9b-it"
    | "llama-3.1-8b"
    | "llama-3.1-70b"
    | "llama-3.3-70b"
    | "llama3-70b-8192"
    | "mistral-large-3"
    | "mistral-medium-3.1"
    | "mistral-small-3.2"
    | "mistral-medium-3"
    | "mistral-small-3.1"
    | "ministral-3-14b"
    | "ministral-3-8b"
    | "ministral-3-3b"
    | "magistral-medium-1.2"
    | "magistral-small-1.2"
    | "devstral-2"
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
    | "openai-like-local";
  
  
  // Cover Letter Types
  export interface CoverLetterData {
    head: string
    body: string
    footer: string
  }
  
  // Derive CoverLetterTemplate type from coverLetterTemplates keys
  export type CoverLetterTemplate = keyof typeof coverLetterTemplates