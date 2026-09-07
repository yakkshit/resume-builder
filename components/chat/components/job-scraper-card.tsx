"use client";

import React, { useState } from "react";
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  FileText,
  DollarSign,
  CheckCircle2,
  Loader2,
  Building2,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface JobItem {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  link: string;
  description?: string;
  postedMinutesAgo?: number;
}

export interface JobScraperCardProps {
  initialQuery?: string;
  initialLocation?: string;
  initialJobs?: JobItem[];
  onTailorResume?: (job: JobItem) => void;
  onDraftCoverLetter?: (job: JobItem) => void;
  onSendMessage?: (text: string) => void;
}

export function JobScraperCard({
  initialQuery = "",
  initialLocation = "Remote",
  initialJobs = [],
  onTailorResume,
  onDraftCoverLetter,
  onSendMessage,
}: JobScraperCardProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);
  const [jobs, setJobs] = useState<JobItem[]>(initialJobs);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      toast.error("Please enter a job title, keyword, or skill");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/job-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          location: location.trim() || "Remote",
          maxResults: 10,
        }),
      });

      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setJobs(data.jobs || []);
      if ((data.jobs || []).length === 0) {
        toast.info("No jobs found matching your criteria. Try broader keywords.");
      } else {
        toast.success(`Found ${data.jobs.length} jobs!`);
      }
    } catch (err: any) {
      toast.error("Error searching jobs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTailor = (job: JobItem) => {
    if (onTailorResume) {
      onTailorResume(job);
    } else if (onSendMessage) {
      onSendMessage(
        `Please tailor my resume for the ${job.title} position at ${job.company}. Here are the details:\n\nRole: ${job.title}\nCompany: ${job.company}\nLocation: ${job.location}\n${job.description ? `Description: ${job.description}` : ""}`
      );
    } else {
      toast.success(`Tailoring resume for ${job.title} at ${job.company}`);
    }
  };

  const handleCoverLetter = (job: JobItem) => {
    if (onDraftCoverLetter) {
      onDraftCoverLetter(job);
    } else if (onSendMessage) {
      onSendMessage(
        `Please write a tailored cover letter for the ${job.title} position at ${job.company}. Focus on how my background matches this role.`
      );
    } else {
      toast.success(`Drafting cover letter for ${job.title} at ${job.company}`);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-neutral-900/95 via-neutral-950/95 to-black/95 p-4 text-foreground shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Live Job Scraper & Matching
              <Badge variant="secondary" className="border-cyan-500/30 bg-cyan-500/10 text-[10px] text-cyan-300">
                AI Powered
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Search real-time openings and match your resume with 1-click
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mt-3.5 grid gap-2 sm:grid-cols-12">
        <div className="relative sm:col-span-6">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Role, skill (e.g. Full Stack Engineer, Next.js)"
            className="h-9 rounded-xl border-white/10 bg-black/40 pl-8 text-xs placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="relative sm:col-span-4">
          <MapPin className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location or Remote"
            className="h-9 rounded-xl border-white/10 bg-black/40 pl-8 text-xs placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={loading}
            className="h-9 w-full rounded-xl bg-cyan-500 text-xs font-semibold text-cyan-950 hover:bg-cyan-400"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
          </Button>
        </div>
      </form>

      {/* Job Listings */}
      <div className="mt-4 space-y-2.5">
        {jobs.length === 0 && !loading && (
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center text-xs text-muted-foreground">
            <Search className="mx-auto mb-2 h-6 w-6 opacity-40 text-cyan-400" />
            <p>Enter a target role or skills above to scrape and discover live job openings.</p>
          </div>
        )}

        {jobs.map((job) => (
          <div
            key={job.id}
            className="group rounded-xl border border-white/10 bg-white/[0.03] p-3.5 transition-all hover:border-cyan-500/30 hover:bg-white/[0.06]"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h4 className="font-semibold text-sm text-neutral-100 group-hover:text-cyan-200 transition-colors">
                  {job.title}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-neutral-300">
                    <Building2 className="h-3.5 w-3.5 text-cyan-400" />
                    {job.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                    {job.location}
                  </span>
                  {job.salary && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <DollarSign className="h-3.5 w-3.5" />
                      {job.salary}
                    </span>
                  )}
                  {typeof job.postedMinutesAgo === "number" && (
                    <span className="flex items-center gap-1 text-neutral-400">
                      <Clock className="h-3.5 w-3.5" />
                      {job.postedMinutesAgo === 0 ? "Just now" : `${job.postedMinutesAgo}m ago`}
                    </span>
                  )}
                </div>
              </div>

              {job.link && (
                <a
                  href={job.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 self-start rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Apply <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {job.description && (
              <p className="mt-2 text-xs leading-relaxed text-neutral-400 line-clamp-2">
                {job.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2.5">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleTailor(job)}
                className="h-7 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/20"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-cyan-400" />
                Tailor Resume for this Job
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCoverLetter(job)}
                className="h-7 rounded-lg border-white/10 bg-white/5 px-2.5 text-[11px] font-medium text-neutral-300 hover:bg-white/10 hover:text-white"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5 text-indigo-400" />
                Draft Cover Letter
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
