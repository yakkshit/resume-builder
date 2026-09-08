import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  normalizeSkillsToStringArray,
  normalizeLanguagesArray,
  normalizePortfolioLinks,
} from "./sanitize-resume-data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Deep merge function to properly merge nested objects
export function deepMerge(target: any, source: any) {
  if (!isObject(target) || !isObject(source)) {
    return source !== undefined ? source : target
  }

  const output = { ...target }

  Object.keys(source).forEach((key) => {
    // Special handling for skills: if source has skills, normalize and replace
    if (key === "skills") {
      if (source.skills != null) {
        const normalized = normalizeSkillsToStringArray(source.skills)
        if (normalized.length > 0) {
          output.skills = normalized
        } else if (Array.isArray(source.skills) && source.skills.length === 0) {
          output.skills = []
        }
      }
      return
    }

    // Special handling for languages
    if (key === "languages") {
      if (source.languages != null) {
        output.languages = normalizeLanguagesArray(source.languages)
      }
      return
    }

    // Special handling for portfolioLinks
    if (key === "portfolioLinks") {
      if (source.portfolioLinks != null) {
        output.portfolioLinks = normalizePortfolioLinks(source.portfolioLinks)
      }
      return
    }

    // Top-level summary / basicInfo alias mapping
    const basicFields = ["summary", "about", "bio", "objective", "profileSummary", "name", "title", "email", "phone", "location", "linkedin", "website"] as const
    if (basicFields.includes(key as any) && typeof source[key] === "string" && source[key].trim()) {
      if (!output.basicInfo || typeof output.basicInfo !== "object") {
        output.basicInfo = {}
      }
      const field = (key === "about" || key === "bio" || key === "objective" || key === "profileSummary") ? "summary" : key
      output.basicInfo[field] = source[key].trim()
      return
    }

    // Top-level experience alias mapping
    if ((key === "workExperience" || key === "work_experience" || key === "work" || key === "employment" || key === "jobs" || key === "history") && (Array.isArray(source[key]) || isObject(source[key]))) {
      output.experience = source[key]
      return
    }

    // Top-level education alias mapping
    if ((key === "academics" || key === "degrees" || key === "schools" || key === "qualifications") && (Array.isArray(source[key]) || isObject(source[key]))) {
      output.education = source[key]
      return
    }

    // Top-level technicalSkills alias mapping
    if ((key === "technicalSkills" || key === "skillList") && source[key] != null) {
      output.skills = normalizeSkillsToStringArray(source[key])
      return
    }

    // Special handling for basicInfo to safely merge languages and portfolioLinks
    if (key === "basicInfo" && isObject(source.basicInfo)) {
      const basicTarget = isObject(target.basicInfo) ? target.basicInfo : {}
      const mergedBasic = { ...basicTarget }
      Object.keys(source.basicInfo).forEach((bKey) => {
        if (bKey === "languages") {
          if (source.basicInfo.languages != null) {
            mergedBasic.languages = normalizeLanguagesArray(source.basicInfo.languages)
          }
        } else if (bKey === "portfolioLinks") {
          if (source.basicInfo.portfolioLinks != null) {
            mergedBasic.portfolioLinks = normalizePortfolioLinks(source.basicInfo.portfolioLinks)
          }
        } else if (isObject(source.basicInfo[bKey])) {
          if (!isObject(basicTarget[bKey])) {
            mergedBasic[bKey] = source.basicInfo[bKey]
          } else {
            mergedBasic[bKey] = deepMerge(basicTarget[bKey], source.basicInfo[bKey])
          }
        } else {
          mergedBasic[bKey] = source.basicInfo[bKey]
        }
      })
      output.basicInfo = mergedBasic
      return
    }

    if (isObject(source[key])) {
      if (!(key in target) || !isObject(target[key])) {
        output[key] = source[key]
      } else {
        output[key] = deepMerge(target[key], source[key])
      }
    } else if (Array.isArray(source[key])) {
      // Handle arrays - if the source has an array with objects that have an index property,
      // use that to update specific items in the target array
      if (
        Array.isArray(target[key]) &&
        source[key].length > 0 &&
        isObject(source[key][0]) &&
        "index" in source[key][0]
      ) {
        // This is an array of objects with index properties
        output[key] = [...target[key]]
        source[key].forEach((item: any) => {
          if ("index" in item && typeof item.index === "number") {
            if (item.index >= 0 && item.index < output[key].length) {
              // Update existing item
              const { index, ...rest } = item
              output[key][index] = { ...output[key][index], ...rest }
            }
          }
        })
      } else {
        // Replace the entire array
        output[key] = source[key]
      }
    } else {
      Object.assign(output, { [key]: source[key] })
    }
  })

  return output
}

function isObject(item: any): boolean {
  return item && typeof item === "object" && !Array.isArray(item)
}