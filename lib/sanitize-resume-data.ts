import type { ResumeData, BasicInfo, Experience, Education, Project, Achievement, PortfolioLink } from "./types"
import { defaultResumeData } from "./default-resume-data"

/** Check if value looks like a React element - never pass to @react-pdf Text */
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
 * Normalizes skills from any format returned by LLMs (string, string[], categorized object, array of objects)
 * into a clean string[].
 */
export function normalizeSkillsToStringArray(skills: unknown): string[] {
  if (!skills) return []

  const cleanSkillText = (s: string): string => {
    // Strip repeated numeric index prefixes like "0: ", "0: 0: ", "1: ", "1. ", etc.
    return s.replace(/^(?:\d+\s*[:.)-]\s*)+/, "").trim()
  }

  // If already a string, e.g. "React, Node.js, TypeScript"
  if (typeof skills === "string") {
    const trimmed = skills.trim()
    if (!trimmed) return []
    return trimmed
      .split(/[,;\n•]+/)
      .map((s) => cleanSkillText(s))
      .filter(Boolean)
  }

  // If an array
  if (Array.isArray(skills)) {
    const out: string[] = []
    for (const x of skills) {
      if (typeof x === "string") {
        const s = cleanSkillText(x)
        if (s) out.push(s)
        continue
      }
      if (x && typeof x === "object" && !Array.isArray(x)) {
        const o = x as Record<string, unknown>
        const rawCat = safeStr(o.name ?? o.category ?? o.title ?? o.skill)
        const cat = cleanSkillText(rawCat)
        const kwRaw = o.keywords ?? o.skills ?? o.items
        const kws = Array.isArray(kwRaw)
          ? kwRaw.map((k) => cleanSkillText(safeStr(k))).filter(Boolean)
          : typeof kwRaw === "string"
            ? kwRaw.split(/[,;\n]+/).map((k) => cleanSkillText(k)).filter(Boolean)
            : []
        if (cat && kws.length) out.push(`${cat}: ${kws.join(", ")}`)
        else if (kws.length) out.push(...kws)
        else if (cat) out.push(cat)
      }
    }
    return out
  }

  // If a categorized dictionary, e.g. { "Frontend": ["React", "CSS"], "Backend": "Node, Postgres" }
  if (typeof skills === "object" && skills !== null) {
    const out: string[] = []
    for (const [key, val] of Object.entries(skills as Record<string, unknown>)) {
      const isNumericKey = /^\d+$/.test(key.trim())
      const cat = isNumericKey ? "" : cleanSkillText(key)

      if (Array.isArray(val)) {
        const items = val.map((v) => cleanSkillText(safeStr(v))).filter(Boolean)
        if (items.length) {
          if (cat) out.push(`${cat}: ${items.join(", ")}`)
          else out.push(...items)
        }
      } else if (typeof val === "string" && val.trim()) {
        const cleanVal = cleanSkillText(val)
        if (cleanVal) {
          if (cat) out.push(`${cat}: ${cleanVal}`)
          else out.push(cleanVal)
        }
      } else if (typeof val === "object" && val !== null) {
        const nested = normalizeSkillsToStringArray(val)
        if (nested.length) {
          if (cat) out.push(`${cat}: ${nested.join(", ")}`)
          else out.push(...nested)
        }
      }
    }
    if (out.length) return out
  }

  return []
}

/** Languages normalization */
/** Languages normalization */
export function normalizeLanguagesArray(languages: unknown): string[] {
  if (!languages) return []

  const cleanLangText = (s: string): string => {
    return s.replace(/^(?:\d+\s*[:.)-]\s*)+/, "").trim()
  }

  if (typeof languages === "string") {
    return languages
      .split(/[,;\n•]+/)
      .map(cleanLangText)
      .filter(Boolean)
  }

  if (Array.isArray(languages)) {
    const out: string[] = []
    for (const x of languages) {
      if (typeof x === "string") {
        const s = cleanLangText(x)
        if (s) out.push(s)
        continue
      }
      if (x && typeof x === "object" && !Array.isArray(x)) {
        const o = x as Record<string, unknown>
        const label = cleanLangText(safeStr(o.name || o.language || o.label || o.lang))
        const prof = cleanLangText(safeStr(o.proficiency || o.level || o.fluency))
        if (label && prof) out.push(`${label} (${prof})`)
        else if (label) out.push(label)
        else if (prof) out.push(prof)
      }
    }
    return out
  }

  // If a dictionary, e.g. { "English": "Fluent", "German": "A2" }
  if (typeof languages === "object" && languages !== null) {
    const out: string[] = []
    for (const [key, val] of Object.entries(languages as Record<string, unknown>)) {
      const isNumericKey = /^\d+$/.test(key.trim())
      const label = isNumericKey ? "" : cleanLangText(key)
      const prof = typeof val === "string" ? cleanLangText(val) : ""

      if (label && prof) {
        out.push(`${label} (${prof})`)
      } else if (label) {
        out.push(label)
      } else if (prof) {
        out.push(prof)
      }
    }
    if (out.length) return out
  }

  return []
}

