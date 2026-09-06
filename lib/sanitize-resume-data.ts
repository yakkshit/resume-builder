import type { ResumeData, BasicInfo, Experience, Education, Project, Achievement } from "./types"
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

  // If already a string, e.g. "React, Node.js, TypeScript"
  if (typeof skills === "string") {
    const trimmed = skills.trim()
    if (!trimmed) return []
    return trimmed
      .split(/[,;\n•]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // If an array
  if (Array.isArray(skills)) {
    const out: string[] = []
    for (const x of skills) {
      if (typeof x === "string") {
        const s = x.trim()
        if (s) out.push(s)
        continue
      }
      if (x && typeof x === "object" && !Array.isArray(x)) {
        const o = x as Record<string, unknown>
        const cat = safeStr(o.name ?? o.category ?? o.title ?? o.skill)
        const kwRaw = o.keywords ?? o.skills ?? o.items
        const kws = Array.isArray(kwRaw)
          ? kwRaw.map((k) => safeStr(k)).filter(Boolean)
          : typeof kwRaw === "string"
            ? kwRaw.split(/[,;\n]+/).map((k) => k.trim()).filter(Boolean)
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
      const cat = key.trim()
      if (Array.isArray(val)) {
        const items = val.map((v) => safeStr(v)).filter(Boolean)
        if (items.length) out.push(`${cat}: ${items.join(", ")}`)
      } else if (typeof val === "string" && val.trim()) {
        out.push(`${cat}: ${val.trim()}`)
      }
    }
    if (out.length) return out
  }

  return []
}

/** Languages normalization */
function normalizeLanguagesArray(languages: unknown): string[] {
  if (!languages) return []
  if (typeof languages === "string") {
    return languages.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
  }
  if (!Array.isArray(languages)) return []
  const out: string[] = []
  for (const x of languages) {
    if (typeof x === "string") {
      const s = x.trim()
      if (s) out.push(s)
      continue
    }
    if (x && typeof x === "object" && !Array.isArray(x)) {
      const o = x as Record<string, unknown>
      const label = safeStr(o.name || o.language || o.label)
      const prof = safeStr(o.proficiency || o.level)
      if (label && prof) out.push(`${label} (${prof})`)
      else if (label) out.push(label)
      else if (prof) out.push(prof)
    }
  }
  return out
}

/** Only allow profilePicture as data URL or http(s) URL */
function safeProfilePicture(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const s = v.trim()
  if (!s) return undefined
  if (s.startsWith("data:image/") || s.startsWith("https://") || s.startsWith("http://")) return s
  return undefined
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
    name: safeStr(rawBasic.name || rawBasic.fullName || rawBasic.full_name || rawBasic.candidateName),
    title: safeStr(rawBasic.title || rawBasic.jobTitle || rawBasic.job_title || rawBasic.role || rawBasic.position || rawBasic.headline),
    email: safeStr(rawBasic.email || rawBasic.mail || rawBasic.emailAddress),
    phone: safeStr(rawBasic.phone || rawBasic.phoneNumber || rawBasic.phone_number || rawBasic.tel || rawBasic.mobile),
    location: safeStr(rawBasic.location || rawBasic.address || rawBasic.city || rawBasic.country),
    linkedin: safeStr(rawBasic.linkedin || rawBasic.linkedinUrl || rawBasic.linkedin_url),
    website: safeStr(rawBasic.website || rawBasic.url || rawBasic.portfolio || rawBasic.portfolioUrl),
    summary: safeStr(rawBasic.summary || rawBasic.about || rawBasic.bio || rawBasic.objective || rawBasic.profileSummary || rawBasic.aboutMe),
    profilePicture: safeProfilePicture(rawBasic.profilePicture),
    languages: normalizeLanguagesArray(rawBasic.languages),
    portfolioLinks: (Array.isArray(rawBasic.portfolioLinks) ? rawBasic.portfolioLinks : [])
      .filter((link) => link && typeof link === "object")
      .map((link) => {
        const l = link as Record<string, unknown>
        return {
          platform: safeStr(l.platform || l.name || "Link"),
          url: safeStr(l.url || l.link),
          username: safeStr(l.username || l.handle) || undefined,
        }
      })
      .filter((l) => l.platform || l.url),
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
      const rawHighlights = it.highlights || it.responsibilities || it.bullets || it.bulletPoints || it.bullet_points || it.achievements || it.keywords || []
      const highlights: string[] = Array.isArray(rawHighlights)
        ? rawHighlights.map(safeStr).filter(Boolean)
        : typeof rawHighlights === "string"
          ? rawHighlights.split(/[\n•]+/).map((h) => h.trim()).filter(Boolean)
          : []

      return {
        company: safeStr(it.company || it.employer || it.organization || it.companyName || it.company_name),
        position: safeStr(it.position || it.role || it.title || it.jobTitle || it.job_title || it.designation),
        startDate: safeStr(it.startDate || it.start_date || it.start || it.from || it.from_date || it.date),
        endDate: safeStr(it.endDate || it.end_date || it.end || it.to || it.to_date),
        description: safeStr(it.description || it.summary || it.details),
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
      return {
        institution: safeStr(it.institution || it.school || it.university || it.college || it.schoolName),
        degree: safeStr(it.degree || it.qualification || it.title),
        field: safeStr(it.field || it.major || it.branch || it.study || it.area || it.specialization),
        startDate: safeStr(it.startDate || it.start_date || it.start || it.from),
        endDate: safeStr(it.endDate || it.end_date || it.end || it.to || it.graduationDate || it.graduation_date),
        gpa: safeStr(it.gpa || it.grade || it.score || it.cgpa || it.percentage),
      }
    })

  // Skills
  const rawSkills = root.skills || root.technicalSkills || root.skillList
  const skills: string[] = normalizeSkillsToStringArray(rawSkills)

  // Projects
  const rawProj = root.projects || root.projectList || root.personalProjects || []
  const projArray = Array.isArray(rawProj) ? rawProj : typeof rawProj === "object" && rawProj !== null ? Object.values(rawProj) : []

  const projects: Project[] = projArray
    .filter((it) => it && typeof it === "object")
    .map((item) => {
      const it = item as Record<string, unknown>
      const rawTech = it.technologies || it.techStack || it.tech_stack || it.tech || it.tools || it.skills || []
      const technologies: string[] = Array.isArray(rawTech)
        ? rawTech.map(safeStr).filter(Boolean)
        : typeof rawTech === "string"
          ? rawTech.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean)
          : []

      return {
        name: safeStr(it.name || it.title || it.projectName || it.project_name),
        description: safeStr(it.description || it.summary || it.details),
        technologies,
        link: safeStr(it.link || it.url || it.github || it.website) || undefined,
        startDate: safeStr(it.startDate || it.start) || undefined,
        endDate: safeStr(it.endDate || it.end) || undefined,
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
        title: safeStr(it.title || it.name || it.heading || it.award),
        description: safeStr(it.description || it.details || it.summary || it.issuer),
        date: safeStr(it.date || it.year || it.time) || undefined,
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

/**
 * Merges partial AI-generated resume JSON with defaults, then sanitizes.
 * Prevents React-PDF / chat CV preview from crashing on missing fields or bad types.
 */
export function mergeResumeDataWithDefault(incoming: unknown): ResumeData {
  const base = defaultResumeData
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
    return sanitizeResumeData({ ...base })
  }
  const r = incoming as Record<string, unknown>
  const sanitizedIncoming = sanitizeResumeData(r)
  const merged: ResumeData = {
    basicInfo: {
      ...base.basicInfo,
      ...sanitizedIncoming.basicInfo,
      name: sanitizedIncoming.basicInfo.name || base.basicInfo.name,
      title: sanitizedIncoming.basicInfo.title || base.basicInfo.title,
    },
    experience: sanitizedIncoming.experience.length ? sanitizedIncoming.experience : base.experience,
    education: sanitizedIncoming.education.length ? sanitizedIncoming.education : base.education,
    skills: sanitizedIncoming.skills.length ? sanitizedIncoming.skills : base.skills,
    projects: (sanitizedIncoming.projects && sanitizedIncoming.projects.length) ? sanitizedIncoming.projects : base.projects,
    achievements: (sanitizedIncoming.achievements && sanitizedIncoming.achievements.length) ? sanitizedIncoming.achievements : base.achievements,
  }
  return sanitizeResumeData(merged)
}
