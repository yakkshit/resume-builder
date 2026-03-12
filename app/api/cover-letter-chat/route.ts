import { GoogleGenerativeAI } from "@google/generative-ai"
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from "ai"
import { InferenceClient } from "@huggingface/inference"
import type { NextRequest } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Define available models
import { CHAT_MODELS_BY_PROVIDER } from "@/lib/chat-models"
import { redactTextPII } from "@/lib/redact-resume-pii"

// Reconstruct a flat map of AVAILABLE_MODELS for fast lookup
const AVAILABLE_MODELS = Object.entries(CHAT_MODELS_BY_PROVIDER).reduce((acc, [providerName, modelIds]) => {
  // Provider mapping for internal handling
  let internalProvider = "google"
  if (providerName === "Cedz") internalProvider = "cedz"
  else if (providerName === "Lingo AI") internalProvider = "lingo-ai"
  else if (providerName === "OpenAI") internalProvider = "openai"
  else if (providerName === "Anthropic Claude") internalProvider = "anthropic"
  else if (providerName === "DeepSeek") internalProvider = "deepseek"
  else if (providerName === "Groq") internalProvider = "groq"
  else if (providerName === "Mistral") internalProvider = "mistral"
  else if (providerName === "Hugging Face") internalProvider = "huggingface"
  else if (providerName === "Local / Custom") internalProvider = "local" // Will be overridden in specific handlers

  for (const modelId of modelIds) {
    // Basic local overrides
    let mappedProvider = internalProvider
    if (modelId === "ollama-local") mappedProvider = "ollama"
    if (modelId === "lmstudio-local") mappedProvider = "lmstudio"
    if (modelId === "openai-like-local") mappedProvider = "openai-like"

    acc[modelId] = {
      provider: mappedProvider,
      modelId: modelId,
    }
  }
  return acc
}, {} as Record<string, { provider: string; modelId: string }>)

// Default model if none specified
const DEFAULT_MODEL = "gemini-1.5-pro"

// Mock response for when API quota is exceeded
const MOCK_RESPONSES = [
  "I'm sorry, but I can't process your request right now due to API quota limitations. Here are some general cover letter tips:\n\n1. Tailor your cover letter to each job application\n2. Use a professional tone and format\n3. Highlight relevant skills and experiences\n4. Show enthusiasm for the role and company\n5. Keep it concise and focused",
  "Due to high demand, I can't access the AI service right now. Consider these cover letter improvements:\n\n- Make your opening paragraph more engaging by mentioning specific details about the company\n- In the body, focus on how your skills and experiences align with the job requirements\n- End with a strong call to action that expresses your interest in an interview",
  "API quota exceeded. While I can't analyze your specific cover letter right now, here are universal cover letter tips:\n\n- Address the letter to a specific person whenever possible\n- Avoid generic language and clichés\n- Quantify your achievements with numbers when possible\n- Proofread carefully for errors\n- Keep it to one page",
]

