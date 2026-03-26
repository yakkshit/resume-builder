import type { ResumeData } from "./types"
import { defaultResumeData } from "./default-resume-data"

/** Check if value looks like a React element - never pass to @react-pdf Text */
function isReactElement(v: unknown): boolean {
  return typeof v === "object" && v !== null && "$$typeof" in (v as object)
}

/** Only allow profilePicture as data URL or https - strip blob: and objects */
function safeProfilePicture(v: unknown): string | undefined {
  if (v == null) return undefined
  if (typeof v !== "string") return undefined
  const s = v.trim()
  if (!s) return undefined
  if (s.startsWith("data:image/") || s.startsWith("https://") || s.startsWith("http://")) return s
  return undefined
}

/**
 * Sanitizes resume data to ensure all values passed to React PDF Text components
 * are primitives (string/number). Prevents "Objects are not valid as a React child" errors.
 */
/**
 * Merges partial AI-generated resume JSON with defaults, then sanitizes.
 * Prevents React-PDF / chat CV preview from crashing on missing fields or bad types.
 */
export function mergeResumeDataWithDefault(incoming: unknown): ResumeData {
  const base = defaultResumeData
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return sanitizeResumeData({ ...base })
  }
  const r = incoming as Partial<ResumeData>
  const merged: ResumeData = {
    ...base,
    ...r,
    basicInfo: { ...base.basicInfo, ...(r.basicInfo ?? {}) },
    experience: Array.isArray(r.experience) ? (r.experience as ResumeData["experience"]) : base.experience,
    education: Array.isArray(r.education) ? (r.education as ResumeData["education"]) : base.education,
    skills: Array.isArray(r.skills) ? r.skills : base.skills,
    projects: Array.isArray(r.projects) ? r.projects : base.projects,
    achievements: Array.isArray(r.achievements) ? r.achievements : base.achievements,
  }
  return sanitizeResumeData(merged)
}

export function sanitizeResumeData(data: ResumeData): ResumeData {
  const str = (v: unknown): string => {
    if (v == null) return ""
    if (isReactElement(v)) return ""
    if (typeof v === "string") return v
    if (typeof v === "number" || typeof v === "boolean") return String(v)
    if (typeof v === "object") return ""
    return ""
  }

  const arr = <T>(v: unknown, fn: (x: unknown) => T): T[] => {
    if (!Array.isArray(v)) return []
    return v.map(fn)
  }

  // Ensure every string-like value is actually a string (never object/React element)
  const safe = (v: unknown): string => {
    const s = str(v)
    return typeof s === "string" ? s : ""
  }

  const optStr = (v: unknown): string | undefined => {
    const s = safe(v)
    return s || undefined
  }

  return {
    basicInfo: {
      name: safe(data.basicInfo?.name),
      title: safe(data.basicInfo?.title),
      email: safe(data.basicInfo?.email),
      phone: safe(data.basicInfo?.phone),
      location: safe(data.basicInfo?.location),
      linkedin: safe(data.basicInfo?.linkedin),
      website: safe(data.basicInfo?.website),
      summary: safe(data.basicInfo?.summary),
      profilePicture: safeProfilePicture(data.basicInfo?.profilePicture),
      languages: arr(data.basicInfo?.languages, (x) => safe(x)),
      portfolioLinks: arr(data.basicInfo?.portfolioLinks, (link) =>
        typeof link === "object" && link !== null
          ? {
              platform: safe((link as { platform?: unknown }).platform),
              url: safe((link as { url?: unknown }).url),
              username: optStr((link as { username?: unknown }).username),
            }
          : { platform: "", url: "", username: undefined }
      ).filter((l) => l.platform || l.url),
    },
    experience: arr(data.experience, (exp) =>
      typeof exp === "object" && exp !== null
        ? {
            company: safe((exp as { company?: unknown }).company),
            position: safe((exp as { position?: unknown }).position),
            startDate: safe((exp as { startDate?: unknown }).startDate),
            endDate: safe((exp as { endDate?: unknown }).endDate),
            description: safe((exp as { description?: unknown }).description),
            highlights: arr((exp as { highlights?: unknown }).highlights, (x) => safe(x)),
          }
        : {
            company: "",
            position: "",
            startDate: "",
            endDate: "",
            description: "",
            highlights: [],
          }
    ),
    education: arr(data.education, (edu) =>
      typeof edu === "object" && edu !== null
        ? {
            institution: safe((edu as { institution?: unknown }).institution),
            degree: safe((edu as { degree?: unknown }).degree),
            field: safe((edu as { field?: unknown }).field),
            startDate: safe((edu as { startDate?: unknown }).startDate),
            endDate: safe((edu as { endDate?: unknown }).endDate),
            gpa: safe((edu as { gpa?: unknown }).gpa),
          }
        : {
            institution: "",
            degree: "",
            field: "",
            startDate: "",
            endDate: "",
            gpa: "",
          }
    ),
    skills: arr(data.skills, (x) => safe(x)),
    projects: arr(data.projects, (proj) =>
      typeof proj === "object" && proj !== null
        ? {
            name: safe((proj as { name?: unknown }).name),
            description: safe((proj as { description?: unknown }).description),
            technologies: arr((proj as { technologies?: unknown }).technologies, (x) => safe(x)),
            link: optStr((proj as { link?: unknown }).link),
            startDate: optStr((proj as { startDate?: unknown }).startDate),
            endDate: optStr((proj as { endDate?: unknown }).endDate),
          }
        : { name: "", description: "", technologies: [] }
    ).filter((p) => p.name || p.description),
    achievements: arr(data.achievements, (ach) =>
      typeof ach === "object" && ach !== null
        ? {
            title: safe((ach as { title?: unknown }).title),
            description: safe((ach as { description?: unknown }).description),
            date: optStr((ach as { date?: unknown }).date),
          }
        : { title: "", description: "" }
    ).filter((a) => a.title || a.description),
  }
}
