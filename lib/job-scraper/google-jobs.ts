export type JobSuggestion = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  link: string;
  description?: string;
  postedMinutesAgo?: number;
};

function parsePostedMinutesFromText(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  const s = String(raw).toLowerCase().trim();

  // Common patterns:
  // - "Posted 5 mins ago", "Just posted", "5 minutes ago"
  // - "Posted 2 hours ago"
  // - "Posted yesterday"
  if (!s) return undefined;
  if (s.includes("just posted") || s.includes("just now")) return 0;

  const mins = s.match(/(\d+)\s*(min|mins|minute|minutes)\b/);
  if (mins?.[1]) return Math.max(0, Number(mins[1]));

  const hours = s.match(/(\d+)\s*(hour|hours)\b/);
  if (hours?.[1]) return Math.max(0, Number(hours[1]) * 60);

  const days = s.match(/(\d+)\s*(day|days)\b/);
  if (days?.[1]) return Math.max(0, Number(days[1]) * 60 * 24);

  if (s.includes("yesterday")) return 60 * 24;

  return undefined;
}

function safeStr(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

/**
 * Converts SerpAPI `google_jobs` response into our UI-friendly structure.
 * We intentionally keep this permissive because SerpAPI can vary the schema.
 */
export function extractJobsFromSerpApiGoogleJobsResponse(input: unknown): JobSuggestion[] {
  const root = input && typeof input === "object" ? (input as any) : {};
  const results: unknown[] = Array.isArray(root.jobs_results) ? root.jobs_results : [];

  const jobs: JobSuggestion[] = [];
  for (const r of results) {
    if (!r || typeof r !== "object") continue;

    const title = safeStr((r as any).title);
    const company = safeStr((r as any).company_name ?? (r as any).company);
    const location = safeStr((r as any).location ?? (r as any).job_location);
    const link = safeStr((r as any).link);

    // SerpAPI sometimes uses different "posted" fields.
    const postedRaw =
      (r as any).job_posted_at ??
      (r as any).posted_at ??
      (r as any).posted ??
      (r as any).time;

    const postedMinutesAgo = parsePostedMinutesFromText(postedRaw);

    if (!title && !link) continue;
    jobs.push({
      id: `${link || title}-${company}`.slice(0, 120),
      title: title || "Untitled role",
      company: company || "Company",
      location: location || "Location not specified",
      link: link || "",
      postedMinutesAgo,
    });
  }

  // Dedupe by link where possible.
  const seen = new Set<string>();
  const deduped: JobSuggestion[] = [];
  for (const j of jobs) {
    const k = j.link || j.id;
    if (seen.has(k)) continue;
    seen.add(k);
    deduped.push(j);
  }
  return deduped;
}

export function filterJobsPostedWithinMinutes(
  jobs: JobSuggestion[],
  maxMinutes: number
): JobSuggestion[] {
  if (!Number.isFinite(maxMinutes)) return jobs;
  return jobs.filter((j) => {
    if (typeof j.postedMinutesAgo !== "number") return false;
    return j.postedMinutesAgo <= maxMinutes;
  });
}

