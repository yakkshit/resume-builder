/**
 * Deterministic "knowledge store" text built from global profile + resume.
 * Mimics RAG-style retrieved chunks without a vector DB: labeled segments the model can ground on.
 */

import { mergeResumeDataWithDefault, sanitizeResumeData } from "@/lib/sanitize-resume-data"

function str(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "string") return v.trim()
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return ""
}

/**
 * Build labeled document chunks from optional global profile (localStorage ai-chat-profile) + resume JSON.
 */
export function buildUserKnowledgeStoreChunks(
  resumeData: unknown,
  chatGlobalProfile: Record<string, unknown> | null | undefined
): string {
  const blocks: string[] = []

  if (chatGlobalProfile && typeof chatGlobalProfile === "object" && !Array.isArray(chatGlobalProfile)) {
    const lines: string[] = []
    const order = [
      "name",
      "email",
      "phone",
      "location",
      "linkedin",
      "website",
      "github",
      "targetRoles",
      "careerNotes",
    ] as const
    for (const key of order) {
      const v = str(chatGlobalProfile[key])
      if (v) lines.push(`${key}: ${v}`)
    }
    for (const [k, v] of Object.entries(chatGlobalProfile)) {
      if (order.includes(k as (typeof order)[number])) continue
      const s = str(v)
      if (s) lines.push(`${k}: ${s}`)
    }
    if (lines.length) {
      blocks.push(`[chunk:global_user_profile]\n${lines.join("\n")}`)
    }
  }

  try {
    const r = sanitizeResumeData(mergeResumeDataWithDefault(resumeData))
    const head = [str(r.basicInfo?.name), str(r.basicInfo?.title)].filter(Boolean).join(" — ")
    if (head) blocks.push(`[chunk:resume_headline]\n${head}`)
    const sum = str(r.basicInfo?.summary)
    if (sum) blocks.push(`[chunk:resume_summary]\n${sum.slice(0, 4000)}`)

    const skills = Array.isArray(r.skills) ? r.skills.filter(Boolean).slice(0, 60).join(", ") : ""
    if (skills) blocks.push(`[chunk:resume_skills]\n${skills}`)

    const exp = Array.isArray(r.experience) ? r.experience : []
    for (let i = 0; i < Math.min(exp.length, 10); i++) {
      const e = exp[i]
      const parts = [
        str(e?.company),
        str(e?.position),
        `${str(e?.startDate)}–${str(e?.endDate)}`,
        str(e?.description),
        ...(Array.isArray(e?.highlights) ? e.highlights.map((h) => str(h)) : []),
      ].filter(Boolean)
      const line = parts.join(" | ")
      if (line) blocks.push(`[chunk:experience_${i + 1}]\n${line.slice(0, 1500)}`)
    }

    const edu = Array.isArray(r.education) ? r.education : []
    for (let i = 0; i < Math.min(edu.length, 5); i++) {
      const e = edu[i]
      const line = [str(e?.institution), str(e?.degree), str(e?.field)].filter(Boolean).join(" | ")
      if (line) blocks.push(`[chunk:education_${i + 1}]\n${line}`)
    }

    const proj = Array.isArray(r.projects) ? r.projects : []
    for (let i = 0; i < Math.min(proj.length, 8); i++) {
      const p = proj[i]
      const tech = Array.isArray(p?.technologies) ? p.technologies.map(str).filter(Boolean).join(", ") : ""
      const line = [str(p?.name), str(p?.description), tech].filter(Boolean).join(" | ")
      if (line) blocks.push(`[chunk:project_${i + 1}]\n${line.slice(0, 1200)}`)
    }
  } catch {
    /* ignore malformed resume */
  }

  return blocks.join("\n\n")
}
