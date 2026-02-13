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
    // Google Gemini Models (Text Output Only)
    | "gemini-1.5-pro"
    | "gemini-1.5-flash"
    | "gemini-2.0-flash-exp"
    | "gemini-2.0-flash"
    | "gemini-2.0-pro"
    | "gemini-2.0-flash-lite"
    | "gemini-2.0-flash-live"
    | "gemini-2.5-flash"
    | "gemini-2.5-pro"
    | "gemini-2.5-flash-lite"

    
    // OpenAI Models
    | "gpt-4o"
    | "gpt-4o-mini"
    | "gpt-4-turbo"
    | "gpt-4"
    | "gpt-3.5-turbo"
    
    // Anthropic Claude Models
    | "claude-3-5-sonnet"
    | "claude-3-5-haiku"
    | "claude-3-opus"
    | "claude-3-sonnet"
    | "claude-3-haiku"
    | "claude-2.1"
    | "claude-2.0"
    | "claude-instant-1.2"
    
    // DeepSeek Models
    | "deepseek-chat"
    | "deepseek-reasoner"
    | "deepseek-coder"
    
    // Groq Models (Fast Inference)
    | "llama-3.1-8b-instant"
    | "llama-3.1-70b-versatile"
    | "llama-3.3-70b-versatile"
    | "mixtral-8x7b-32768"
    | "gemma2-9b-it"
    | "llama-3.1-8b"
    | "llama-3.1-70b"
    | "llama-3.3-70b"
    
    // Mistral Models
    | "mistral-large-latest"
    | "mistral-medium-latest"
    | "mistral-small-latest"
    | "mistral-7b-instruct"
    
    // Together.ai Models
    | "meta-llama/llama-3.1-8b-instruct"
    | "meta-llama/llama-3.1-70b-instruct"
    | "meta-llama/llama-3.3-70b-instruct"
    
    // Cohere Models
    | "command-r-plus"
    | "command-r"
    | "command-light"
    
    // Perplexity Models
    | "llama-3.1-8b-instruct"
    | "llama-3.1-70b-instruct"
    | "mixtral-8x7b-instruct"
    
    // Fireworks Models
    | "fireworks-llama-3.1-8b-instruct"
    | "fireworks-llama-3.1-70b-instruct"
    | "fireworks-mixtral-8x7b-instruct"
    
    // Hugging Face Models
    | "huggingface-endpoint"
    | "huggingface-model"
    | "huggingface-streaming"
    | "huggingface-provider"
    
    // Custom Models
    | "local-custom"
    | "ollama-local"
    | "lmstudio-local"
    | "openai-like-local"
    | "lingo-ai";
  
  
  // Cover Letter Types
  export interface CoverLetterData {
    head: string
    body: string
    footer: string
  }
  
  // Derive CoverLetterTemplate type from coverLetterTemplates keys
  export type CoverLetterTemplate = keyof typeof coverLetterTemplates