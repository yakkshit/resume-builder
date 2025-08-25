import { GoogleGenerativeAI } from "@google/generative-ai"
import { InferenceClient } from "@huggingface/inference"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Define available models with their providers and configurations
const AVAILABLE_MODELS = {
  // Google Gemini Models (Latest)
  "gemini-2.0-flash-exp": {
    provider: "google",
    modelId: "gemini-2.0-flash-exp",
    apiKey: process.env.GOOGLE_API_KEY,
  },
  "gemini-2.0-flash": {
    provider: "google",
    modelId: "gemini-2.0-flash",
    apiKey: process.env.GOOGLE_API_KEY,
  },
  "gemini-2.0-pro": {
    provider: "google",
    modelId: "gemini-2.0-pro",
    apiKey: process.env.GOOGLE_API_KEY,
  },
  "gemini-2.0-flash-lite": {
    provider: "google",
    modelId: "gemini-2.0-flash-lite",
    apiKey: process.env.GOOGLE_API_KEY,
  },
  "gemini-2.5-flash": {
    provider: "google",
    modelId: "gemini-2.5-flash",
    apiKey: process.env.GOOGLE_API_KEY,
  },
  "gemini-2.5-pro": {
    provider: "google",
    modelId: "gemini-2.5-pro",
    apiKey: process.env.GOOGLE_API_KEY,
  },
  "gemini-2.5-flash-lite": {
    provider: "google",
    modelId: "gemini-2.5-flash-lite",
    apiKey: process.env.GOOGLE_API_KEY,
  },


  // OpenAI Models
  "gpt-4o": {
    provider: "openai",
    modelId: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
  },
  "gpt-4o-mini": {
    provider: "openai",
    modelId: "gpt-4o-mini",
    apiKey: process.env.OPENAI_API_KEY,
  },
  "gpt-4-turbo": {
    provider: "openai",
    modelId: "gpt-4-turbo-preview",
    apiKey: process.env.OPENAI_API_KEY,
  },
  "gpt-4": {
    provider: "openai",
    modelId: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY,
  },
  "gpt-3.5-turbo": {
    provider: "openai",
    modelId: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
  },

  // Anthropic Claude Models
  "claude-3-5-sonnet": {
    provider: "anthropic",
    modelId: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  "claude-3-5-haiku": {
    provider: "anthropic",
    modelId: "claude-3-5-haiku-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  "claude-3-opus": {
    provider: "anthropic",
    modelId: "claude-3-opus-20240229",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  "claude-3-sonnet": {
    provider: "anthropic",
    modelId: "claude-3-sonnet-20240229",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  "claude-3-haiku": {
    provider: "anthropic",
    modelId: "claude-3-haiku-20240307",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  "claude-2.1": {
    provider: "anthropic",
    modelId: "claude-2.1",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  "claude-2.0": {
    provider: "anthropic",
    modelId: "claude-2.0",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
  "claude-instant-1.2": {
    provider: "anthropic",
    modelId: "claude-instant-1.2",
    apiKey: process.env.ANTHROPIC_API_KEY,
  },

  // DeepSeek Models
  "deepseek-chat": {
    provider: "deepseek",
    modelId: "deepseek-chat",
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  "deepseek-reasoner": {
    provider: "deepseek",
    modelId: "deepseek-reasoner",
    apiKey: process.env.DEEPSEEK_API_KEY,
  },
  "deepseek-coder": {
    provider: "deepseek",
    modelId: "deepseek-coder",
    apiKey: process.env.DEEPSEEK_API_KEY,
  },

  // Groq Models (Fast Inference)
  "llama-3.1-8b-instant": {
    provider: "groq",
    modelId: "llama3-8b-8192",
    apiKey: process.env.GROQ_API_KEY,
  },
  "llama-3.1-70b-versatile": {
    provider: "groq",
    modelId: "llama3-70b-8192",
    apiKey: process.env.GROQ_API_KEY,
  },
  "llama-3.3-70b-versatile": {
    provider: "groq",
    modelId: "llama3.3-70b-8192",
    apiKey: process.env.GROQ_API_KEY,
  },
  "mixtral-8x7b-32768": {
    provider: "groq",
    modelId: "mixtral-8x7b-32768",
    apiKey: process.env.GROQ_API_KEY,
  },
  "gemma2-9b-it": {
    provider: "groq",
    modelId: "gemma2-9b-it",
    apiKey: process.env.GROQ_API_KEY,
  },
  "llama-3.1-8b": {
    provider: "groq",
    modelId: "llama3-8b-8192",
    apiKey: process.env.GROQ_API_KEY,
  },
  "llama-3.1-70b": {
    provider: "groq",
    modelId: "llama3-70b-8192",
    apiKey: process.env.GROQ_API_KEY,
  },
  "llama-3.3-70b": {
    provider: "groq",
    modelId: "llama3.3-70b-8192",
    apiKey: process.env.GROQ_API_KEY,
  },

  // Hugging Face Models
  "huggingface-endpoint": {
    provider: "huggingface",
    modelId: "endpoint",
    apiKey: process.env.HUGGINGFACE_API_KEY,
  },
  "huggingface-model": {
    provider: "huggingface",
    modelId: "model",
    apiKey: process.env.HUGGINGFACE_API_KEY,
  },
  "huggingface-streaming": {
    provider: "huggingface",
    modelId: "streaming",
    apiKey: process.env.HUGGINGFACE_API_KEY,
  },
  "huggingface-provider": {
    provider: "huggingface",
    modelId: "provider",
    apiKey: process.env.HUGGINGFACE_API_KEY,
  },

  // Local Models
  "local-custom": {
    provider: "local",
    modelId: "custom",
    apiKey: undefined,
  },
  "ollama-local": {
    provider: "ollama",
    modelId: "custom",
    apiKey: undefined,
  },
  "lmstudio-local": {
    provider: "lmstudio",
    modelId: "custom",
    apiKey: undefined,
  },
  "openai-like-local": {
    provider: "openai-like",
    modelId: "custom",
    apiKey: undefined,
  },
  "lingo-ai": {
    provider: "lingo-ai",
    modelId: "resume-model-v1",
    apiKey: undefined,
  },

  // Mistral Models
  "mistral-large-latest": {
    provider: "mistral",
    modelId: "mistral-large-latest",
    apiKey: process.env.MISTRAL_API_KEY,
  },
  "mistral-medium-latest": {
    provider: "mistral",
    modelId: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY,
  },
  "mistral-small-latest": {
    provider: "mistral",
    modelId: "mistral-small-latest",
    apiKey: process.env.MISTRAL_API_KEY,
  },
  "mistral-7b-instruct": {
    provider: "mistral",
    modelId: "mistral-7b-instruct",
    apiKey: process.env.MISTRAL_API_KEY,
  },

  // Together.ai Models
  "meta-llama/llama-3.1-8b-instruct": {
    provider: "together",
    modelId: "meta-llama/llama-3.1-8b-instruct",
    apiKey: process.env.TOGETHER_API_KEY,
  },
  "meta-llama/llama-3.1-70b-instruct": {
    provider: "together",
    modelId: "meta-llama/llama-3.1-70b-instruct",
    apiKey: process.env.TOGETHER_API_KEY,
  },
  "meta-llama/llama-3.3-70b-instruct": {
    provider: "together",
    modelId: "meta-llama/llama-3.3-70b-instruct",
    apiKey: process.env.TOGETHER_API_KEY,
  },

  // Cohere Models
  "command-r-plus": {
    provider: "cohere",
    modelId: "command-r-plus",
    apiKey: process.env.COHERE_API_KEY,
  },
  "command-r": {
    provider: "cohere",
    modelId: "command-r",
    apiKey: process.env.COHERE_API_KEY,
  },
  "command-light": {
    provider: "cohere",
    modelId: "command-light",
    apiKey: process.env.COHERE_API_KEY,
  },

  // Perplexity Models
  "llama-3.1-8b-instruct": {
    provider: "perplexity",
    modelId: "llama-3.1-8b-instruct",
    apiKey: process.env.PERPLEXITY_API_KEY,
  },
  "llama-3.1-70b-instruct": {
    provider: "perplexity",
    modelId: "llama-3.1-70b-instruct",
    apiKey: process.env.PERPLEXITY_API_KEY,
  },
  "mixtral-8x7b-instruct": {
    provider: "perplexity",
    modelId: "mixtral-8x7b-instruct",
    apiKey: process.env.PERPLEXITY_API_KEY,
  },

  // Fireworks Models
  "fireworks-llama-3.1-8b-instruct": {
    provider: "fireworks",
    modelId: "llama-3.1-8b-instruct",
    apiKey: process.env.FIREWORKS_API_KEY,
  },
  "fireworks-llama-3.1-70b-instruct": {
    provider: "fireworks",
    modelId: "llama-3.1-70b-instruct",
    apiKey: process.env.FIREWORKS_API_KEY,
  },
  "fireworks-mixtral-8x7b-instruct": {
    provider: "fireworks",
    modelId: "mixtral-8x7b-instruct",
    apiKey: process.env.FIREWORKS_API_KEY,
  },
};


// Default model if none specified
const DEFAULT_MODEL = "lingo-ai"

// Mock response for when API quota is exceeded
const MOCK_RESPONSES = [
  "I'm sorry, but I can't process your request right now due to API quota limitations. Here are some general resume tips:\n\n1. Tailor your resume to each job application\n2. Use action verbs and quantify achievements\n3. Keep it concise and focused on relevant experience\n4. Proofread carefully for errors\n5. Include keywords from the job description",
  "Due to high demand, I can't access the AI service right now. Consider these resume improvements:\n\n- Make your summary more impactful by focusing on your unique value proposition\n- Ensure your skills section highlights both technical and soft skills relevant to the position\n- For each work experience, focus on achievements rather than just responsibilities",
  "API quota exceeded. While I can't analyze your specific resume right now, here are universal resume tips:\n\n- Use a clean, professional layout with consistent formatting\n- Place the most relevant information at the top\n- Use bullet points for better readability\n- Include metrics and specific results when possible\n- Remove outdated or irrelevant information",
]

// Update the POST function to handle attachedData
export async function POST(req: Request) {
  const { messages, resumeData, aiMode, jobDescription, model, apiKey, attachedData, attachedFiles, contextText, customModel, customEndpoint, customHeaders, customAuth } = await req.json()

  // Create a system message based on the mode
  let systemMessage = ""

  if (aiMode) {
    systemMessage = `You are an AI resume assistant that helps users tailor their resumes for specific job descriptions. 
  
  The user has provided their resume data and a job description. Your task is to suggest improvements to their resume to better match the job requirements.
  
  When suggesting changes, provide specific recommendations for each section (summary, experience, skills, etc.) and explain why these changes would be beneficial.
  
  IMPORTANT: When suggesting specific text changes, you MUST format them as JSON within triple backticks like this:
  \`\`\`json
  {
    "basicInfo": {
      "summary": "Updated summary text here..."
    },
    "skills": ["Added Skill 1", "Added Skill 2"]
  }
  \`\`\`
  
  Only include the fields that you're suggesting changes for. The user can apply these changes with a button.
  Make sure your JSON is valid and properly formatted with double quotes around property names.
  
  Current resume data: ${JSON.stringify(resumeData)}
  
  Job description: ${jobDescription || "Not provided"}`
  } else {
    systemMessage = `You are an AI resume assistant that helps users with their resumes.
  
  The user has provided their resume data. Your task is to answer any questions they have about their resume, provide suggestions for improvement, or help with formatting issues.
  
  When suggesting specific text changes, you MUST format them as JSON within triple backticks like this:
  \`\`\`json
  {
    "basicInfo": {
      "summary": "Updated summary text here..."
    },
    "skills": ["Added Skill 1", "Added Skill 2"]
  }
  \`\`\`
  
  Current resume data: ${JSON.stringify(resumeData)}`
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
  const formattedMessages = [{ role: "system", content: systemMessage }, ...messages]

  // Get the model configuration or use default
  const modelConfig = AVAILABLE_MODELS[model as keyof typeof AVAILABLE_MODELS] || AVAILABLE_MODELS[DEFAULT_MODEL]

  try {
    // Route to the appropriate provider handler
    switch (modelConfig.provider) {
      case "google":
        try {
          return await handleWithGemini(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Gemini model:", error)
          if (error.message && error.message.includes("429") && error.message.includes("quota")) {
            return handleQuotaExceeded()
          }
          throw error
        }
        
      case "openai":
        try {
          return await handleWithOpenAI(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with OpenAI model:", error)
          throw error
        }
        
      case "anthropic":
        try {
          return await handleWithAnthropic(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Anthropic model:", error)
          throw error
        }
        
      case "deepseek":
        try {
          return await handleWithDeepSeek(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with DeepSeek model:", error)
          throw error
        }
        
      case "groq":
        try {
          return await handleWithGroq(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Groq model:", error)
          throw error
        }
        
      case "mistral":
        try {
          return await handleWithMistral(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Mistral model:", error)
          throw error
        }
        
      case "together":
        try {
          return await handleWithTogether(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Together.ai model:", error)
          throw error
        }
        
      case "cohere":
        try {
          return await handleWithCohere(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Cohere model:", error)
          throw error
        }
        
      case "perplexity":
        try {
          return await handleWithPerplexity(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Perplexity model:", error)
          throw error
        }
        
      case "fireworks":
        try {
          return await handleWithFireworks(formattedMessages, modelConfig.modelId, apiKey || modelConfig.apiKey)
        } catch (error: any) {
          console.error("Error with Fireworks model:", error)
          throw error
        }
        
      case "huggingface":
        try {
          return await handleWithHuggingFace(
            formattedMessages,
            modelConfig.modelId,
            apiKey || modelConfig.apiKey,
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
            apiKey || modelConfig.apiKey,
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
            apiKey || modelConfig.apiKey,
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
            apiKey || modelConfig.apiKey,
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
            apiKey || modelConfig.apiKey,
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
            apiKey || modelConfig.apiKey,
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

async function handleWithGemini(messages: any[], modelId: string, apiKey?: string) {
  try {
    // Initialize the Gemini API - remove the 'new' keyword
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GOOGLE_API_KEY || "")

    // Create a Gemini model instance
    const gemini = genAI.getGenerativeModel({ model: modelId })

    // Convert messages to Gemini format
    const geminiMessages = messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
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

    // Create a readable stream from the Gemini response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            controller.enqueue(encoder.encode(text))
          }
          controller.close()
        } catch (error) {
          console.error("Error streaming from Gemini:", error)
          controller.error(error)
        }
      },
    })

    // Return the stream as the response
    return new Response(stream)
  } catch (error) {
    console.error("Error with Gemini model:", error)
    throw error
  }
}

// OpenAI handler
async function handleWithOpenAI(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with OpenAI model:", error)
    throw error
  }
}

// Anthropic handler
async function handleWithAnthropic(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey || "",
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with Anthropic model:", error)
    throw error
  }
}

// DeepSeek handler
async function handleWithDeepSeek(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with DeepSeek model:", error)
    throw error
  }
}

// Groq handler
async function handleWithGroq(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with Groq model:", error)
    throw error
  }
}

// Mistral handler
async function handleWithMistral(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with Mistral model:", error)
    throw error
  }
}

// Together.ai handler
async function handleWithTogether(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Together.ai API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with Together.ai model:", error)
    throw error
  }
}

// Cohere handler
async function handleWithCohere(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        message: messages[messages.length - 1].content,
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`)
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
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with Perplexity model:", error)
    throw error
  }
}

// Fireworks handler
async function handleWithFireworks(messages: any[], modelId: string, apiKey?: string) {
  try {
    const response = await fetch("https://api.fireworks.ai/inference/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map(msg => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Fireworks API error: ${response.status}`)
    }

    return new Response(response.body)
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
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Local API error: ${response.status}`)
    }

    return new Response(response.body)
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
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    return new Response(response.body)
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
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.status}`)
    }

    return new Response(response.body)
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
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI-like API error: ${response.status}`)
    }

    return new Response(response.body)
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
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
        stream: true,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      throw new Error(`Lingo AI API error: ${response.status}`)
    }

    return new Response(response.body)
  } catch (error) {
    console.error("Error with Lingo AI model:", error)
    throw error
  }
}

function handleQuotaExceeded() {
  // Select a random mock response
  const mockResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]

  // Create a readable stream from the mock response
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Split the mock response into chunks to simulate streaming
      const chunks = mockResponse.split(". ")

      let i = 0
      const interval = setInterval(() => {
        if (i >= chunks.length) {
          clearInterval(interval)
          controller.close()
          return
        }

        // Add the period back except for the last chunk
        const chunk = chunks[i] + (i < chunks.length - 1 ? "." : "")
        controller.enqueue(encoder.encode(chunk + " "))
        i++
      }, 100) // Stream a chunk every 100ms
    },
  })

  // Return the stream as the response with a 200 status
  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  })
}