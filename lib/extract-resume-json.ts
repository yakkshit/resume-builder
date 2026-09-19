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

const RESUME_KEYS = [
  "basicInfo",
  "personalInfo",
  "personal_info",
  "contactInfo",
  "contact_info",
  "profile",
  "summary",
  "about",
  "bio",
  "objective",
  "profileSummary",
  "headline",
  "experience",
  "workExperience",
  "work_experience",
  "work",
  "employment",
  "jobs",
  "history",
  "education",
  "academics",
  "degrees",
  "schools",
  "skills",
  "technicalSkills",
  "skillList",
  "projects",
  "sideProjects",
  "personalProjects",
  "achievements",
  "awards",
  "certifications",
  "publications",
  "languages",
  "portfolioLinks",
  "portfolio",
] as const

function isResumeUpdateShape(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false
  return RESUME_KEYS.some((k) => k in (obj as Record<string, unknown>))
}

function tryParseJsonRecord(str: string): Record<string, unknown> | null {
  const trimmed = str.trim()
  // 1. Try direct parse first - preserves URLs with "https://" and escape characters
  try {
    const out = JSON.parse(trimmed) as unknown
    if (out && typeof out === "object" && !Array.isArray(out)) {
      return out as Record<string, unknown>
    }
  } catch {
    // Continue to repair below
  }

  // 2. Repair common model glitches: trailing commas, stray semicolons, comments
  const cleaned = trimmed
    .replace(/;(\s*[}\]])/g, "$1")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/(?<!:)\/\/[^\n]*/g, "")
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
    const fromProps = tryFlat(p)
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
  const fenceResult = fromFence as ExtractedResumePayload | null
  if (fenceResult?.resume) return fenceResult

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

  // 4) Markdown formatted resume fallback (if model returned **Professional Profile:** ... **Skills:** ...)
  const parsedMarkdown = parseMarkdownResumeText(trimmed)
  if (parsedMarkdown) {
    return { resume: parsedMarkdown, template: "modern" }
  }

  return { resume: null }
}

/**
 * Fallback parser: if an LLM responds with plain markdown headers (e.g. **Professional Profile:**, **Skills:**, **Work History:**)
 * instead of a JSON code block, parse the structured text into a valid flat ResumeData payload.
 */
