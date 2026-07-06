/**
 * Robustly extract resume-update JSON from AI assistant message content.
 * Handles:
 * - ```component:cv ... ``` (API / system prompt format)
 * - ```json ... ```, generic fenced blocks
 * - {"resumeData": {...}} envelopes (unwraps to section shape)
 * - Raw JSON objects in the message
 */

import { deepMerge } from "@/lib/utils"
import { sanitizeResumeData } from "@/lib/sanitize-resume-data"
import { normalizeResumePayloadToFlat } from "@/lib/normalize-sections-resume"
import type { ResumeData, Template } from "@/lib/types"

/** Keep in sync with `resumeTemplates` keys in components/pdf-templates — avoids pulling PDF bundle into lib */
const RESUME_TEMPLATE_KEYS = new Set<string>([
  "modern",
  "classic",
  "minimal",
  "professional",
  "elegant",
  "dark",
  "gradient",
  "two-column",
  "gradient-gray",
  "german-cv",
  "multi-colour",
])

const RESUME_KEYS = ["basicInfo", "experience", "education", "skills", "projects", "achievements"] as const

function isResumeUpdateShape(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false
  return RESUME_KEYS.some((k) => k in (obj as Record<string, unknown>))
}

function tryParseJsonRecord(str: string): Record<string, unknown> | null {
  const cleaned = str
    .replace(/;(\s*[}\]])/g, "$1")
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/\/\/[^\n]*/g, "")
    .trim()
  try {
    const out = JSON.parse(cleaned) as unknown
    if (!out || typeof out !== "object" || Array.isArray(out)) return null
    return out as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Unwrap common LLM envelopes to the flat resume section shape.
 * Also returns optional template from the same envelope.
 */
export function unwrapResumeEnvelope(obj: Record<string, unknown> | null): {
  resume: Record<string, unknown> | null
  template?: string
} {
  if (!obj) return { resume: null }

  const topTemplate = typeof obj.template === "string" ? obj.template : undefined

  const tryFlat = (candidate: Record<string, unknown>): Record<string, unknown> | null => {
    const flat = normalizeResumePayloadToFlat(candidate)
    if (flat && isResumeUpdateShape(flat)) return flat
    if (isResumeUpdateShape(candidate)) return candidate
    return null
  }

  const fromTop = tryFlat(obj)
  if (fromTop) return { resume: fromTop, template: topTemplate }

  const props = obj.props
  if (props && typeof props === "object" && !Array.isArray(props)) {
    const p = props as Record<string, unknown>
    const pt = typeof p.template === "string" ? p.template : topTemplate
    const fromProps = tryFlat(p, pt)
    if (fromProps) return { resume: fromProps, template: pt }
    const prd = p.resumeData
    if (prd && typeof prd === "object" && !Array.isArray(prd)) {
      const flatPrd = normalizeResumePayloadToFlat(prd as Record<string, unknown>) ??
        (isResumeUpdateShape(prd as Record<string, unknown>) ? (prd as Record<string, unknown>) : null)
      if (flatPrd && isResumeUpdateShape(flatPrd)) {
        return { resume: flatPrd, template: pt }
      }
    }
  }

  return { resume: null }
}

function tryUnwrapParsed(parsed: Record<string, unknown> | null): { resume: Record<string, unknown> | null; template?: string } {
  if (!parsed) return { resume: null }
  return unwrapResumeEnvelope(parsed)
}

/** Iterate ``` ... ``` fences in document order */
function forEachFence(content: string, fn: (body: string, header: string) => void): void {
  const re = /```([^\n]*)\n([\s\S]*?)```/g
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    const header = (m[1] ?? "").trim()
    const body = (m[2] ?? "").trim()
    fn(body, header)
  }
}

function safeTemplate(v: unknown): Template | undefined {
  if (typeof v !== "string") return undefined
  return RESUME_TEMPLATE_KEYS.has(v) ? (v as Template) : undefined
}

export interface ExtractedResumePayload {
  resume: Record<string, unknown> | null
  /** From the same JSON envelope as the resume, when present */
  template?: Template
}

