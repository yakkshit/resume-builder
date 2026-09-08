import { z } from "zod";
import type { ResumeData, BasicInfo, Experience, Education, Project, Achievement, PortfolioLink } from "./types";
import { defaultResumeData } from "./default-resume-data";
import { normalizeSkillsToStringArray } from "./sanitize-resume-data";

/**
 * Coerce any unknown value to a clean string with default fallback.
 */
const safeString = (defaultValue = "") =>
  z
    .unknown()
    .transform((val) => {
      if (val === null || val === undefined) return defaultValue;
      if (typeof val === "string") return val.trim();
      if (typeof val === "number" || typeof val === "boolean") return String(val);
      return defaultValue;
    })
    .default(defaultValue);

/**
 * Coerce any array/string to a clean string array.
 */
const safeStringArray = z
  .unknown()
  .transform((val): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val
        .map((item) => (typeof item === "string" ? item.trim() : typeof item === "object" && item !== null ? JSON.stringify(item) : String(item || "")))
        .filter((s) => s.length > 0);
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (!trimmed) return [];
      // Handle comma or newline separated lists
      if (trimmed.includes("\n")) {
        return trimmed.split("\n").map((s) => s.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
      }
      if (trimmed.includes(",")) {
        return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return [trimmed];
    }
    return [];
  })
  .default([]);

export const portfolioLinkSchema = z
  .object({
    platform: safeString(""),
    url: safeString(""),
    username: safeString(""),
  })
  .passthrough()
  .default({ platform: "", url: "", username: "" });

export const basicInfoSchema = z
  .object({
    name: safeString(""),
    title: safeString(""),
    email: safeString(""),
    phone: safeString(""),
    location: safeString(""),
    linkedin: safeString(""),
    website: safeString(""),
    summary: safeString(""),
    profilePicture: safeString(""),
    languages: safeStringArray,
    portfolioLinks: z.array(portfolioLinkSchema).default([]),
  })
  .passthrough()
  .default({
    name: "",
    title: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    website: "",
    summary: "",
    profilePicture: "",
    languages: [],
    portfolioLinks: [],
  });

export const experienceSchema = z.preprocess(
  (raw: any) => {
    if (!raw || typeof raw !== "object") return {};
    return {
      company: raw.company || raw.organization || raw.employer || raw.name || "",
      position: raw.position || raw.role || raw.title || raw.jobTitle || "",
      startDate: raw.startDate || raw.start || raw.from || raw.start_date || "",
      endDate: raw.endDate || raw.end || raw.to || raw.end_date || "Present",
      description: raw.description || raw.summary || raw.details || "",
      highlights: raw.highlights || raw.bullets || raw.responsibilities || raw.points || raw.achievements || raw.tasks || [],
    };
  },
  z
    .object({
      company: safeString(""),
      position: safeString(""),
      startDate: safeString(""),
      endDate: safeString("Present"),
      description: safeString(""),
      highlights: safeStringArray,
    })
    .passthrough()
);

export const educationSchema = z.preprocess(
  (raw: any) => {
    if (!raw || typeof raw !== "object") return {};
    return {
      institution: raw.institution || raw.school || raw.university || raw.college || raw.academy || "",
      degree: raw.degree || raw.qualification || raw.diploma || "",
      field: raw.field || raw.major || raw.area || raw.studyField || "",
      startDate: raw.startDate || raw.start || raw.from || raw.start_date || "",
      endDate: raw.endDate || raw.end || raw.to || raw.end_date || "",
      gpa: raw.gpa || raw.grade || raw.score || "",
    };
  },
  z
    .object({
      institution: safeString(""),
      degree: safeString(""),
      field: safeString(""),
      startDate: safeString(""),
      endDate: safeString(""),
      gpa: safeString(""),
    })
    .passthrough()
);

export const projectSchema = z.preprocess(
  (raw: any) => {
    if (!raw || typeof raw !== "object") return {};
    return {
      name: raw.name || raw.title || raw.projectName || "",
      description: raw.description || raw.summary || raw.details || "",
      technologies: raw.technologies || raw.tech || raw.techStack || raw.skills || raw.tags || [],
      link: raw.link || raw.url || raw.github || "",
      startDate: raw.startDate || raw.start || raw.from || "",
      endDate: raw.endDate || raw.end || raw.to || "",
    };
  },
  z
    .object({
      name: safeString(""),
      description: safeString(""),
      technologies: safeStringArray,
      link: safeString(""),
      startDate: safeString(""),
      endDate: safeString(""),
    })
    .passthrough()
);

