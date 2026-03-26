import type { NextRequest } from "next/server";
import { extractJobsFromSerpApiGoogleJobsResponse, filterJobsPostedWithinMinutes, type JobSuggestion } from "@/lib/job-scraper/google-jobs";

type JobSearchBody = {
  query: string;
  location?: string;
  maxResults?: number;
  maxPostedMinutes?: number;
  /** Optional SerpAPI key provided by the user (preferred over env). */
  apiKey?: string;
};

async function fetchSerpApiGoogleJobs(params: {
  apiKey: string;
  query: string;
  location?: string;
  start?: number;
}): Promise<unknown> {
  const qs = new URLSearchParams();
  qs.set("engine", "google_jobs");
  qs.set("api_key", params.apiKey);
  qs.set("q", params.query);
  qs.set("hl", "en");
  if (params.location) qs.set("location", params.location);
  if (params.start != null) qs.set("start", String(params.start));

  const url = `https://serpapi.com/search.json?${qs.toString()}`;
  const res = await fetch(url, { method: "GET" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SerpAPI error (${res.status}): ${text.slice(0, 200)}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as JobSearchBody | null;
  if (!body || !body.query) {
    return Response.json({ jobs: [], error: "Missing query" }, { status: 400 });
  }

  const query = body.query;
  const location = body.location;
  const maxResults = body.maxResults ?? 30;
  const maxPostedMinutes = body.maxPostedMinutes ?? 5;

  const apiKey =
    (typeof body.apiKey === "string" ? body.apiKey : "") ||
    process.env.SERPAPI_KEY ||
    process.env.SERPER_API_KEY ||
    "";

  if (!apiKey) {
    // Development fallback: return a few deterministic suggestions.
    const jobs: JobSuggestion[] = [
      {
        id: "fallback-1",
        title: "Software Engineer",
        company: "Example Inc",
        location: location || "Remote",
        link: "https://example.com/jobs/software-engineer",
        postedMinutesAgo: 3,
      },
      {
        id: "fallback-2",
        title: "Frontend Developer",
        company: "Sample Labs",
        location: location || "Remote",
        link: "https://example.com/jobs/frontend-developer",
        postedMinutesAgo: 4,
      },
    ];
    const filtered = filterJobsPostedWithinMinutes(jobs, maxPostedMinutes);
    return Response.json({ jobs: filtered.length ? filtered : jobs, source: "fallback" });
  }

  // SerpAPI paging: default page size is typically 10.
  const perPage = 10;
  const pages = Math.max(1, Math.ceil(maxResults / perPage));

  const all: JobSuggestion[] = [];
  for (let page = 0; page < pages; page++) {
    const start = page * perPage;
    const serp = await fetchSerpApiGoogleJobs({ apiKey, query, location, start });
    const jobs = extractJobsFromSerpApiGoogleJobsResponse(serp);
    all.push(...jobs);
  }

  // Filter "posted within 5 minutes" if possible. If provider doesn't provide time,
  // we still return results but without the filter.
  const withTime = all.some((j) => typeof j.postedMinutesAgo === "number");
  const filtered = withTime ? filterJobsPostedWithinMinutes(all, maxPostedMinutes) : all;

  // Dedupe by link/id
  const seen = new Set<string>();
  const deduped: JobSuggestion[] = [];
  for (const j of filtered) {
    const key = j.link || j.id;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(j);
    if (deduped.length >= maxResults) break;
  }

  return Response.json({ jobs: deduped, source: "serpapi-google-jobs" });
}

