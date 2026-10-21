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

    const key = (apiKey || "").trim()

    const startTime = Date.now()

    switch (provider.toLowerCase()) {
      case "mistral": {
        if (!key) {
          return NextResponse.json({ success: false, error: "Mistral API key is required" }, { status: 400 })
        }
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
          const message = errData.message || (res.status === 401 ? "Invalid Mistral API key" : `Mistral error (${res.status})`)
          return NextResponse.json({ success: false, latencyMs, error: message }, { status: res.status >= 500 ? 502 : 400 })
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
        if (!key) return NextResponse.json({ success: false, error: "Groq API key is required" }, { status: 400 })
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: res.status === 401 ? "Invalid Groq API key" : "Groq verification failed" }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Groq in ${latencyMs}ms` })
      }

      case "openai": {
        if (!key) return NextResponse.json({ success: false, error: "OpenAI API key is required" }, { status: 400 })
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: res.status === 401 ? "Invalid OpenAI API key" : "OpenAI verification failed" }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to OpenAI in ${latencyMs}ms` })
      }

      case "google": {
        if (!key) return NextResponse.json({ success: false, error: "Google API key is required" }, { status: 400 })
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`)
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: res.status === 400 || res.status === 403 ? "Invalid Google AI API key" : "Google AI verification failed" }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Google Gemini in ${latencyMs}ms` })
      }

      case "anthropic": {
        if (!key) return NextResponse.json({ success: false, error: "Anthropic API key is required" }, { status: 400 })
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
        if (res.status === 401) {
          return NextResponse.json({ success: false, latencyMs, error: "Invalid Anthropic API key" }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to Anthropic in ${latencyMs}ms` })
      }

      case "deepseek": {
        if (!key) return NextResponse.json({ success: false, error: "DeepSeek API key is required" }, { status: 400 })
        const res = await fetch("https://api.deepseek.com/models", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: res.status === 401 ? "Invalid DeepSeek API key" : "DeepSeek verification failed" }, { status: 400 })
        }
        return NextResponse.json({ success: true, latencyMs, message: `Connected to DeepSeek in ${latencyMs}ms` })
      }

      case "openrouter": {
        if (!key) return NextResponse.json({ success: false, error: "OpenRouter API key is required" }, { status: 400 })
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
          headers: { Authorization: `Bearer ${key}` },
        })
        const latencyMs = Date.now() - startTime
        if (!res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: "Invalid OpenRouter API key" }, { status: 400 })
        }
        const data = await res.json().catch(() => ({}))
        return NextResponse.json({
          success: true,
          latencyMs,
          message: `Connected to OpenRouter in ${latencyMs}ms (${data.data?.label || "Active"})`,
        })
      }

      case "ollama": {
        const url = (endpoint || key || "http://localhost:11434").replace(/\/$/, "")
        const res = await fetch(`${url}/api/tags`, { method: "GET" }).catch(() => null)
        const latencyMs = Date.now() - startTime
        if (!res || !res.ok) {
          return NextResponse.json({ success: false, latencyMs, error: `Could not reach Ollama at ${url}. Make sure Ollama is running.` }, { status: 400 })
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
        if (key.length >= 8) {
          return NextResponse.json({ success: true, latencyMs, message: `Format valid for ${provider} in ${latencyMs}ms` })
        }
        return NextResponse.json({ success: false, error: `Invalid ${provider} key format` }, { status: 400 })
      }
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to verify connection" }, { status: 500 })
  }
}
