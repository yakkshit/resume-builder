import { NextRequest, NextResponse } from "next/server"

/**
 * Real Live API Key & Provider Verification Endpoint
 * Performs an actual lightweight network call to verify credentials and check tier/models.
 */
export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, endpoint } = await req.json()

    if (!provider) {
      return NextResponse.json({ success: false, error: "Provider name is required" }, { status: 400 })
    }

    const key = (apiKey || "").trim().replace(/^["']|["']$/g, "")
    const startTime = Date.now()

    if (!key && provider.toLowerCase() !== "ollama") {
      return NextResponse.json({ success: false, error: `${provider} API key is required` }, { status: 400 })
    }

    switch (provider.toLowerCase()) {
      case "mistral": {
        const res = await fetch("https://api.mistral.ai/v1/models", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
        })
        const latencyMs = Date.now() - startTime

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.message || (res.status === 401 ? "Invalid Mistral API key" : `Mistral verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }

        const data = await res.json().catch(() => ({ data: [] }))
        const modelIds: string[] = (data.data || []).map((m: any) => m.id)
        const hasLarge = modelIds.some((id) => id.includes("large"))
        const tier = hasLarge ? "Paid / Full Tier" : "Standard / Free Tier"

        return NextResponse.json({
          success: true,
          latencyMs,
          tier,
          modelCount: modelIds.length,
          availableModels: modelIds.slice(0, 10),
          message: `Connected to Mistral AI in ${latencyMs}ms (${tier})`,
        })
      }

      case "groq": {
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.error?.message || (res.status === 401 ? "Invalid Groq API key" : `Groq verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Groq in ${latencyMs}ms` })
      }

      case "openai": {
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.error?.message || (res.status === 401 ? "Invalid OpenAI API key" : `OpenAI verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to OpenAI in ${latencyMs}ms` })
      }

      case "google": {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const errMsg = errData.error?.message || (res.status === 400 || res.status === 403 ? "Invalid Google AI API key" : `Google AI verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: errMsg }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Google Gemini in ${latencyMs}ms` })
      }

      case "anthropic": {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "ping" }],
          }),
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.error?.message || (res.status === 401 ? "Invalid Anthropic API key" : `Anthropic verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Anthropic in ${latencyMs}ms` })
      }

      case "deepseek": {
        const res = await fetch("https://api.deepseek.com/models", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.error?.message || (res.status === 401 ? "Invalid DeepSeek API key" : `DeepSeek verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to DeepSeek in ${latencyMs}ms` })
      }

      case "openrouter": {
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.error?.message || "Invalid OpenRouter API key"
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        const data = await res.json().catch(() => ({}))
        return NextResponse.json({
          success: true,
          latencyMs,
          message: `Connected to OpenRouter in ${latencyMs}ms (${data.data?.label || "Active"})`,
        })
      }

      case "xai": {
        const res = await fetch("https://api.x.ai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.error?.message || (res.status === 401 ? "Invalid xAI API key" : `xAI verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to xAI (Grok) in ${latencyMs}ms` })
      }

      case "huggingface": {
        const res = await fetch("https://huggingface.co/api/whoami-v2", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: res.status === 401 ? "Invalid Hugging Face token" : `Hugging Face verification failed (${res.status})` }, { status: 400 })
        }
        const data = await res.json().catch(() => ({}))
        const user = data.name || data.fullname || "Authenticated"
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Hugging Face as ${user} in ${latencyMs}ms` })
      }

      case "tavily": {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: key, query: "career", max_results: 1 }),
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.detail?.error || errData.message || (res.status === 401 ? "Invalid Tavily API key" : `Tavily verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Tavily Web Search in ${latencyMs}ms` })
      }

      case "firecrawl": {
        const res = await fetch("https://api.firecrawl.dev/v1/team/credit-usage", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.error || (res.status === 401 ? "Invalid Firecrawl API key" : `Firecrawl verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Firecrawl in ${latencyMs}ms` })
      }

      case "browserbase": {
        const res = await fetch("https://api.browserbase.com/v1/sessions", {
          headers: { "X-BB-API-Key": key },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.message || (res.status === 401 ? "Invalid Browserbase API key" : `Browserbase verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Browserbase Cloud in ${latencyMs}ms` })
      }

      case "steel": {
        const res = await fetch("https://api.steel.dev/v1/sessions", {
          headers: { "steel-api-key": key },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.message || (res.status === 401 ? "Invalid Steel API key" : `Steel verification failed (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Steel Cloud in ${latencyMs}ms` })
      }

      case "kernel": {
        const res = await fetch("https://api.onkernel.com/v1/browsers", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          const message = errData.message || (res.status === 401 ? "Invalid Kernel API key" : `Kernel error (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Kernel Cloud in ${latencyMs}ms` })
      }

      case "ollama": {
        const url = (endpoint || key || "http://localhost:11434").replace(/\/$/, "")
        const res = await fetch(`${url}/api/tags`, { method: "GET" }).catch(() => null)
        const latencyMs = Date.now() - startTime
        if (!res || !res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: `Could not reach Ollama at ${url}. Make sure Ollama is running locally.` }, { status: 400 })
        }
        const data = await res.json().catch(() => ({ models: [] }))
        const count = data.models?.length || 0
        return NextResponse.json({
          success: true,
          latencyMs,
          message: `Connected to Ollama in ${latencyMs}ms (${count} local models available)`,
        })
      }

      default: {
        const latencyMs = Date.now() - startTime
        return NextResponse.json({ success: false, latencyMs, error: `Verification not supported for provider '${provider}'` }, { status: 400 })
      }
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to verify connection" }, { status: 500 })
  }
}