function inferPlatform(url: string, fallback = "Link"): string {
  const lower = url.toLowerCase()
  if (lower.includes("github.com")) return "GitHub"
  if (lower.includes("linkedin.com")) return "LinkedIn"
  if (lower.includes("twitter.com") || lower.includes("x.com")) return "X (Twitter)"
  if (lower.includes("leetcode.com")) return "LeetCode"
  if (lower.includes("behance.net")) return "Behance"
  if (lower.includes("dribbble.com")) return "Dribbble"
  if (lower.includes("medium.com")) return "Medium"
  return fallback
}

/** Portfolio links normalization */
export function normalizePortfolioLinks(links: unknown): PortfolioLink[] {
  if (!links) return []

  if (typeof links === "string") {
    const trimmed = links.trim()
    if (!trimmed) return []
    return trimmed
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((url) => ({
        platform: inferPlatform(url),
        url: safeStr(url),
      }))
  }

  if (Array.isArray(links)) {
    const out: PortfolioLink[] = []
    for (const l of links) {
      if (typeof l === "string") {
        const u = l.trim()
        if (u) out.push({ platform: inferPlatform(u), url: u })
        continue
      }
      if (l && typeof l === "object" && !Array.isArray(l)) {
        const o = l as Record<string, unknown>
        const rawUrl = safeStr(o.url || o.link || o.href)
        const rawPlatform = safeStr(o.platform || o.name || o.title || inferPlatform(rawUrl))
        const username = safeStr(o.username || o.handle) || undefined
        if (rawUrl || rawPlatform) {
          out.push({
            platform: rawPlatform || "Link",
            url: rawUrl,
            username,
          })
        }
      }
    }
    return out
  }

  if (typeof links === "object" && links !== null) {
    const out: PortfolioLink[] = []
    for (const [key, val] of Object.entries(links as Record<string, unknown>)) {
      const isNumeric = /^\d+$/.test(key.trim())
      const url = safeStr(typeof val === "string" ? val : (val as any)?.url || (val as any)?.link)
      const platform = isNumeric ? inferPlatform(url) : key.trim()
      if (url || platform) {
        out.push({ platform: platform || "Link", url })
      }
    }
    return out
  }

  return []
}

/** Only allow profilePicture as data URL or http(s) URL */
function safeProfilePicture(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const s = v.trim()
  if (!s) return undefined
  if (s.startsWith("data:image/") || s.startsWith("https://") || s.startsWith("http://")) return s
  return undefined
}

function parseDateRange(item: Record<string, unknown>): { start: string; end: string } {
  const explicitStart = safeStr(item.startDate || item.start_date || item.start || item.from || item.from_date || item.date)
  const explicitEnd = safeStr(item.endDate || item.end_date || item.end || item.to || item.to_date || item.graduationDate || item.graduation_date)
  if (explicitStart || explicitEnd) {
    return { start: explicitStart, end: explicitEnd }
  }
  const rawDates = safeStr(item.dates || item.duration || item.period || item.time || item.years)
  if (!rawDates) return { start: "", end: "" }
  const normalized = rawDates.replace(/\u2013/g, "–").replace(/\u2014/g, "–")
  const m = normalized.match(/^(.+?)\s*[–—-]\s*(.+)$/s)
  if (m) return { start: m[1].trim(), end: m[2].trim() }
  return { start: rawDates, end: "" }
}

/**
 * Sanitizes and normalizes resume data to ensure all values passed to React PDF Text components
 * are primitives (string/number) and arrays are guaranteed to be non-null.
 */
