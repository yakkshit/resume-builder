/**
 * Language Detection & ATS Localization Utilities
 * Detects German vs English job descriptions and manages ATS-friendly German Lebenslauf headers.
 * Protects tech acronyms (e.g. CI/CD, Kubernetes, Python, ROS2, REST-APIs) from translation.
 */

const GERMAN_MARKERS = [
  /\b(ihre|deine)\s+aufgaben\b/i,
  /\banforderungen\b/i,
  /\bwir\s+suchen\b/i,
  /\bprofil\b/i,
  /\bvoraussetzungen\b/i,
  /\bdeutschkenntnisse\b/i,
  /\babgeschlossenes\s+studium\b/i,
  /\bberufserfahrung\b/i,
  /\bkenntnisse\b/i,
  /\bunser\s+angebot\b/i,
  /\bstandort\b/i,
  /\blebenslauf\b/i,
  /\bvollzeit\b/i,
  /\bteilzeit\b/i,
  /\barbeitsort\b/i,
  /\bbewerbung\b/i,
  /\bqualifikationen\b/i,
  /\bflie(ß|ss)end\s+in\s+wort\s+und\s+schrift\b/i,
  /\bmitarbeiter\b/i,
  /\bunternehmen\b/i,
  /\bmindestens\s+c1\b/i,
  /\bdeutsch\s+(c1|c2|b2)\b/i,
]

// Tech acronyms that must NEVER be translated or mangled
export const PROTECTED_TECH_TERMS = new Set([
  "AI",
  "API",
  "REST",
  "REST-APIs",
  "CI/CD",
  "Docker",
  "Kubernetes",
  "ROS2",
  "Python",
  "PyTorch",
  "C++",
  "TypeScript",
  "React",
  "Next.js",
  "eBPF",
  "SLAM",
  "Linux",
  "VLM",
  "VLMs",
  "LLM",
  "LLMs",
  "SQL",
  "NoSQL",
  "AWS",
  "GCP",
  "Git",
  "GitHub",
  "PostgreSQL",
  "GraphQL",
])

export interface LanguageDetectionResult {
  language: "de" | "en"
  confidence: number
  matchedGermanMarkers: string[]
  recommendedTemplate: "german-cv" | "german-modern" | "modern"
  sectionHeaders: Record<string, string>
}

export const GERMAN_LEBENSLAUF_HEADERS = {
  contact: "KONTAKT",
  summary: "PROFIL",
  experience: "BERUFSERFAHRUNG",
  education: "AUSBILDUNG",
  projects: "PROJEKTE",
  skills: "FÄHIGKEITEN & KENNTNISSE",
  languages: "SPRACHEN",
  achievements: "ERFOLGE & ZERTIFIZIERUNGEN",
}

export const ENGLISH_RESUME_HEADERS = {
  contact: "CONTACT",
  summary: "PROFESSIONAL SUMMARY",
  experience: "EXPERIENCE",
  education: "EDUCATION",
  projects: "PROJECTS",
  skills: "SKILLS & TECHNOLOGIES",
  languages: "LANGUAGES",
  achievements: "ACHIEVEMENTS & CERTIFICATIONS",
}

/**
 * Detects whether a Job Description or text input is written in German or English.
 */
export function detectJobDescriptionLanguage(text: string = ""): LanguageDetectionResult {
  const clean = text.trim()
  if (!clean) {
    return {
      language: "en",
      confidence: 1.0,
      matchedGermanMarkers: [],
      recommendedTemplate: "modern",
      sectionHeaders: ENGLISH_RESUME_HEADERS,
    }
  }

  const matchedMarkers: string[] = []
  for (const regex of GERMAN_MARKERS) {
    const match = clean.match(regex)
    if (match) {
      matchedMarkers.push(match[0].toLowerCase())
    }
  }

  // Strong signal if 2 or more distinct German job keywords match
  const isGerman = matchedMarkers.length >= 2 || /\b(deine aufgaben|ihre aufgaben|lebenslauf)\b/i.test(clean)

  if (isGerman) {
    return {
      language: "de",
      confidence: Math.min(1.0, 0.6 + matchedMarkers.length * 0.1),
      matchedGermanMarkers: matchedMarkers,
      recommendedTemplate: "german-cv",
      sectionHeaders: GERMAN_LEBENSLAUF_HEADERS,
    }
  }

  return {
    language: "en",
    confidence: 0.95,
    matchedGermanMarkers: [],
    recommendedTemplate: "modern",
    sectionHeaders: ENGLISH_RESUME_HEADERS,
  }
}
