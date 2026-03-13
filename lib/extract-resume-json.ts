/**
 * Robustly extract resume-update JSON from AI assistant message content.
 * Handles ```json ... ```, ``` ... ```, and raw JSON objects.
 */

const RESUME_KEYS = ["basicInfo", "experience", "education", "skills", "projects", "achievements"] as const

function isResumeUpdateShape(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false
  return RESUME_KEYS.some((k) => k in obj)
}

function tryParseJson(str: string): Record<string, unknown> | null {
  const cleaned = str
    .replace(/,(\s*[}\]])/g, "$1") // remove trailing commas
    .replace(/\/\/[^\n]*/g, "")     // remove line comments
    .trim()
  try {
    const out = JSON.parse(cleaned) as unknown
    return isResumeUpdateShape(out) ? (out as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * Extract the first valid resume-update JSON from markdown/plain text.
 * Tries: (1) ```json ... ``` block, (2) ``` ... ``` block, (3) raw JSON block, (4) outermost { ... }.
 */
export function extractResumeJsonFromMessage(content: string): Record<string, unknown> | null {
  if (!content || typeof content !== "string") return null

  const trimmed = content.trim()

  // 1) ```json ... ``` or ``` ... ```
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)```/
  const blockMatch = trimmed.match(jsonBlockRegex)
  if (blockMatch?.[1]) {
    const parsed = tryParseJson(blockMatch[1].trim())
    if (parsed) return parsed
  }

  // 2) Raw JSON at start (e.g. AI returns {"basicInfo":{...}} with no markdown)
  const jsonStartMatch = trimmed.match(/^\s*(\{[\s\S]*\})\s*$/)
  if (jsonStartMatch?.[1]) {
    const parsed = tryParseJson(jsonStartMatch[1])
    if (parsed) return parsed
  }

  // 3) Find outermost { ... } that looks like resume update (brace matching)
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
        const parsed = tryParseJson(candidate)
        if (parsed) return parsed
      }
    }
  }

  return null
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
