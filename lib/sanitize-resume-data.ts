import type { ResumeData } from "./types"

/**
 * Sanitizes resume data to ensure all values passed to React PDF Text components
 * are primitives (string/number). Prevents "Objects are not valid as a React child" errors.
 */
export function sanitizeResumeData(data: ResumeData): ResumeData {
  const str = (v: unknown): string => {
    if (v == null) return ""
    if (typeof v === "string") return v
    if (typeof v === "number" || typeof v === "boolean") return String(v)
    // React elements and other objects must never reach <Text> (causes React #31 in production)
    if (typeof v === "object") {
      if ("$$typeof" in (v as object)) return ""
      return ""
    }
    return ""
  }

  const arr = <T>(v: unknown, fn: (x: unknown) => T): T[] => {
    if (!Array.isArray(v)) return []
    return v.map(fn)
  }

  return {
    basicInfo: {
      name: str(data.basicInfo?.name),
      title: str(data.basicInfo?.title),
      email: str(data.basicInfo?.email),
      phone: str(data.basicInfo?.phone),
      location: str(data.basicInfo?.location),
      linkedin: str(data.basicInfo?.linkedin),
      website: str(data.basicInfo?.website),
      summary: str(data.basicInfo?.summary),
      profilePicture: data.basicInfo?.profilePicture ? str(data.basicInfo.profilePicture) : undefined,
      languages: arr(data.basicInfo?.languages, str),
      portfolioLinks: arr(data.basicInfo?.portfolioLinks, (link) =>
        typeof link === "object" && link !== null
          ? {
              platform: str((link as { platform?: unknown }).platform),
              url: str((link as { url?: unknown }).url),
              username: str((link as { username?: unknown }).username) || undefined,
            }
          : { platform: "", url: "", username: undefined }
      ).filter((l) => l.platform || l.url),
    },
    experience: arr(data.experience, (exp) =>
      typeof exp === "object" && exp !== null
        ? {
            company: str((exp as { company?: unknown }).company),
            position: str((exp as { position?: unknown }).position),
            startDate: str((exp as { startDate?: unknown }).startDate),
            endDate: str((exp as { endDate?: unknown }).endDate),
            description: str((exp as { description?: unknown }).description),
            highlights: arr((exp as { highlights?: unknown }).highlights, str),
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
            institution: str((edu as { institution?: unknown }).institution),
            degree: str((edu as { degree?: unknown }).degree),
            field: str((edu as { field?: unknown }).field),
            startDate: str((edu as { startDate?: unknown }).startDate),
            endDate: str((edu as { endDate?: unknown }).endDate),
            gpa: str((edu as { gpa?: unknown }).gpa),
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
    skills: arr(data.skills, str),
    projects: arr(data.projects, (proj) =>
      typeof proj === "object" && proj !== null
        ? {
            name: str((proj as { name?: unknown }).name),
            description: str((proj as { description?: unknown }).description),
            technologies: arr((proj as { technologies?: unknown }).technologies, str),
            link: str((proj as { link?: unknown }).link) || undefined,
            startDate: str((proj as { startDate?: unknown }).startDate) || undefined,
            endDate: str((proj as { endDate?: unknown }).endDate) || undefined,
          }
        : { name: "", description: "", technologies: [] }
    ).filter((p) => p.name || p.description),
    achievements: arr(data.achievements, (ach) =>
      typeof ach === "object" && ach !== null
        ? {
            title: str((ach as { title?: unknown }).title),
            description: str((ach as { description?: unknown }).description),
            date: str((ach as { date?: unknown }).date) || undefined,
          }
        : { title: "", description: "" }
    ).filter((a) => a.title || a.description),
  }
}
