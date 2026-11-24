/**
 * Knowledge-Graph & ATS Relevance Analyzer
 * Orders experience bullets by JD relevance, surfaces gap keywords with [X]% placeholders,
 * and enforces strict ATS integrity (zero white-font / zero hidden text).
 */

import type { ResumeData, Experience } from "@/lib/types"

export interface GapKeywordRecommendation {
  keyword: string
  category: "technical" | "infrastructure" | "methodology" | "domain"
  suggestedBulletTemplate: string
  importance: "high" | "medium"
}

export interface AtsGapReport {
  overallMatchScore: number // 0-100
  atsPassLikelihood: "HIGH" | "MEDIUM" | "LOW"
  matchedKeywords: string[]
  missingKeywords: string[]
  topGapRecommendations: GapKeywordRecommendation[]
  relevanceSortedExperience: Experience[]
  visibleSkillsBlock: string[]
}

const COMMON_TECH_TERMS = [
  "Python", "PyTorch", "C++", "ROS2", "Computer Vision", "VLMs", "LLMs", "SLAM",
  "Spatial AI", "Multi-Agent Systems", "Docker", "Docker Compose", "Kubernetes", "TypeScript",
  "JavaScript", "React", "Next.js", "CI/CD", "GitHub Actions", "Linux", "Bash",
  "AWS", "GCP", "Azure", "Terraform", "Ansible", "Prometheus", "Grafana", "DevOps",
  "MySQL", "PostgreSQL", "MSSQL", "Redis", "MongoDB", "REST", "REST-APIs", "FastAPI",
  "Microservices", "Sensor Fusion", "LiDAR", "IMU", "Camera", "Gazebo", "Webots",
  "C#", ".NET", "Unity", "WebAssembly", "SolidWorks", "3D Printing", "Mechanical Design",
  "Formal Verification", "Distributed Systems", "Deep Learning", "TensorRT", "CUDA", "OpenCV",
  "Point Cloud", "PCL", "Kafka", "Claude Code", "Cursor", "Git"
]

/**
 * Extracts salient technical terms present in the JD.
 */
export function extractJdKeywords(jdText: string): string[] {
  if (!jdText || typeof jdText !== "string") return []
  const clean = jdText.toLowerCase()
  const found: string[] = []
  
  // 1. Match against comprehensive tech term dictionary
  for (const term of COMMON_TECH_TERMS) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(^|[^a-zA-Z0-9#+])${escaped}([^a-zA-Z0-9#+]|$)`, "i")
    if (regex.test(clean)) {
      found.push(term)
    }
  }

  // 2. Dynamic regex extraction for tech acronyms, tooling, and versioned terms (e.g. ROS2, C++, C#, .NET, CI/CD, AWS)
  const dynamicMatches = jdText.match(/\b([A-Z][a-zA-Z0-9+/#.-]{1,15})\b/g) || []
  const ignoredWords = new Set(["The", "We", "You", "Our", "And", "For", "With", "In", "On", "At", "To", "A", "An", "Is", "Are", "Will", "Role", "Job", "Team", "Company", "Must", "Have", "Key", "Work", "Good", "Experience", "Skills", "Requirements", "About", "Please", "Apply", "Status", "Years", "Degree", "Germany", "Konstanz", "Berlin", "Munich"])
  
  for (const word of dynamicMatches) {
    const trimmed = word.trim()
    if (trimmed.length >= 2 && !ignoredWords.has(trimmed) && !found.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
      // Check if it looks like a technical keyword (has punctuation like C++, .NET, CI/CD, or mixed case/numbers like ROS2, Next.js, FastAPI)
      if (/[+#./0-9]/.test(trimmed) || /^[A-Z]{2,6}$/.test(trimmed)) {
        found.push(trimmed)
      }
    }
  }

  return Array.from(new Set(found))
}

/**
 * Calculates a match score between a text snippet (e.g. bullet) and target keywords.
 */
function scoreBulletAgainstKeywords(bullet: string, keywords: string[]): number {
  const bLower = bullet.toLowerCase()
  let score = 0
  for (const kw of keywords) {
    if (bLower.includes(kw.toLowerCase())) {
      score += 10
    }
  }
  return score
}

/**
 * Knowledge-Graph driven ranking and ATS Gap analysis.
 * Reorders bullets so the most JD-relevant achievements appear at the top of each role.
 */
export function analyzeAtsRelevanceAndGaps(
  resume: Partial<ResumeData>,
  jdText: string
): AtsGapReport {
  const jdKeywords = extractJdKeywords(jdText)
  const experienceList = Array.isArray(resume.experience) ? [...resume.experience] : []
  const existingSkills = Array.isArray(resume.skills) ? [...resume.skills] : []

  // Collect all text from current resume to determine matched vs missing
  const fullResumeText = JSON.stringify(resume).toLowerCase()
  const matchedKeywords: string[] = []
  const missingKeywords: string[] = []

  for (const kw of jdKeywords) {
    if (fullResumeText.includes(kw.toLowerCase())) {
      matchedKeywords.push(kw)
    } else {
      missingKeywords.push(kw)
    }
  }

  // 1. Re-order experience highlights by keyword relevance
  const relevanceSortedExperience: Experience[] = experienceList.map((exp) => {
    if (!Array.isArray(exp.highlights) || exp.highlights.length <= 1) {
      return { ...exp }
    }
    const scored = exp.highlights.map((bullet) => ({
      bullet,
      score: scoreBulletAgainstKeywords(bullet, jdKeywords),
    }))
    // Sort descending by score
    scored.sort((a, b) => b.score - a.score)
    return {
      ...exp,
      highlights: scored.map((s) => s.bullet),
    }
  })

  // 2. Compute ATS Match Score
  let overallMatchScore = 0
  if (jdKeywords.length > 0) {
    const matchRatio = matchedKeywords.length / jdKeywords.length
    overallMatchScore = Math.min(100, Math.round(matchRatio * 75 + (matchedKeywords.length > 0 ? 25 : 0)))
  } else if (jdText && jdText.trim().length > 10) {
    // Fallback: check general technical word overlap between JD tokens and resume
    const jdTokens = jdText.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const tokenMatches = jdTokens.filter(t => fullResumeText.includes(t))
    const ratio = tokenMatches.length / Math.max(1, jdTokens.length)
    overallMatchScore = Math.min(85, Math.max(40, Math.round(ratio * 100)))
  }
  const atsPassLikelihood = overallMatchScore >= 80 ? "HIGH" : overallMatchScore >= 55 ? "MEDIUM" : "LOW"

  // 3. Top Gap Recommendations with [X]% placeholders (Strictly NO hallucinated fake metrics)
  const topGapRecommendations: GapKeywordRecommendation[] = missingKeywords.slice(0, 5).map((kw) => {
    return {
      keyword: kw,
      category: "technical",
      suggestedBulletTemplate: `Engineered ${kw} integration for high-throughput pipeline, improving efficiency by [X]% while ensuring strict production reliability.`,
      importance: "high",
    }
  })

  // 4. Truthful visible skills block (combines existing skills with verified matches)
  const visibleSkillsBlock = Array.from(new Set([...existingSkills, ...matchedKeywords]))

  return {
    overallMatchScore,
    atsPassLikelihood,
    matchedKeywords,
    missingKeywords,
    topGapRecommendations,
    relevanceSortedExperience,
    visibleSkillsBlock,
  }
}
