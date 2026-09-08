/**
 * Many models emit resume JSON as { sections: { experience: { items: [...] }, ... }, summary }.
 * The app expects flat ResumeData (basicInfo, experience[], ...). This module converts between shapes.
 */

import { normalizeSkillsToStringArray } from "@/lib/sanitize-resume-data"
import type { PortfolioLink } from "@/lib/types"

const RESUME_TOP_KEYS = [
  "basicInfo",
  "personalInfo",
  "contactInfo",
  "profile",
  "summary",
  "about",
  "bio",
  "experience",
  "workExperience",
  "work",
  "employment",
  "education",
  "academics",
  "degrees",
  "skills",
  "technicalSkills",
  "projects",
  "achievements",
  "awards",
  "languages",
  "portfolioLinks",
] as const

function str(v: unknown): string {
  if (v == null) return ""
  if (typeof v === "string") return v
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return ""
}

function isFlatResumeShape(obj: Record<string, unknown>): boolean {
  return RESUME_TOP_KEYS.some((k) => k in obj && obj[k] != null)
}

/** Normalize en-dash / em-dash date ranges */
export function splitDateRange(dates: string): { start: string; end: string } {
  const raw = (dates || "").trim()
  if (!raw) return { start: "", end: "" }
  const normalized = raw.replace(/\u2013/g, "–").replace(/\u2014/g, "–")
  const m = normalized.match(/^(.+?)\s*[–—-]\s*(.+)$/s)
  if (m) return { start: m[1].trim(), end: m[2].trim() }
  return { start: raw, end: "" }
}

function sectionItems(section: unknown): Record<string, unknown>[] {
  if (!section || typeof section !== "object" || Array.isArray(section)) return []
  const items = (section as { items?: unknown }).items
  if (!Array.isArray(items)) return []
  return items.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as Record<string, unknown>[]
}

function normalizeUrlHint(v: string, kind: "linkedin" | "website" | "github"): string {
  const t = v.trim()
  if (!t) return ""
  if (/^https?:\/\//i.test(t)) return t
  if (kind === "linkedin") {
    if (t.includes("linkedin.com")) return `https://${t.replace(/^\/+/, "")}`
    return `https://linkedin.com/in/${t.replace(/^\/+/, "").replace(/^in\//, "")}`
  }
  if (kind === "github") {
    if (t.includes("github.com")) return `https://${t.replace(/^\/+/, "")}`
    return `https://github.com/${t.replace(/^\/+/, "")}`
  }
  return t.includes(".") ? `https://${t.replace(/^\/+/, "")}` : t
}

function portfolioFromProfile(profile: Record<string, unknown>): PortfolioLink[] {
  const links: PortfolioLink[] = []
  const gh = str(profile.github).trim()
  if (gh) links.push({ platform: "GitHub", url: normalizeUrlHint(gh, "github") })
  return links
}

/**
 * Convert `sections` block (+ optional parent `summary`) into flat resume section object
 * suitable for deepMerge / sanitizeResumeData.
 */
export function sectionsResumeToFlat(sections: Record<string, unknown>, parent: Record<string, unknown>): Record<string, unknown> {
  const profile = sections.profile && typeof sections.profile === "object" && !Array.isArray(sections.profile)
    ? (sections.profile as Record<string, unknown>)
    : {}
  const parentSummary = str(parent.summary)
  const profileSummary = str(profile.summary)
  const summary = parentSummary || profileSummary

  const languagesBlock = sections.languages
  let languages: string[] = []
  if (languagesBlock && typeof languagesBlock === "object" && !Array.isArray(languagesBlock)) {
    const items = (languagesBlock as { items?: unknown }).items
    if (Array.isArray(items)) languages = items.map((x) => str(x)).filter(Boolean)
  }

  const basicInfo: Record<string, unknown> = {
    name: str(profile.name),
    title: str(profile.title),
    email: str(profile.email).replace(/^\[|\]$/g, ""),
    phone: str(profile.phone).replace(/^\[|\]$/g, ""),
    location: str(profile.location),
    linkedin: normalizeUrlHint(str(profile.linkedin), "linkedin"),
    website: normalizeUrlHint(str(profile.website), "website"),
    summary,
    languages: languages.length ? languages : undefined,
    portfolioLinks: portfolioFromProfile(profile),
  }

  const experience = sectionItems(sections.experience).map((it) => {
    const dates = str(it.dates)
    const { start, end } = splitDateRange(dates)
    const kw = it.keywords
    const highlights = Array.isArray(kw) ? kw.map((x) => str(x)).filter(Boolean) : []
    return {
      company: str(it.company),
      position: str(it.title ?? it.position),
      startDate: str(it.startDate || start),
      endDate: str(it.endDate || end),
      description: str(it.description),
      highlights,
    }
  })

  const education = sectionItems(sections.education).map((it) => {
    const dates = str(it.dates)
    const { start, end } = splitDateRange(dates)
    const title = str(it.title)
    const institution = str(it.institution)
    return {
      institution,
      degree: title || str(it.degree),
      field: str(it.field),
      startDate: str(it.startDate || start),
      endDate: str(it.endDate || end),
      gpa: str(it.gpa),
    }
  })

  const projects = sectionItems(sections.projects).map((it) => {
    const kw = it.keywords
    const technologies = Array.isArray(kw) ? kw.map((x) => str(x)).filter(Boolean) : []
    return {
      name: str(it.title ?? it.name),
      description: str(it.description),
      technologies,
      link: str(it.link) || undefined,
    }
  })

  let skills: unknown = undefined
  const skillsSec = sections.skills
  if (skillsSec && typeof skillsSec === "object" && !Array.isArray(skillsSec)) {
    const items = (skillsSec as { items?: unknown }).items
    skills = items !== undefined ? items : skillsSec
  } else if (skillsSec != null) {
    skills = skillsSec
  }
  const skillsFlat = normalizeSkillsToStringArray(skills)

  const achievements: Record<string, unknown>[] = []
  for (const key of ["awards", "publications"] as const) {
    const sec = sections[key]
    for (const it of sectionItems(sec)) {
      const title = str(it.title ?? it.name)
      const description = str(it.description ?? it.publisher ?? it.venue ?? "")
      if (title || description) achievements.push({ title: title || description, description: title ? description : "" })
    }
  }

  const out: Record<string, unknown> = {
    basicInfo,
    experience,
    education,
    skills: skillsFlat,
  }
  if (projects.length) out.projects = projects
  if (achievements.length) out.achievements = achievements

  return out
}

/**
 * If `raw` uses nested `sections`, return a flat resume object; if already flat, return it;
 * otherwise return null (caller keeps original).
 */
export function normalizeResumePayloadToFlat(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>

  if (obj.sections && typeof obj.sections === "object" && !Array.isArray(obj.sections)) {
    return sectionsResumeToFlat(obj.sections as Record<string, unknown>, obj)
  }

  if (isFlatResumeShape(obj)) return obj

  const rd = obj.resumeData
  if (rd && typeof rd === "object" && !Array.isArray(rd)) {
    const inner = rd as Record<string, unknown>
    if (inner.sections && typeof inner.sections === "object" && !Array.isArray(inner.sections)) {
      return sectionsResumeToFlat(inner.sections as Record<string, unknown>, inner)
    }
    if (isFlatResumeShape(inner)) return inner
  }

  return null
}
