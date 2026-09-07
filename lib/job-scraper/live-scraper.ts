import type { JobSuggestion } from "./google-jobs";

function cleanHtmlText(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Scrapes real live public jobs from LinkedIn without requiring authentication or cookies.
 */
export async function scrapeLinkedInJobs(query: string, location = "Remote"): Promise<JobSuggestion[]> {
  try {
    const qs = new URLSearchParams({
      keywords: query,
      location: location || "Remote",
      start: "0",
    });

    const url = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${qs.toString()}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const jobs: JobSuggestion[] = [];

    // Extract job cards from LinkedIn guest HTML
    const cardRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let cardMatch: RegExpExecArray | null;

    while ((cardMatch = cardRegex.exec(html)) !== null) {
      const cardHtml = cardMatch[1];
      if (!cardHtml.includes("base-search-card__title") && !cardHtml.includes("job-search-card")) continue;

      // Extract title
      const titleMatch = /<h3[^>]*class="[^"]*base-search-card__title[^"]*"[^>]*>([\s\S]*?)<\/h3>/i.exec(cardHtml);
      const title = cleanHtmlText(titleMatch ? titleMatch[1] : "");

      // Extract company
      const companyMatch = /<h4[^>]*class="[^"]*base-search-card__subtitle[^"]*"[^>]*>([\s\S]*?)<\/h4>/i.exec(cardHtml);
      const company = cleanHtmlText(companyMatch ? companyMatch[1] : "");

      // Extract location
      const locMatch = /<span[^>]*class="[^"]*job-search-card__location[^"]*"[^>]*>([\s\S]*?)<\/span>/i.exec(cardHtml);
      const loc = cleanHtmlText(locMatch ? locMatch[1] : location || "Remote");

      // Extract job link
      const linkMatch = /<a[^>]*class="[^"]*base-card__full-link[^"]*"[^>]*href="([^"]+)"/i.exec(cardHtml) ||
                         /<a[^>]*href="(https:\/\/[^"]*linkedin\.com\/jobs\/view\/[^"]+)"/i.exec(cardHtml);
      let link = linkMatch ? linkMatch[1] : "";
      if (link && link.includes("?")) {
        link = link.split("?")[0]; // Clean tracking params
      }

      if (title && (link || company)) {
        jobs.push({
          id: `linkedin-${link || `${title}-${company}`}`,
          title,
          company: company || "Hiring Company",
          location: loc || location,
          link: link || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`,
          postedMinutesAgo: 5,
        });
      }
    }

    return jobs;
  } catch (e) {
    console.warn("LinkedIn job scraping error:", e);
    return [];
  }
}

/**
 * Fetches live tech & developer jobs from Remotive API.
 */
export async function fetchRemotiveJobs(query: string): Promise<JobSuggestion[]> {
  try {
    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=15`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.jobs) ? data.jobs : [];

    return list.map((j: any) => ({
      id: `remotive-${j.id || j.url}`,
      title: j.title || "Software Engineer",
      company: j.company_name || "Tech Company",
      location: j.candidate_required_location || "Remote",
      salary: j.salary || undefined,
      link: j.url || "",
      description: cleanHtmlText(j.description || "").slice(0, 300),
      postedMinutesAgo: 10,
    }));
  } catch {
    return [];
  }
}

/**
 * Fetches live tech jobs from Arbeitnow public board.
 */
export async function fetchArbeitnowJobs(query: string): Promise<JobSuggestion[]> {
  try {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];

    return list.map((j: any) => ({
      id: `arbeitnow-${j.slug || j.url}`,
      title: j.title || "Developer",
      company: j.company_name || "Company",
      location: j.location || (j.remote ? "Remote" : "Global"),
      link: j.url || "",
      description: cleanHtmlText(j.description || "").slice(0, 300),
      postedMinutesAgo: 15,
    }));
  } catch {
    return [];
  }
}

/**
 * Searches real-time live job postings across LinkedIn, Remotive, and Arbeitnow concurrently.
 */
export async function searchLiveJobs(
  query: string,
  location = "Remote",
  options?: { maxResults?: number }
): Promise<JobSuggestion[]> {
  const maxResults = options?.maxResults ?? 20;

  const [linkedInRes, remotiveRes, arbeitnowRes] = await Promise.allSettled([
    scrapeLinkedInJobs(query, location),
    fetchRemotiveJobs(query),
    fetchArbeitnowJobs(query),
  ]);

  const allJobs: JobSuggestion[] = [];

  if (linkedInRes.status === "fulfilled" && linkedInRes.value.length > 0) {
    allJobs.push(...linkedInRes.value);
  }
  if (remotiveRes.status === "fulfilled" && remotiveRes.value.length > 0) {
    allJobs.push(...remotiveRes.value);
  }
  if (arbeitnowRes.status === "fulfilled" && arbeitnowRes.value.length > 0) {
    allJobs.push(...arbeitnowRes.value);
  }

  // Deduplicate by normalized title & company
  const seen = new Set<string>();
  const deduped: JobSuggestion[] = [];

  for (const j of allJobs) {
    const key = `${j.title.toLowerCase().trim()}-${j.company.toLowerCase().trim()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(j);
    if (deduped.length >= maxResults) break;
  }

  return deduped;
}
