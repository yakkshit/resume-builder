"use client";

import { Briefcase, MapPin, DollarSign, Clock, Bookmark, ExternalLink } from "lucide-react";
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
}

const DEFAULT_JOBS: Job[] = [
  { id: 1, title: "Senior React Developer", company: "TechCorp Inc.", location: "Remote", salary: "$120k–$160k", type: "Full-time", posted: "2d ago", match: 94 },
  { id: 2, title: "Full Stack Engineer", company: "StartupXYZ", location: "San Francisco, CA", salary: "$130k–$180k", type: "Full-time", posted: "1w ago", match: 88 },
  { id: 3, title: "Frontend Architect", company: "BigTech Corp", location: "New York, NY", salary: "$150k–$200k", type: "Full-time", posted: "3d ago", match: 82 },
];

export function JobRecommendations({ data = [] }: { data?: Job[] }) {
  const jobs = data.length > 0 ? data : DEFAULT_JOBS;

  const matchColor = (m: number) =>
    m >= 90 ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
    : m >= 80 ? "bg-blue-500/15 text-blue-600 border-blue-500/30"
    : "bg-amber-500/15 text-amber-600 border-amber-500/30";

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
              <Button size="sm" className="h-7 text-xs flex-1 gap-1 bg-indigo-500 hover:bg-indigo-600">
                <ExternalLink className="w-3 h-3" /> Apply Now
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
