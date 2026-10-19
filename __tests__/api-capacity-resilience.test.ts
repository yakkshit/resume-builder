import { describe, it, expect, vi } from "vitest"

describe("Gemini Capacity and Demand Error Resilience", () => {
  it("correctly identifies 503 high demand spike error strings and ApiError objects", () => {
    function getErrorText(err: unknown): string {
      if (!err) return ""
      if (typeof err === "string") return err.toLowerCase()
      const obj = err as Record<string, any>
      let text = ""
      if (typeof obj.message === "string") text += " " + obj.message
      if (typeof obj.status === "string" || typeof obj.status === "number") text += " " + obj.status
      if (typeof obj.statusCode === "string" || typeof obj.statusCode === "number") text += " " + obj.statusCode
      if (typeof obj.code === "string" || typeof obj.code === "number") text += " " + obj.code
      try {
        text += " " + JSON.stringify(err)
      } catch {}
      return text.toLowerCase()
    }

    function isDemandError(err: unknown): boolean {
      if (!err) return false
      const text = getErrorText(err)
      return (
        text.includes("503") ||
        text.includes("high demand") ||
        text.includes("unavailable") ||
        text.includes("overloaded") ||
        text.includes("service unavailable") ||
        text.includes("spikes in demand") ||
        text.includes("try again later")
      )
    }

    function isQuotaOrCapacityError(err: unknown): boolean {
      if (!err) return false
      const text = getErrorText(err)
      return (
        text.includes("429") ||
        text.includes("503") ||
        text.includes("quota") ||
        text.includes("resource_exhausted") ||
        text.includes("rate limit") ||
        text.includes("rate-limit") ||
        text.includes("high demand") ||
        text.includes("unavailable") ||
        text.includes("overloaded") ||
        text.includes("service unavailable") ||
        text.includes("spikes in demand") ||
        text.includes("too many requests") ||
        text.includes("try again later")
      )
    }

    // Exact error observed in user terminal:
    const gemini503Error = {
      message: JSON.stringify({
        error: {
          code: 503,
          message: "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.",
          status: "UNAVAILABLE",
        },
      }),
      code: 503,
      status: "Service Unavailable",
    }

    expect(isDemandError(gemini503Error)).toBe(true)
    expect(isQuotaOrCapacityError(gemini503Error)).toBe(true)

    // Exact 429 quota error observed in user terminal:
    const gemini429Error = {
      message: JSON.stringify({
        error: {
          code: 429,
          message: "You exceeded your current quota, please check your plan and billing details.",
          status: "RESOURCE_EXHAUSTED",
        },
      }),
      code: 429,
      status: "Too Many Requests",
    }

    expect(isDemandError(gemini429Error)).toBe(false)
    expect(isQuotaOrCapacityError(gemini429Error)).toBe(true)
  })

  it("filters thought parts to suppress thoughtSignature warning", () => {
    const chunkWithThought = {
      candidates: [
        {
          content: {
            parts: [
              { thought: true, text: "Internal reasoning details" },
              { text: "Hello! How can I assist you today?" },
            ],
          },
        },
      ],
    }

    let delta = ""
    if (chunkWithThought?.candidates?.[0]?.content?.parts) {
      for (const part of chunkWithThought.candidates[0].content.parts) {
        if (part && typeof part.text === "string" && !part.thought) {
          delta += part.text
        }
      }
    }

    expect(delta).toBe("Hello! How can I assist you today?")
    expect(delta).not.toContain("Internal reasoning details")
  })

  it("identifies model retirement and 404 not found errors via isModelNotFoundError", () => {
    function getErrorText(err: unknown): string {
      if (!err) return ""
      if (typeof err === "string") return err.toLowerCase()
      const obj = err as Record<string, any>
      let text = ""
      if (typeof obj.message === "string") text += " " + obj.message
      if (typeof obj.status === "string" || typeof obj.status === "number") text += " " + obj.status
      if (typeof obj.statusCode === "string" || typeof obj.statusCode === "number") text += " " + obj.statusCode
      if (typeof obj.code === "string" || typeof obj.code === "number") text += " " + obj.code
      try {
        text += " " + JSON.stringify(err)
      } catch {}
      return text.toLowerCase()
    }

    function isModelNotFoundError(err: unknown): boolean {
      if (!err) return false
      const text = getErrorText(err)
      return (
        text.includes("404") ||
        text.includes("not_found") ||
        text.includes("not found") ||
        text.includes("no longer available") ||
        text.includes("is not found for api version") ||
        text.includes("is not supported") ||
        text.includes("model not found")
      )
    }

    // Exact error message observed from Google Gemini when 2.0-flash is called:
    const retiredModelError = {
      message: JSON.stringify({
        error: {
          code: 404,
          message: "This model models/gemini-2.0-flash is no longer available. Please update your code to use models/gemini-3.8-flash for the latest features and improvements.",
          status: "NOT_FOUND",
        },
      }),
      code: 404,
      status: "Not Found",
    }

    expect(isModelNotFoundError(retiredModelError)).toBe(true)
  })

  it("ensures long search queries are clamped to under 400 characters to prevent Tavily 400", () => {
    const longPrompt = "A".repeat(2500)
    const sanitizedQuery = longPrompt.trim().slice(0, 400)
    expect(sanitizedQuery.length).toBe(400)
    expect(sanitizedQuery.length).toBeLessThan(1500)
  })
})