export async function POST(req: NextRequest) {
  const { messages, coverLetterData, jobDescription, model, apiKey, attachedData, customModel, customEndpoint, customHeaders } = await req.json()

  // Create a system message
  let systemMessage = `You are an AI cover letter assistant that helps users create and improve their cover letters.

The user has provided their cover letter data and possibly a job description. Your task is to suggest improvements to their cover letter to better match the job requirements and make it more effective.

When suggesting changes, provide specific recommendations for each section (head, body, footer) and explain why these changes would be beneficial.

IMPORTANT: When suggesting specific text changes, you MUST format them as JSON within triple backticks like this:
\`\`\`json
{
  "head": "Updated header text here...",
  "body": "Updated body text here...",
  "footer": "Updated footer text here..."
}
\`\`\`

Only include the fields that you're suggesting changes for. The user can apply these changes with a button.
Make sure your JSON is valid and properly formatted with double quotes around property names.
Never include the user's real email, phone, or address in your suggestions - use placeholders like [email] if needed.

Current cover letter data (PII redacted): ${JSON.stringify(
  coverLetterData && typeof coverLetterData === "object"
    ? {
        ...coverLetterData,
        head: redactTextPII((coverLetterData as Record<string, unknown>).head as string),
        body: redactTextPII((coverLetterData as Record<string, unknown>).body as string),
        footer: redactTextPII((coverLetterData as Record<string, unknown>).footer as string),
      }
    : {},
)}

Job description: ${jobDescription || "Not provided"}`

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

  // Format the conversation for the AI
  const messagesList = Array.isArray(messages) ? messages : []
  const formattedMessages = [{ role: "system", content: systemMessage }, ...messagesList]

  // Get the model configuration or use default
  const modelConfig = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS] || AVAILABLE_MODELS[DEFAULT_MODEL]

  try {
    // Route to the appropriate provider handler
    switch (modelConfig.provider) {
      case "google":
        try {
          return await handleWithGemini(formattedMessages, modelConfig.modelId, apiKey, messagesList)
        } catch (error: any) {
          console.error("Error with Gemini model:", error)

          // Check if it's a quota exceeded error (429)
          if (error.message && error.message.includes("429") && error.message.includes("quota")) {
            return handleQuotaExceeded(messagesList)
          }

          // For other errors, return a generic error message
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
        
      case "huggingface":
        try {
          return await handleWithHuggingFace(formattedMessages, modelConfig.modelId, req, apiKey, customModel, customEndpoint, customHeaders)
        } catch (error: any) {
          console.error("Error with Hugging Face model:", error)
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

      case "local":
        try {
          return await handleWithLocal(formattedMessages, modelConfig.modelId, apiKey, customEndpoint, customModel, customHeaders)
        } catch (error: any) {
          console.error("Error with Local model:", error)
          throw error
        }

      case "ollama":
        try {
          return await handleWithOllama(formattedMessages, modelConfig.modelId, apiKey, customEndpoint, customModel)
        } catch (error: any) {
          console.error("Error with Ollama model:", error)
          throw error
        }

      case "lmstudio":
        try {
          return await handleWithLMStudio(formattedMessages, modelConfig.modelId, apiKey, customEndpoint, customModel)
        } catch (error: any) {
          console.error("Error with LM Studio model:", error)
          throw error
        }

      case "openai-like":
        try {
          return await handleWithOpenAILike(formattedMessages, modelConfig.modelId, apiKey, customEndpoint, customModel)
        } catch (error: any) {
          console.error("Error with OpenAI-like model:", error)
          throw error
        }

      case "lingo-ai":
        try {
          return await handleWithLingoAI(formattedMessages, modelConfig.modelId, apiKey, customModel)
        } catch (error: any) {
          console.error("Error with Lingo AI model:", error)
          throw error
        }

      case "cedz":
        try {
          return await handleWithCedz(formattedMessages, (modelConfig.modelId === "cedz" && customModel?.trim()) ? customModel.trim() : modelConfig.modelId === "cedz" ? "qwen3:8b" : modelConfig.modelId, customEndpoint, messagesList)
        } catch (error: any) {
          console.error("Error with Cedz model:", error)
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

async function handleWithGemini(messages: any[], modelId: string, apiKey?: string, clientMessages?: unknown[]) {
  try {
    const key = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (!key) {
      throw new Error("Google Gemini API key is required. Please provide it in the UI or set GOOGLE_API_KEY or GEMINI_API_KEY environment variable.")
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(key)

    // Create a Gemini model instance
    const gemini = genAI.getGenerativeModel({ model: modelId })

    // Convert messages to Gemini format (support both v4 content and v5 parts)
    const getText = (m: { content?: string; parts?: Array<{ type: string; text?: string }> }) =>
      m.parts?.filter((p): p is { type: "text"; text: string } => p.type === "text").map((p) => p.text).join("") ?? m.content ?? ""
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: getText(msg) }],
    }))

    // Start a chat session
    const chat = gemini.startChat({
      history: geminiMessages.slice(0, -1),
      generationConfig: {
        maxOutputTokens: 8192,
      },
    })

    // Get the last message to send
    const lastMessage = geminiMessages[geminiMessages.length - 1]
    const result = await chat.sendMessageStream(lastMessage.parts[0].text)

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
  } catch (error) {
    console.error("Error with Gemini model:", error)
    throw error
  }
}

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

import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'

// Anthropic handler (Messages API with streaming)
async function handleWithAnthropic(messages: any[], modelId: string, apiKey?: string) {
  try {
    const key = apiKey || process.env.ANTHROPIC_API_KEY
    if (!key) {
      throw new Error("Anthropic API key is required. Please provide it in the UI or set ANTHROPIC_API_KEY environment variable.")
    }

    const systemContent = (() => { const m = messages.find((x) => x.role === "system"); return m ? getMsgText(m) : undefined })()
    const chatMessages = messages.filter((m) => m.role !== "system").map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: getMsgText(msg),
    })) as import('ai').ModelMessage[]

    const anthropicProvider = createAnthropic({ apiKey: key })

    const result = await streamText({
      model: anthropicProvider(modelId),
      system: systemContent,
      messages: chatMessages,
    })

    return result.toTextStreamResponse()
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
  req: Request,
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
