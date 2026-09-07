/**
 * Public Profile & Market Scrapers for AI RAG Grounding
 * Scrapes GitHub, LinkedIn text/profiles, and Google Jobs to ground resume tailoring with real-world data.
 */

export interface GitHubScrapedProfile {
  username: string;
  name?: string;
  bio?: string;
  publicReposCount?: number;
  followers?: number;
  topLanguages?: string[];
  featuredRepositories?: Array<{
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
  }>;
}

export interface LinkedInParsedProfile {
  headline?: string;
  summary?: string;
  experiences: Array<{
    title: string;
    company: string;
    period?: string;
    description?: string;
  }>;
  skills: string[];
  education: Array<{
    institution: string;
    degree?: string;
  }>;
}

/**
 * Scrapes a public GitHub profile and repositories using the standard public REST API.
 */
export async function scrapeGitHubPublicProfile(
  username: string,
  githubToken?: string
): Promise<GitHubScrapedProfile> {
  const cleanUser = username.trim().replace(/^@/, "");
  if (!cleanUser) {
    throw new Error("GitHub username is required");
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "CareerAssistant-Scraper/1.0",
  };
  if (githubToken?.trim()) {
    headers.Authorization = `token ${githubToken.trim()}`;
  }

  // 1. Fetch User Profile
  const userRes = await fetch(`https://api.github.com/users/${cleanUser}`, { headers });
  if (!userRes.ok) {
    throw new Error(`GitHub user ${cleanUser} not found or rate limited (${userRes.status})`);
  }
  const userData = await userRes.json();

  // 2. Fetch User Public Repositories (sorted by recently updated / stars)
  const reposRes = await fetch(
    `https://api.github.com/users/${cleanUser}/repos?sort=updated&per_page=12`,
    { headers }
  );
  const reposData: any[] = reposRes.ok ? await reposRes.json() : [];

  const langCount: Record<string, number> = {};
  const featuredRepositories: GitHubScrapedProfile["featuredRepositories"] = [];

  for (const repo of reposData) {
    if (repo.fork) continue; // Prioritize original projects
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
    }
    featuredRepositories.push({
      name: repo.name || "",
      description: repo.description || "Public Open Source Project",
      language: repo.language || "Multi-language",
      stars: repo.stargazers_count || 0,
      url: repo.html_url || "",
    });
  }

  // Sort languages by frequency
  const topLanguages = Object.entries(langCount)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang)
    .slice(0, 8);

  return {
    username: cleanUser,
    name: userData.name || cleanUser,
    bio: userData.bio || "",
    publicReposCount: userData.public_repos || 0,
    followers: userData.followers || 0,
    topLanguages,
    featuredRepositories: featuredRepositories.slice(0, 6),
  };
}

/**
 * Parses and extracts structured career information from public LinkedIn profile markdown or text.
 */
export function parseLinkedInPublicProfile(rawText: string): LinkedInParsedProfile {
  const text = (rawText || "").trim();
  if (!text) {
    return { experiences: [], skills: [], education: [] };
  }

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let headline = "";
  let summary = "";
  const skills: string[] = [];
  const experiences: LinkedInParsedProfile["experiences"] = [];
  const education: LinkedInParsedProfile["education"] = [];

  let currentSection: "unknown" | "experience" | "skills" | "education" | "summary" = "unknown";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (/^(#+\s*)?(experience|work history|employment)\b/i.test(lower)) {
      currentSection = "experience";
      continue;
    }
    if (/^(#+\s*)?(skills|core skills|technologies)\b/i.test(lower)) {
      currentSection = "skills";
      continue;
    }
    if (/^(#+\s*)?(education|certifications|academics)\b/i.test(lower)) {
      currentSection = "education";
      continue;
    }
    if (/^(#+\s*)?(about|summary|professional summary|bio)\b/i.test(lower)) {
      currentSection = "summary";
      continue;
    }

    if (currentSection === "summary") {
      summary = summary ? `${summary}\n${line}` : line;
    } else if (currentSection === "skills") {
      const splitSkills = line.replace(/^[•*-]\s*/, "").split(/[,;|•]+/);
      for (const s of splitSkills) {
        const cleanS = s.trim();
        if (cleanS && !skills.includes(cleanS)) skills.push(cleanS);
      }
    } else if (currentSection === "experience") {
      if (line.startsWith("### ") || line.startsWith("- **") || line.startsWith("**")) {
        const cleanTitle = line.replace(/^[#*-]+\s*/, "").replace(/\*\*/g, "");
        const [title, company] = cleanTitle.split(/ at | — | - /i);
        experiences.push({
          title: (title || cleanTitle).trim(),
          company: (company || "").trim(),
          description: "",
        });
      } else if (experiences.length > 0 && (line.startsWith("* ") || line.startsWith("- "))) {
        const last = experiences[experiences.length - 1];
        last.description = last.description
          ? `${last.description}\n${line}`
          : line;
      }
    } else if (currentSection === "education") {
      if (line.startsWith("### ") || line.startsWith("- ") || line.startsWith("* ")) {
        const clean = line.replace(/^[#*-]+\s*/, "").replace(/\*\*/g, "");
        education.push({ institution: clean });
      }
    } else if (!headline && !line.startsWith("#")) {
      headline = line;
    }
  }

  return {
    headline: headline || undefined,
    summary: summary || undefined,
    experiences,
    skills,
    education,
  };
}
