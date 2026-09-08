import type { CoverLetterData } from "./types"
import { defaultCoverLetterData } from "./default-cover-letter"

function isReactElement(v: unknown): boolean {
  return typeof v === "object" && v !== null && "$$typeof" in (v as object)
}

function safeStr(v: unknown): string {
  if (v == null) return ""
  if (isReactElement(v)) return ""
  if (typeof v === "string") return v.trim()
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return ""
}

/**
 * Sanitizes and normalizes cover letter data from any input (model JSON, alternative schema, raw text)
 * ensuring `head`, `body`, and `footer` are always guaranteed non-null strings.
 */
export function sanitizeCoverLetterData(raw: unknown): CoverLetterData {
  if (!raw || isReactElement(raw)) {
    return { ...defaultCoverLetterData }
  }

  // 1. If a plain string is provided (e.g. raw markdown or plain text cover letter)
  if (typeof raw === "string") {
    const text = raw.trim()
    if (!text) return { ...defaultCoverLetterData }

    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    if (paragraphs.length <= 1) {
      return {
        head: defaultCoverLetterData.head,
        body: text,
        footer: defaultCoverLetterData.footer,
      }
    }

    // Heuristics:
    // First paragraph is header/contact/recipient if it has contact keywords or dates
    const firstP = paragraphs[0]
    const lastP = paragraphs[paragraphs.length - 1]

    const isHeader =
      /(@|phone|\+?[0-9]{3}|linkedin|github|\b(dear|hiring|to whom|manager|team)\b)/i.test(firstP) ||
      firstP.split("\n").length > 2

    const isFooter =
      /^(sincerely|best regards|regards|warmly|yours truly|respectfully|thank you|with appreciation)/i.test(lastP) ||
      lastP.split("\n").length <= 3

    let head = isHeader ? firstP : defaultCoverLetterData.head
    let footer = isFooter ? lastP : ""
    let bodyParagraphs = paragraphs.slice(isHeader ? 1 : 0, isFooter ? -1 : undefined)

    if (bodyParagraphs.length === 0) {
      bodyParagraphs = [text]
    }

    return {
      head: head || defaultCoverLetterData.head,
      body: bodyParagraphs.join("\n\n"),
      footer: footer,
    }
  }

  // 2. If an object is provided
  if (typeof raw === "object") {
    const obj = (raw as Record<string, unknown>)
    // Unwrap common nested envelopes
    const target =
      (obj.coverLetterData as Record<string, unknown>) ??
      (obj.coverLetter as Record<string, unknown>) ??
      (obj.letter as Record<string, unknown>) ??
      (obj.data as Record<string, unknown>) ??
      obj

    // Extract Head
    let head = safeStr(target.head ?? target.header ?? target.contactInfo ?? target.heading ?? target.top)
    if (!head) {
      const parts: string[] = []
      if (target.sender) parts.push(safeStr(target.sender))
      if (target.contact) parts.push(safeStr(target.contact))
      if (target.email) parts.push(safeStr(target.email))
      if (target.phone) parts.push(safeStr(target.phone))
      if (target.date) parts.push(safeStr(target.date))
      if (target.recipient) parts.push(safeStr(target.recipient))
      if (target.company) parts.push(safeStr(target.company))
      head = parts.filter(Boolean).join("\n")
    }

    // Extract Body
    let body = safeStr(target.body ?? target.content ?? target.letterBody ?? target.text ?? target.message ?? target.main)
    if (!body && Array.isArray(target.paragraphs)) {
      body = target.paragraphs.map((p) => safeStr(p)).filter(Boolean).join("\n\n")
    }
    if (!body && Array.isArray(target.bodyParagraphs)) {
      body = target.bodyParagraphs.map((p) => safeStr(p)).filter(Boolean).join("\n\n")
    }

    // Extract Footer / Signature
    let footer = safeStr(target.footer ?? target.closing ?? target.signature ?? target.signOff ?? target.bottom)
    if (!footer && target.salutationClosing && target.senderName) {
      footer = `${safeStr(target.salutationClosing)}\n${safeStr(target.senderName)}`
    }

    // If body contains the full letter including salutation/closing, make sure head and body are valid
    if (!head && !body && !footer) {
      return { ...defaultCoverLetterData }
    }

    return {
      head: head || defaultCoverLetterData.head,
      body: body || defaultCoverLetterData.body,
      footer: footer,
    }
  }

  return { ...defaultCoverLetterData }
}

/**
 * Parses loose JSON or cover letter content from chat messages.
 */
export function extractCoverLetterJsonFromMessage(text: string): CoverLetterData | null {
  if (!text || typeof text !== "string") return null

  // 1. Explicit component fence: ```component:coverLetter or ```component:cover-letter
  const compRegex = /```component:(?:coverletter|cover-letter|cover_letter|cover)\s*([\s\S]*?)(?:```|$)/i
  const compMatch = compRegex.exec(text)
  if (compMatch && compMatch[1]) {
    try {
      const parsed = JSON.parse(compMatch[1].trim())
      return sanitizeCoverLetterData(parsed)
    } catch {
      // Loose JSON extraction
      const first = compMatch[1].indexOf("{")
      const last = compMatch[1].lastIndexOf("}")
      if (first >= 0 && last > first) {
        try {
          const slice = compMatch[1].slice(first, last + 1)
            .replace(/;(\s*[}\]])/g, "$1")
            .replace(/,\s*([}\]])/g, "$1")
          return sanitizeCoverLetterData(JSON.parse(slice))
        } catch { /* continue */ }
      }
    }
  }

  // 2. Generic json block with cover letter fields
  const jsonRegex = /```(?:json)?\s*([\s\S]*?)(?:```|$)/gi
  let match: RegExpExecArray | null
  while ((match = jsonRegex.exec(text)) !== null) {
    const raw = match[1]?.trim()
    if (!raw) continue
    if (raw.includes('"head"') || raw.includes('"body"') || raw.includes('"coverLetter"') || (raw.includes('"recipient"') && raw.includes('"sincerely"'))) {
      try {
        const parsed = JSON.parse(raw)
        if (typeof parsed === "object" && parsed !== null) {
          if (parsed.head || parsed.body || parsed.coverLetterData || parsed.coverLetter) {
            return sanitizeCoverLetterData(parsed)
          }
        }
      } catch {
        /* continue */
      }
    }
  }

  return null
}
