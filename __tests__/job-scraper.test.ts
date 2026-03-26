import { describe, it, expect } from "vitest";
import {
  extractJobsFromSerpApiGoogleJobsResponse,
  filterJobsPostedWithinMinutes,
} from "@/lib/job-scraper/google-jobs";

describe("job scraper helpers", () => {
  it("extracts posted minutes from common text formats", () => {
    const input = {
      jobs_results: [
        {
          title: "Software Engineer",
          company_name: "Acme",
          location: "Remote",
          link: "https://example.com/job1",
          job_posted_at: "Posted 5 mins ago",
        },
        {
          title: "Frontend Developer",
          company_name: "Beta",
          location: "NYC",
          link: "https://example.com/job2",
          job_posted_at: "Posted 1 hour ago",
        },
        {
          title: "Analyst",
          company_name: "Gamma",
          location: "SF",
          link: "https://example.com/job3",
          job_posted_at: "Just posted",
        },
      ],
    };

    const jobs = extractJobsFromSerpApiGoogleJobsResponse(input);
    const byTitle = Object.fromEntries(jobs.map((j) => [j.title, j]));

    expect(byTitle["Software Engineer"]?.postedMinutesAgo).toBe(5);
    expect(byTitle["Frontend Developer"]?.postedMinutesAgo).toBe(60);
    expect(byTitle["Analyst"]?.postedMinutesAgo).toBe(0);
  });

  it("filters jobs to only those posted within max minutes", () => {
    const input = {
      jobs_results: [
        {
          title: "Job A",
          company_name: "C1",
          location: "Remote",
          link: "https://example.com/a",
          job_posted_at: "Posted 4 mins ago",
        },
        {
          title: "Job B",
          company_name: "C2",
          location: "Remote",
          link: "https://example.com/b",
          job_posted_at: "Posted 10 mins ago",
        },
      ],
    };

    const jobs = extractJobsFromSerpApiGoogleJobsResponse(input);
    const filtered = filterJobsPostedWithinMinutes(jobs, 5);

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toBe("Job A");
  });
});