export function sanitizeResumeData(data: Partial<ResumeData> | unknown): ResumeData {
  const root = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as Record<string, unknown>

  // Map alternative envelope names for basicInfo
  const rawBasic = (root.basicInfo ||
    root.personalInfo ||
    root.personal_info ||
    root.contactInfo ||
    root.contact_info ||
    root.profile ||
    root.info ||
    {}) as Record<string, unknown>

  const basicInfo: BasicInfo = {
    name: safeStr(rawBasic.name || root.name || rawBasic.fullName || root.fullName || rawBasic.full_name || root.full_name || rawBasic.candidateName || root.candidateName),
    title: safeStr(rawBasic.title || root.title || rawBasic.jobTitle || root.jobTitle || rawBasic.job_title || root.job_title || rawBasic.role || root.role || rawBasic.position || root.position || rawBasic.headline || root.headline),
    email: safeStr(rawBasic.email || root.email || rawBasic.mail || root.mail || rawBasic.emailAddress || root.emailAddress),
    phone: safeStr(rawBasic.phone || root.phone || rawBasic.phoneNumber || root.phoneNumber || rawBasic.phone_number || root.phone_number || rawBasic.tel || root.tel || rawBasic.mobile || root.mobile),
    location: safeStr(rawBasic.location || root.location || rawBasic.address || root.address || rawBasic.city || root.city || rawBasic.country || root.country),
    linkedin: safeStr(rawBasic.linkedin || root.linkedin || rawBasic.linkedinUrl || root.linkedinUrl || rawBasic.linkedin_url || root.linkedin_url),
    website: safeStr(rawBasic.website || root.website || rawBasic.url || root.url || rawBasic.portfolio || root.portfolio || rawBasic.portfolioUrl || root.portfolioUrl),
    summary: safeStr(rawBasic.summary || root.summary || rawBasic.about || root.about || rawBasic.bio || root.bio || rawBasic.objective || root.objective || rawBasic.profileSummary || root.profileSummary || rawBasic.aboutMe || root.aboutMe),
    profilePicture: safeProfilePicture(rawBasic.profilePicture || root.profilePicture),
    languages: normalizeLanguagesArray(rawBasic.languages || root.languages),
    portfolioLinks: normalizePortfolioLinks(rawBasic.portfolioLinks || root.portfolioLinks || root.portfolio),
  }

  // Map alternative names for experience
  const rawExp = root.experience ||
    root.workExperience ||
    root.work_experience ||
    root.work ||
    root.employment ||
    root.jobs ||
    root.history ||
    []
  const expArray = Array.isArray(rawExp) ? rawExp : typeof rawExp === "object" && rawExp !== null ? Object.values(rawExp) : []

  const experience: Experience[] = expArray
    .filter((it) => it && typeof it === "object")
    .map((item) => {
      const it = item as Record<string, unknown>
      const rawHighlights = it.highlights || it.responsibilities || it.bullets || it.bulletPoints || it.bullet_points || it.achievements || it.keywords || it.tasks || []
      const highlights: string[] = Array.isArray(rawHighlights)
        ? rawHighlights.map(safeStr).filter(Boolean)
        : typeof rawHighlights === "string"
          ? rawHighlights.split(/[\n•]+/).map((h) => h.trim()).filter(Boolean)
          : []

      const dates = parseDateRange(it)

      return {
        company: safeStr(it.company || it.employer || it.organization || it.companyName || it.company_name || it.name),
        position: safeStr(it.position || it.role || it.title || it.jobTitle || it.job_title || it.designation),
        startDate: dates.start,
        endDate: dates.end,
        description: safeStr(it.description || it.summary || it.details || it.about),
        highlights,
      }
    })

  // Map alternative names for education
  const rawEdu = root.education || root.academics || root.degrees || root.schools || root.qualifications || []
  const eduArray = Array.isArray(rawEdu) ? rawEdu : typeof rawEdu === "object" && rawEdu !== null ? Object.values(rawEdu) : []

  const education: Education[] = eduArray
    .filter((it) => it && typeof it === "object")
    .map((item) => {
      const it = item as Record<string, unknown>
      const dates = parseDateRange(it)

      return {
        institution: safeStr(it.institution || it.school || it.university || it.college || it.schoolName || it.academy),
        degree: safeStr(it.degree || it.qualification || it.title || it.degreeName || it.level),
        field: safeStr(it.field || it.major || it.branch || it.study || it.area || it.specialization || it.course),
        startDate: dates.start,
        endDate: dates.end,
        gpa: safeStr(it.gpa || it.grade || it.score || it.cgpa || it.percentage || it.marks),
      }
    })

  // Skills
  const rawSkills = root.skills || root.technicalSkills || root.skillList
  const skills: string[] = normalizeSkillsToStringArray(rawSkills)

  // Projects
  const rawProj = root.projects || root.projectList || root.personalProjects || root.sideProjects || []
  const projArray = Array.isArray(rawProj) ? rawProj : typeof rawProj === "object" && rawProj !== null ? Object.values(rawProj) : []

  const projects: Project[] = projArray
    .filter((it) => it && typeof it === "object")
    .map((item) => {
      const it = item as Record<string, unknown>
      const rawTech = it.technologies || it.techStack || it.tech_stack || it.tech || it.tools || it.skills || []
      const technologies: string[] = normalizeSkillsToStringArray(rawTech)
      const dates = parseDateRange(it)

      return {
        name: safeStr(it.name || it.title || it.projectName || it.project_name || it.heading),
        description: safeStr(it.description || it.summary || it.details || it.about),
        technologies,
        link: safeStr(it.link || it.url || it.github || it.website || it.demo || it.repo) || undefined,
        startDate: dates.start || undefined,
        endDate: dates.end || undefined,
      }
    })
    .filter((p) => p.name || p.description)

  // Achievements
  const rawAch = root.achievements || root.awards || root.honors || root.certifications || []
  const achArray = Array.isArray(rawAch) ? rawAch : typeof rawAch === "object" && rawAch !== null ? Object.values(rawAch) : []

  const achievements: Achievement[] = achArray
    .filter((it) => it && typeof it === "object")
    .map((item) => {
      const it = item as Record<string, unknown>
      return {
        title: safeStr(it.title || it.name || it.heading || it.award || it.certificate || it.honor),
        description: safeStr(it.description || it.details || it.summary || it.issuer || it.organization || it.by),
        date: safeStr(it.date || it.year || it.time || it.issueDate || it.issued) || undefined,
      }
    })
    .filter((a) => a.title || a.description)

  return {
    basicInfo,
    experience,
    education,
    skills,
    projects: projects.length ? projects : [],
    achievements: achievements.length ? achievements : [],
  }
}

