import { GoogleGenerativeAI } from "@google/generative-ai"
import { createUIMessageStream, createUIMessageStreamResponse, generateId } from "ai"
import { InferenceClient } from "@huggingface/inference"
import type { NextRequest } from "next/server"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Define available models
const AVAILABLE_MODELS = {
  "gemini-2.5-flash": {
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  "gemini-2.5-flash-lite": {
    provider: "google",
    modelId: "gemini-2.5-flash-lite",
  },
  "gemini-2.5-pro": {
    provider: "google",
    modelId: "gemini-2.5-pro",
  },
  "gemini-1.5-pro": {
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  "gemini-1.5-flash": {
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  "gemini-2.0-flash": {
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  "gemini-2.0-flash-001": {
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  "gemini-2.0-flash-thinking-exp-01-21": {
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  "gemini-2.0-pro": {
    provider: "google",
    modelId: "gemini-2.5-flash",
  },
  
  // Hugging Face Models
  "huggingface-endpoint": {
    provider: "huggingface",
    modelId: "endpoint",
  },
  "huggingface-model": {
    provider: "huggingface",
    modelId: "model",
  },
  "huggingface-streaming": {
    provider: "huggingface",
    modelId: "streaming",
  },
  "huggingface-provider": {
    provider: "huggingface",
    modelId: "provider",
  },
  
  // GPT Models
  "gpt-4": {
    provider: "openai",
    modelId: "gpt-4",
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    modelId: "gpt-3.5-turbo",
  },

  // Claude Models
  "claude-1": {
    provider: "anthropic",
    modelId: "claude-1",
  },
  "claude-2": {
    provider: "anthropic",
    modelId: "claude-2",
  },
  "claude-3": {
    provider: "anthropic",
    modelId: "claude-3",
  },

  // Deep Seek Models
  "deep-seek-v1": {
    provider: "deepseek",
    modelId: "deep-seek-v1",
  },
  "deep-seek-v2": {
    provider: "deepseek",
    modelId: "deep-seek-v2",
  },
};

// Default model if none specified
const DEFAULT_MODEL = "gemini-2.5-flash"

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

Current cover letter data: ${JSON.stringify(coverLetterData || {})}

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
    const key =
      apiKey ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      process.env.GOOGLE_API_KEY
    if (!key) {
      throw new Error("Google Gemini API key is required. Please provide it in the UI or set GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY environment variable.")
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

function handleQuotaExceeded(clientMessages?: unknown[]) {
  const mockResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
  const textId = generateId()
  const stream = createUIMessageStream({
    originalMessages: (clientMessages ?? []) as Parameters<typeof createUIMessageStream>[0]["originalMessages"],
    execute: async ({ writer }) => {
      writer.write({ type: "text-start", id: textId })
      const chunks = mockResponse.split(". ")
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i] + (i < chunks.length - 1 ? ". " : " ")
        writer.write({ type: "text-delta", id: textId, delta: chunk })
        await new Promise((r) => setTimeout(r, 100))
      }
      writer.write({ type: "text-end", id: textId })
    },
  })
  return createUIMessageStreamResponse({ stream })
}

// Hugging Face handler
async function handleWithHuggingFace(messages: any[], modelId: string, req: Request, apiKey?: string, customModel?: string, customEndpoint?: string, customHeaders?: string) {
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
            content: msg.content,
          })),
          max_tokens: 4096,
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
            content: msg.content,
          })),
          max_tokens: 4096,
        })
        
        const modelContent = modelResponse.choices[0]?.message?.content || "No response generated"
        return new Response(modelContent, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        })
        
      case "streaming":
        // Streaming chat completion API
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder()
            
            try {
              for await (const chunk of client.chatCompletionStream({
                model: model,
                messages: messages.map(msg => ({
                  role: msg.role === "assistant" ? "assistant" : "user",
                  content: msg.content,
                })),
                max_tokens: 4096,
              })) {
                const content = chunk.choices[0]?.delta?.content
                if (content) {
                  controller.enqueue(encoder.encode(content))
                }
              }
              controller.close()
            } catch (error) {
              console.error("Error streaming from Hugging Face:", error)
              controller.error(error)
            }
          },
        })
        
        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
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
            content: msg.content,
          })),
          max_tokens: 4096,
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
