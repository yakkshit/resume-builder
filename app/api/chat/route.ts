import { GoogleGenerativeAI } from "@google/generative-ai"
import { InferenceClient } from "@huggingface/inference"
import { GoogleGenAI } from "@google/genai"
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from 'ai'
import mime from "mime"
import type { NextRequest } from "next/server"
import { requireApiKey } from "@/lib/api-auth"

/** Extract text from message (supports v4 content and v5 parts) */
const getMsgText = (m: { content?: string; parts?: Array<{ type: string; text?: string }> }) =>
  m.parts?.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("") ?? m.content ?? ""

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

  // Google Gemini — core + preview (2026)
  "gemini-3-flash-preview": { provider: "google", modelId: "gemini-3-flash-preview" },
  "gemini-3-pro-preview": { provider: "google", modelId: "gemini-3-pro-preview" },
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

  // OpenAI (core + 2026 roadmap IDs; newer may resolve to latest)
  "gpt-5": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.2": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.2-instant": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.3-codex": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-5.3-codex-spark": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4o": { provider: "openai", modelId: "gpt-4o", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4o-mini": { provider: "openai", modelId: "gpt-4o-mini", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4-turbo": { provider: "openai", modelId: "gpt-4-turbo", apiKey: process.env.OPENAI_API_KEY },
  "gpt-4": { provider: "openai", modelId: "gpt-4-turbo", apiKey: process.env.OPENAI_API_KEY },
  "gpt-3.5-turbo": { provider: "openai", modelId: "gpt-3.5-turbo", apiKey: process.env.OPENAI_API_KEY },

  // Anthropic Claude (4.x/5 + legacy; newer slugs may need API model IDs)
  "claude-opus-4.6": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-opus-4.5": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-sonnet-5": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-sonnet-4.5": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-haiku-4.5": { provider: "anthropic", modelId: "claude-3-5-haiku-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-5-sonnet": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-5-haiku": { provider: "anthropic", modelId: "claude-3-5-haiku-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-opus": { provider: "anthropic", modelId: "claude-3-opus-20240229", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-sonnet": { provider: "anthropic", modelId: "claude-3-5-sonnet-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-3-haiku": { provider: "anthropic", modelId: "claude-3-5-haiku-20241022", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-2.1": { provider: "anthropic", modelId: "claude-2.1", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-2.0": { provider: "anthropic", modelId: "claude-2.0", apiKey: process.env.ANTHROPIC_API_KEY },
  "claude-instant-1.2": { provider: "anthropic", modelId: "claude-instant-1.2", apiKey: process.env.ANTHROPIC_API_KEY },

  // DeepSeek
  "deepseek-chat": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-reasoner": { provider: "deepseek", modelId: "deepseek-reasoner", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-coder": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-coder-v2": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },
  "deepseek-coder-v2-lite": { provider: "deepseek", modelId: "deepseek-chat", apiKey: process.env.DEEPSEEK_API_KEY },

  // Groq
  "llama-3.1-8b-instant": { provider: "groq", modelId: "llama-3.1-8b-instant", apiKey: process.env.GROQ_API_KEY },
  "llama-3.1-70b-versatile": { provider: "groq", modelId: "llama-3.1-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "llama-3.3-70b-versatile": { provider: "groq", modelId: "llama-3.3-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "mixtral-8x7b-32768": { provider: "groq", modelId: "mixtral-8x7b-32768", apiKey: process.env.GROQ_API_KEY },
  "gemma2-9b-it": { provider: "groq", modelId: "gemma2-9b-it", apiKey: process.env.GROQ_API_KEY },
  "llama-3.1-8b": { provider: "groq", modelId: "llama-3.1-8b-instant", apiKey: process.env.GROQ_API_KEY },
  "llama-3.1-70b": { provider: "groq", modelId: "llama-3.1-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "llama-3.3-70b": { provider: "groq", modelId: "llama-3.3-70b-versatile", apiKey: process.env.GROQ_API_KEY },
  "llama3-70b-8192": { provider: "groq", modelId: "llama3-70b-8192", apiKey: process.env.GROQ_API_KEY },

  // Mistral (3.x + mini/magistral/devstral)
  "mistral-large-3": { provider: "mistral", modelId: "mistral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-medium-3.1": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-small-3.2": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-medium-3": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-small-3.1": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "ministral-3-14b": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "ministral-3-8b": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "ministral-3-3b": { provider: "mistral", modelId: "mistral-7b-instruct", apiKey: process.env.MISTRAL_API_KEY },
  "magistral-medium-1.2": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "magistral-small-1.2": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "devstral-2": { provider: "mistral", modelId: "mistral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
  "devstral-medium-1.0": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "devstral-small-2": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-large-latest": { provider: "mistral", modelId: "mistral-large-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-medium-latest": { provider: "mistral", modelId: "mistral-medium-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-small-latest": { provider: "mistral", modelId: "mistral-small-latest", apiKey: process.env.MISTRAL_API_KEY },
  "mistral-7b-instruct": { provider: "mistral", modelId: "mistral-7b-instruct", apiKey: process.env.MISTRAL_API_KEY },

  // Together.ai
  "meta-llama/llama-3.1-8b-instruct": { provider: "together", modelId: "meta-llama/Llama-3.1-8B-Instruct-Turbo", apiKey: process.env.TOGETHER_API_KEY },
  "meta-llama/llama-3.1-70b-instruct": { provider: "together", modelId: "meta-llama/Llama-3.1-70B-Instruct-Turbo", apiKey: process.env.TOGETHER_API_KEY },
  "meta-llama/llama-3.3-70b-instruct": { provider: "together", modelId: "meta-llama/Llama-3.3-70B-Instruct-Turbo", apiKey: process.env.TOGETHER_API_KEY },

  // Cohere
  "command-r-plus": { provider: "cohere", modelId: "command-r-plus", apiKey: process.env.COHERE_API_KEY },
  "command-r": { provider: "cohere", modelId: "command-r", apiKey: process.env.COHERE_API_KEY },
  "command-light": { provider: "cohere", modelId: "command-light", apiKey: process.env.COHERE_API_KEY },

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

  // Local / Custom
  "local-custom": { provider: "local", modelId: "local-custom" },
  "ollama-local": { provider: "ollama", modelId: "ollama" },
  "lmstudio-local": { provider: "lmstudio", modelId: "lmstudio" },
  "openai-like-local": { provider: "openai-like", modelId: "openai-like" },
};


// Default model if none specified (efficient for resume/cover letter)
const DEFAULT_MODEL = "gemini-2.0-flash"

// Mock response for when API quota is exceeded
const MOCK_RESPONSES = [
  "I'm sorry, but I can't process your request right now due to API quota limitations. Here are some general resume tips:\n\n1. Tailor your resume to each job application\n2. Use action verbs and quantify achievements\n3. Keep it concise and focused on relevant experience\n4. Proofread carefully for errors\n5. Include keywords from the job description",
  "Due to high demand, I can't access the AI service right now. Consider these resume improvements:\n\n- Make your summary more impactful by focusing on your unique value proposition\n- Ensure your skills section highlights both technical and soft skills relevant to the position\n- For each work experience, focus on achievements rather than just responsibilities",
  "API quota exceeded. While I can't analyze your specific resume right now, here are universal resume tips:\n\n- Use a clean, professional layout with consistent formatting\n- Place the most relevant information at the top\n- Use bullet points for better readability\n- Include metrics and specific results when possible\n- Remove outdated or irrelevant information",
]

// Update the POST function to handle attachedData
export async function POST(req: NextRequest) {
  const auth = requireApiKey(req)
  if (auth) return auth

  const { messages, resumeData, aiMode, model, apiKey, attachedData, attachedFiles, contextText, customModel, customEndpoint, customHeaders, customAuth } = await req.json()

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
  if (contextText && contextText.trim()) {
    systemMessage += `\n\nUser Context: ${contextText.trim()}`
  }





  // Format the conversation for the AI
  const messagesList = Array.isArray(messages) ? messages : []
  const formattedMessages = [{ role: "system", content: systemMessage }, ...messagesList]

  // Resolve model: use selected if available, else default
  const modelConfig = (model && AVAILABLE_MODELS[model]) ? AVAILABLE_MODELS[model] : AVAILABLE_MODELS[DEFAULT_MODEL]
  if (!modelConfig) {
    return new Response(JSON.stringify({ error: "Invalid model", message: "Selected model is not configured." }), { status: 400, headers: { "Content-Type": "application/json" } })
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
          return await handleWithHuggingFace(
            formattedMessages,
            modelConfig.modelId,
            apiKey,
            customModel,
            customEndpoint,
            customHeaders,
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
            customAuth,
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
          )
        } catch (error: any) {
          console.error("Error with OpenAI-like model:", error)
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

      default:
        throw new Error(`Unsupported model provider: ${modelConfig.provider}`)
    }
  } catch (error) {
    console.error("Error generating response:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to generate response",
        message: "There was an error processing your request. Please try again later.",
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
    const key = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!key) {
      throw new Error("Google Gemini API key is required. Please provide it in the UI or set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
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
    const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
    if (!key) {
      throw new Error("Google Gemini API key is required. Please provide it in the UI or set GEMINI_API_KEY or GOOGLE_API_KEY environment variable.")
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
) {
  try {
    // Get the model name from UI configuration or use default
    const model = customModel || "meta-llama/Llama-3.1-8B-Instruct"

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
          content: getMsgText(msg),
        })),
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI-like API error: ${response.status}`)
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
    console.error("Error with OpenAI-like model:", error)
    throw error
  }
}

// Lingo AI handler
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