import { validateAndNormalizeResumeData } from "./resume-schema"

/**
 * Merges partial AI-generated resume JSON with defaults, then sanitizes.
 * Prevents React-PDF / chat CV preview from crashing on missing fields or bad types.
 */
export function mergeResumeDataWithDefault(incoming: unknown): ResumeData {
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return validateAndNormalizeResumeData(defaultResumeData)
  }
  const base = defaultResumeData
  const sanitizedIncoming = sanitizeResumeData(incoming as Record<string, unknown>)
  const merged = {
    basicInfo: {
      ...base.basicInfo,
      ...sanitizedIncoming.basicInfo,
      name: sanitizedIncoming.basicInfo.name || base.basicInfo.name,
      title: sanitizedIncoming.basicInfo.title || base.basicInfo.title,
      email: sanitizedIncoming.basicInfo.email || base.basicInfo.email,
      phone: sanitizedIncoming.basicInfo.phone || base.basicInfo.phone,
      location: sanitizedIncoming.basicInfo.location || base.basicInfo.location,
      linkedin: sanitizedIncoming.basicInfo.linkedin || base.basicInfo.linkedin,
      website: sanitizedIncoming.basicInfo.website || base.basicInfo.website,
      summary: sanitizedIncoming.basicInfo.summary || base.basicInfo.summary,
    },
    experience: sanitizedIncoming.experience.length ? sanitizedIncoming.experience : base.experience,
    education: sanitizedIncoming.education.length ? sanitizedIncoming.education : base.education,
    skills: sanitizedIncoming.skills.length ? sanitizedIncoming.skills : base.skills,
    projects: (sanitizedIncoming.projects && sanitizedIncoming.projects.length) ? sanitizedIncoming.projects : (base.projects || []),
    achievements: (sanitizedIncoming.achievements && sanitizedIncoming.achievements.length) ? sanitizedIncoming.achievements : (base.achievements || []),
  }
  return validateAndNormalizeResumeData(merged)
}