export function parseMarkdownResumeText(content: string): Record<string, unknown> | null {
  if (!content || typeof content !== "string") return null

  // Check if content contains typical resume section headers
  const hasProfile = /\*\*(?:Professional\s+)?(?:Profile|Summary):\*\*/i.test(content) || /(?:Professional\s+)?Profile:/i.test(content)
  const hasSkills = /\*\*Skills:\*\*/i.test(content) || /Skills:/i.test(content)
  const hasWork = /\*\*(?:Work\s+History|Professional\s+Experience|Experience):\*\*/i.test(content) || /(?:Work\s+History|Experience):/i.test(content)

  // Must have at least two key sections
  const matchCount = (hasProfile ? 1 : 0) + (hasSkills ? 1 : 0) + (hasWork ? 1 : 0)
  if (matchCount < 2) return null

  const result: Record<string, any> = {}

  // 1. Extract Profile / Summary
  const profileMatch = content.match(/\*\*(?:Professional\s+)?(?:Profile|Summary):\*\*\s*([\s\S]*?)(?=\*\*(?:Skills|Work\s+History|Professional\s+Experience|Experience|Education|Projects|Certifications):|\n##|\n#|$)/i)
  let summaryText = ""
  if (profileMatch?.[1]) {
    summaryText = profileMatch[1].trim()
  }

  // 2. Extract Skills
  const skillsMatch = content.match(/\*\*Skills:\*\*\s*([\s\S]*?)(?=\*\*(?:Work\s+History|Professional\s+Experience|Experience|Education|Projects|Certifications|Profile|Summary):|\n##|\n#|$)/i)
  if (skillsMatch?.[1]) {
    const rawSkills = skillsMatch[1].trim()
    const skillList = rawSkills
      .split(/[,•\n\r|]/)
      .map((s) => s.replace(/^[-*]\s*/, "").trim())
      .filter((s) => s.length > 0 && s.length < 50)
    if (skillList.length > 0) {
      result.skills = skillList
    }
  }

  // 3. Extract Name
  let extractedName = ""
  const nameMatch = content.match(/(?:(?:^|\n|\*\*Work\s+History:\*\*|\*\*Experience:\*\*)\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-–—]/)
  if (nameMatch?.[1] && !/Professional Profile|Work History|Computer Science/i.test(nameMatch[1])) {
    extractedName = nameMatch[1].trim()
  }

  // Build basicInfo
  result.basicInfo = {
    ...(extractedName ? { name: extractedName } : {}),
    ...(summaryText ? { summary: summaryText } : {}),
  }

  // 4. Extract Work History / Experience
  const workMatch = content.match(/\*\*(?:Work\s+History|Professional\s+Experience|Experience):\*\*\s*([\s\S]*?)(?=\*\*(?:Education|Projects|Certifications|Skills):|\n##|\n#|$)/i)
  if (workMatch?.[1]) {
    const rawWork = workMatch[1].trim()
    const expItems: any[] = []

    const entries = rawWork.split(/(?=(?:[A-Z][A-Za-z0-9\s,.-]+?\s*[-–—]\s*[A-Z][A-Za-z0-9\s,.-]+?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{1,2}\/\d{4}|\d{4})))/g)

    if (entries.length > 1) {
      for (const entry of entries) {
        const trimmedEntry = entry.trim()
        if (!trimmedEntry) continue
        const headerMatch = trimmedEntry.match(/^([A-Za-z0-9\s,.-]+?)\s*[-–—]\s*([A-Za-z0-9\s,.-]+?)(?:,\s*|\s+)(Present|\d{1,2}\/\d{4}|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})\s*[-–—]\s*(Present|\d{1,2}\/\d{4}|\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{4})?(?:\s*\([^)]*\))?\s*([\s\S]*)$/i)
        if (headerMatch) {
          const compOrName = headerMatch[1].trim()
          const posOrComp = headerMatch[2].trim()
          const start = headerMatch[3]?.trim() || ""
          const end = headerMatch[4]?.trim() || ""
          const desc = headerMatch[5]?.trim() || ""

          let company = compOrName
          let position = posOrComp
          if (posOrComp.includes(" at ")) {
            const parts = posOrComp.split(" at ")
            position = parts[0].trim()
            company = parts[1].trim()
          }

          expItems.push({
            company,
            position,
            startDate: start,
            endDate: end,
            description: desc.slice(0, 500),
            highlights: [],
          })
        }
      }
    }

    if (expItems.length > 0) {
      result.experience = expItems
    } else {
      result.experience = [
        {
          company: "Experience",
          position: "Software Engineer",
          startDate: "",
          endDate: "Present",
          description: rawWork.slice(0, 1000),
          highlights: [],
        },
      ]
    }
  }

  // 5. Extract Education
  const eduMatch = content.match(/\*\*Education:\*\*\s*([\s\S]*?)(?=\*\*(?:Projects|Certifications|Skills|Experience|Work\s+History):|\n##|\n#|$)/i)
  if (eduMatch?.[1]) {
    const rawEdu = eduMatch[1].trim()
    result.education = [
      {
        institution: rawEdu.slice(0, 100),
        degree: "Degree",
        startDate: "",
        endDate: "",
      },
    ]
  }

  return isResumeUpdateShape(result) ? result : null
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
  if (
    (update.basicInfo && typeof update.basicInfo === "object") ||
    (update.personalInfo && typeof update.personalInfo === "object") ||
    (update.contactInfo && typeof update.contactInfo === "object") ||
    (update.profile && typeof update.profile === "object") ||
    typeof update.summary === "string" ||
    typeof update.about === "string" ||
    typeof update.bio === "string" ||
    typeof update.name === "string" ||
    typeof update.title === "string"
  ) {
    sections.push("Summary & basic info")
  }
  if (
    (Array.isArray(update.experience) && update.experience.length > 0) ||
    (Array.isArray(update.workExperience) && update.workExperience.length > 0) ||
    (Array.isArray(update.work) && update.work.length > 0) ||
    (Array.isArray(update.employment) && update.employment.length > 0) ||
    (update.experience && typeof update.experience === "object" && Object.keys(update.experience).length > 0)
  ) {
    sections.push("Experience")
  }
  if (
    (Array.isArray(update.education) && update.education.length > 0) ||
    (Array.isArray(update.academics) && update.academics.length > 0) ||
    (Array.isArray(update.degrees) && update.degrees.length > 0) ||
    (update.education && typeof update.education === "object" && Object.keys(update.education).length > 0)
  ) {
    sections.push("Education")
  }
  if (
    (Array.isArray(update.skills) && update.skills.length > 0) ||
    (typeof update.skills === "string" && update.skills.trim().length > 0) ||
    (update.skills && typeof update.skills === "object" && Object.keys(update.skills).length > 0) ||
    (Array.isArray(update.technicalSkills) && update.technicalSkills.length > 0)
  ) {
    sections.push("Skills")
  }
  if (
    (Array.isArray(update.projects) && update.projects.length > 0) ||
    (Array.isArray(update.sideProjects) && update.sideProjects.length > 0) ||
    (update.projects && typeof update.projects === "object" && Object.keys(update.projects).length > 0)
  ) {
    sections.push("Projects")
  }
  if (
    (Array.isArray(update.achievements) && update.achievements.length > 0) ||
    (Array.isArray(update.awards) && update.awards.length > 0) ||
    (Array.isArray(update.certifications) && update.certifications.length > 0) ||
    (update.achievements && typeof update.achievements === "object" && Object.keys(update.achievements).length > 0)
  ) {
    sections.push("Achievements")
  }
  if (
    (Array.isArray(update.languages) && update.languages.length > 0) ||
    (update.languages && typeof update.languages === "object" && Object.keys(update.languages).length > 0)
  ) {
    sections.push("Languages")
  }
  return sections
}
