/**
 * Deterministic "knowledge store" text built from global profile + resume.
 * Mimics RAG-style retrieved chunks without a vector DB: labeled segments the model can ground on.
 */

import { sanitizeResumeData } from "@/lib/sanitize-resume-data"

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
    const standardFields = [
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

    for (const key of standardFields) {
      const v = str(chatGlobalProfile[key])
      if (v) lines.push(`${key}: ${v}`)
    }

    if (lines.length) {
      blocks.push(`[chunk:global_user_profile]\n${lines.join("\n")}`)
    }

    // Comprehensive Master Career Vault (RAG profile)
    const masterSkills = str(chatGlobalProfile.masterSkills)
    if (masterSkills) {
      blocks.push(`[chunk:master_skills_vault]\n${masterSkills}`)
    }

    const masterExp = str(chatGlobalProfile.masterExperience)
    if (masterExp) {
      blocks.push(`[chunk:master_work_history_vault]\n${masterExp}`)
    }

    const masterProj = str(chatGlobalProfile.masterProjects)
    if (masterProj) {
      blocks.push(`[chunk:master_projects_vault]\n${masterProj}`)
    }

    const masterEdu = str(chatGlobalProfile.masterEducation)
    if (masterEdu) {
      blocks.push(`[chunk:master_education_vault]\n${masterEdu}`)
    }

    const masterCerts = str(chatGlobalProfile.masterCertifications)
    if (masterCerts) {
      blocks.push(`[chunk:master_certifications_vault]\n${masterCerts}`)
    }

    const masterKnowledge = str(chatGlobalProfile.ragKnowledgeBase)
    if (masterKnowledge) {
      blocks.push(`[chunk:master_rag_career_knowledge_vault]\n${masterKnowledge}`)
    }

    // Additional custom fields
    const handledKeys = new Set([
      ...standardFields,
      "masterSkills",
      "masterExperience",
      "masterProjects",
      "masterEducation",
      "masterCertifications",
      "ragKnowledgeBase",
      "profilePicture",
      "githubToken",
      "githubRepo",
      "autoSyncGithub",
    ])

    const customLines: string[] = []
    for (const [k, v] of Object.entries(chatGlobalProfile)) {
      if (handledKeys.has(k)) continue
      const s = str(v)
      if (s) customLines.push(`${k}: ${s}`)
    }
    if (customLines.length) {
      blocks.push(`[chunk:additional_career_context]\n${customLines.join("\n")}`)
    }
  }

  try {
    if (resumeData && typeof resumeData === "object" && !Array.isArray(resumeData)) {
      const r = sanitizeResumeData(resumeData as Record<string, unknown>)
      const hasContent = Boolean(
        r.basicInfo?.summary ||
        r.basicInfo?.name ||
        (r.skills && r.skills.length > 0) ||
        (r.experience && r.experience.length > 0) ||
        (r.education && r.education.length > 0) ||
        (r.projects && r.projects.length > 0)
      )

      if (hasContent) {
        const head = [str(r.basicInfo?.name), str(r.basicInfo?.title)].filter(Boolean).join(" — ")
        if (head) blocks.push(`[chunk:resume_headline]\n${head}`)
        const sum = str(r.basicInfo?.summary)
        if (sum) blocks.push(`[chunk:resume_summary]\n${sum.slice(0, 4000)}`)

        const langs = Array.isArray(r.basicInfo?.languages) ? r.basicInfo.languages.map(str).filter(Boolean).join(", ") : ""
        if (langs) blocks.push(`[chunk:resume_languages]\n${langs}`)

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
      }
    }
  } catch {
    /* ignore malformed resume */
  }

  return blocks.join("\n\n")
}
