"use client";

import { Briefcase, MapPin, DollarSign, Clock, Bookmark, ExternalLink, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  posted: string;
  match: number;
  link?: string;
}

const DEFAULT_JOBS: Job[] = [
  { id: 1, title: "Senior React Developer", company: "TechCorp Inc.", location: "Remote", salary: "$120k–$160k", type: "Full-time", posted: "2d ago", match: 94 },
  { id: 2, title: "Full Stack Engineer", company: "StartupXYZ", location: "San Francisco, CA", salary: "$130k–$180k", type: "Full-time", posted: "1w ago", match: 88 },
  { id: 3, title: "Frontend Architect", company: "BigTech Corp", location: "New York, NY", salary: "$150k–$200k", type: "Full-time", posted: "3d ago", match: 82 },
];

export function JobRecommendations({ data }: { data?: unknown }) {
  const input =
    Array.isArray(data)
      ? data
      : Array.isArray((data as any)?.links)
        ? (data as any).links
        : [];

  const jobs: Job[] =
    input && input.length > 0
      ? (input as any[]).map((j, idx): Job => {
          const title = typeof j?.title === "string" ? j.title : `Role ${idx + 1}`;
          const company = typeof j?.company === "string" ? j.company : "Company";
          const location = typeof j?.location === "string" ? j.location : "Location not specified";
          const link = typeof j?.url === "string" ? j.url : typeof j?.link === "string" ? j.link : "";

          // If we have no structured scoring, keep a reasonable visual match.
          const match =
            typeof j?.match === "number"
              ? j.match
              : typeof j?.postedMinutesAgo === "number"
                ? j.postedMinutesAgo <= 5
                  ? 92
                  : 78
                : 84;

          return {
            id: idx + 1,
            title,
            company,
            location,
            salary: typeof j?.salary === "string" ? j.salary : "",
            type: typeof j?.type === "string" ? j.type : "",
            posted: typeof j?.posted === "string" ? j.posted : "",
            match,
            link,
          };
        })
      : DEFAULT_JOBS;

  const matchColor = (m: number) =>
    m >= 90 ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    : m >= 80 ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
    : "bg-amber-500/15 text-amber-600 border-amber-500/30";

  const fireApply = (job: Job) => {
    // Let the chat container decide how to turn this into an AI message.
    window.dispatchEvent(
      new CustomEvent("ai-chat:apply-job", {
        detail: job,
      })
    );
  };

  return (
    <Card className="w-full border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Briefcase className="w-4 h-4 text-blue-500" />
          Job Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="p-4 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm group-hover:text-indigo-500 transition-colors">{job.title}</h4>
                <p className="text-xs text-muted-foreground">{job.company}</p>
              </div>
              <Badge className={`text-[10px] border ${matchColor(job.match)}`}>{job.match}% match</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0 gap-1">
                <Bookmark className="w-3 h-3" /> Save
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs flex-1 gap-1 bg-indigo-500 hover:bg-indigo-600"
                onClick={() => fireApply(job)}
              >
                {job.link ? <ExternalLink className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                Apply Now
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