export const achievementSchema = z.preprocess(
  (raw: any) => {
    if (!raw || typeof raw !== "object") return {};
    return {
      title: raw.title || raw.name || raw.award || "",
      description: raw.description || raw.details || raw.summary || "",
      date: raw.date || raw.year || "",
    };
  },
  z
    .object({
      title: safeString(""),
      description: safeString(""),
      date: safeString(""),
    })
    .passthrough()
);

export const resumeDataSchema = z.preprocess(
  (raw: any) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return defaultResumeData;
    }
    // Handle nested payload envelopes if passed e.g. { resumeData: ... } or { resume: ... }
    const root = raw.resumeData || raw.resume || raw;
    const basic = root.basicInfo || root.personalInfo || root.contactInfo || root.profile || {};
    const rawExp = root.experience || root.workExperience || root.work || root.employment || [];
    const rawEdu = root.education || root.academics || root.degrees || [];
    const rawSkills = root.skills || root.technicalSkills || root.skillList || [];
    const rawProj = root.projects || root.sideProjects || [];
    const rawAch = root.achievements || root.awards || root.honors || [];

    return {
      basicInfo: typeof basic === "object" && basic !== null ? basic : {},
      experience: Array.isArray(rawExp) ? rawExp : [],
      education: Array.isArray(rawEdu) ? rawEdu : [],
      skills: normalizeSkillsToStringArray(rawSkills),
      projects: Array.isArray(rawProj) ? rawProj : [],
      achievements: Array.isArray(rawAch) ? rawAch : [],
    };
  },
  z
    .object({
      basicInfo: basicInfoSchema,
      experience: z.array(experienceSchema).default([]),
      education: z.array(educationSchema).default([]),
      skills: safeStringArray,
      projects: z.array(projectSchema).default([]),
      achievements: z.array(achievementSchema).default([]),
    })
    .passthrough()
);

/**
 * Validates, repairs, and guarantees a 100% crash-proof ResumeData object.
 * Missing fields are filled with default values, alternative keys are normalized,
 * and undefined properties are eliminated so the PDF renderer never throws.
 */
export function validateAndNormalizeResumeData(data: unknown): ResumeData {
  try {
    const parsed = resumeDataSchema.parse(data);
    return {
      basicInfo: {
        name: parsed.basicInfo.name || "Your Name",
        title: parsed.basicInfo.title || "",
        email: parsed.basicInfo.email || "",
        phone: parsed.basicInfo.phone || "",
        location: parsed.basicInfo.location || "",
        linkedin: parsed.basicInfo.linkedin || "",
        website: parsed.basicInfo.website || "",
        summary: parsed.basicInfo.summary || "",
        profilePicture: parsed.basicInfo.profilePicture || "",
        languages: parsed.basicInfo.languages || [],
        portfolioLinks: (parsed.basicInfo.portfolioLinks || []).map((l: any) => ({
          platform: l.platform || "",
          url: l.url || "",
          username: l.username || "",
        })),
      },
      experience: (parsed.experience || []).map((exp: any) => ({
        company: exp.company || "",
        position: exp.position || "",
        startDate: exp.startDate || "",
        endDate: exp.endDate || "Present",
        description: exp.description || "",
        highlights: Array.isArray(exp.highlights) ? exp.highlights : [],
      })),
      education: (parsed.education || []).map((edu: any) => ({
        institution: edu.institution || "",
        degree: edu.degree || "",
        field: edu.field || "",
        startDate: edu.startDate || "",
        endDate: edu.endDate || "",
        gpa: edu.gpa || "",
      })),
      skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : defaultResumeData.skills,
      projects: (parsed.projects || []).map((p: any) => ({
        name: p.name || "",
        description: p.description || "",
        technologies: Array.isArray(p.technologies) ? p.technologies : [],
        link: p.link || "",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
      })),
      achievements: (parsed.achievements || []).map((a: any) => ({
        title: a.title || "",
        description: a.description || "",
        date: a.date || "",
      })),
    };
  } catch (err) {
    console.warn("validateAndNormalizeResumeData fallback due to parse error:", err);
    return defaultResumeData;
  }
}

/**
 * Safe parser for AI tool calls or JSON updates
 */
export function safeParseResume(data: unknown): { success: boolean; data: ResumeData; error?: string } {
  try {
    const result = validateAndNormalizeResumeData(data);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, data: defaultResumeData, error: e instanceof Error ? e.message : "Invalid resume shape" };
  }
}