/**
 * Extract resume sections + optional template from assistant message text.
 */
export function extractResumePayloadFromMessage(content: string): ExtractedResumePayload {
  if (!content || typeof content !== "string") return { resume: null }

  const trimmed = content.trim()

  // 0) ```component:cv``` / ```component:resume``` (global — use LAST successful parse; models may emit drafts then fixes)
  const componentCvRe = /```\s*component\s*:\s*(?:cv|resume)\s*([\s\S]*?)```/gi
  let lastComponentCv: ExtractedResumePayload | null = null
  let cm: RegExpExecArray | null
  while ((cm = componentCvRe.exec(trimmed)) !== null) {
    const parsed = tryParseJsonRecord((cm[1] ?? "").trim())
    const { resume, template } = tryUnwrapParsed(parsed)
    if (resume) {
      lastComponentCv = { resume, template: safeTemplate(template) }
    }
  }
  if (lastComponentCv?.resume) return lastComponentCv

  // 1) All fenced blocks, in order — try each JSON object
  let fromFence: ExtractedResumePayload | null = null
  forEachFence(trimmed, (body) => {
    if (fromFence?.resume) return
    if (!body.startsWith("{")) return
    const parsed = tryParseJsonRecord(body)
    const { resume, template } = tryUnwrapParsed(parsed)
    if (resume) {
      fromFence = { resume, template: safeTemplate(template) }
    }
  })
  if (fromFence?.resume) return fromFence

  // 2) Whole message is JSON
  const jsonStartMatch = trimmed.match(/^\s*(\{[\s\S]*\})\s*$/)
  if (jsonStartMatch?.[1]) {
    const parsed = tryParseJsonRecord(jsonStartMatch[1])
    const { resume, template } = tryUnwrapParsed(parsed)
    if (resume) return { resume, template: safeTemplate(template) }
  }

  // 3) Balanced { ... } slices (largest / first valid)
  let depth = 0
  let start = -1
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "{") {
      if (depth === 0) start = i
      depth++
    } else if (content[i] === "}") {
      depth--
      if (depth === 0 && start !== -1) {
        const candidate = content.slice(start, i + 1)
        const parsed = tryParseJsonRecord(candidate)
        const { resume, template } = tryUnwrapParsed(parsed)
        if (resume) return { resume, template: safeTemplate(template) }
      }
    }
  }

  return { resume: null }
}

/**
 * Extract the first valid resume-update JSON from markdown/plain text (sections only).
 */
export function extractResumeJsonFromMessage(content: string): Record<string, unknown> | null {
  return extractResumePayloadFromMessage(content).resume
}

/**
 * Merge assistant-extracted resume JSON into current editor state.
 * Preserves existing profile photo (AI payloads omit or strip base64).
 */
export function mergeAssistantResumeIntoCurrent(current: ResumeData, assistantMessageText: string): {
  merged: ResumeData | null
  template?: Template
} {
  const { resume, template } = extractResumePayloadFromMessage(assistantMessageText)
  if (!resume) return { merged: null }

  const pic = current.basicInfo?.profilePicture
  const merged = deepMerge(current, resume) as ResumeData
  let next = sanitizeResumeData(merged)
  if (pic && next.basicInfo) {
    next.basicInfo.profilePicture = pic
  }
  return { merged: next, template }
}

/**
 * Return display-friendly summary of which sections are in the update (for UI).
 */
export function getSuggestedSectionsSummary(update: Record<string, unknown>): string[] {
  const sections: string[] = []
  if (update.basicInfo && typeof update.basicInfo === "object") sections.push("Summary & basic info")
  if (Array.isArray(update.experience) && update.experience.length) sections.push("Experience")
  if (Array.isArray(update.education) && update.education.length) sections.push("Education")
  if (Array.isArray(update.skills) && update.skills.length) sections.push("Skills")
  if (Array.isArray(update.projects) && update.projects.length) sections.push("Projects")
  if (Array.isArray(update.achievements) && update.achievements.length) sections.push("Achievements")
  return sections
}
