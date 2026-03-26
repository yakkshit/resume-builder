"use client";

import { useMemo } from "react";
import type { JobSuggestion } from "@/lib/job-scraper/google-jobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase, MapPin, Clock, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { JobProfileDialog, type JobSearchProfile } from "./job-profile-dialog";

export function JobSuggestionsPanel({
  jobs,
  open,
  loading,
  progress,
  progressLabel,
  onClose,
  onUseJob,
  resumeData,
  jobProfileOpen,
  onJobProfileOpenChange,
  onJobProfileSaved,
}: {
  jobs: JobSuggestion[];
  open: boolean;
  loading: boolean;
  progress: number; // 0-100
  progressLabel: string;
  onClose: () => void;
  onUseJob: (job: JobSuggestion) => void;
  resumeData: any;
  jobProfileOpen: boolean;
  onJobProfileOpenChange: (v: boolean) => void;
  onJobProfileSaved?: (profile: JobSearchProfile) => void;
}) {
  const recentJobs = useMemo(() => {
    // If the backend didn't return postedMinutesAgo, just show whatever we got.
    return jobs.slice(0, 12);
  }, [jobs]);

  if (!open) return null;

  return (
    <div className="pointer-events-auto fixed bottom-5 left-1/2 -translate-x-1/2 w-full max-w-4xl px-4 z-40">
      <div className="rounded-2xl border border-border/60 bg-background/90 backdrop-blur-xl shadow-[0_24px_64px_-28px_rgba(77,165,252,0.25)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#4da5fc]" />
            <p className="text-sm font-semibold">Jobs for you</p>
            {jobs.length > 0 && (
              <Badge variant="secondary" className="border border-border/60 bg-white/5 text-[10px]">
                {jobs.length} found
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => onJobProfileOpenChange(true)}
            >
              Edit profile
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-muted"
              onClick={onClose}
              aria-label="Close job suggestions"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {loading && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{progressLabel}</p>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {!loading && recentJobs.length === 0 && (
            <div className="py-6 text-center">
              <p className="text-sm font-medium">No recent jobs found.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try changing your location/profile, or ask me again.
              </p>
            </div>
          )}

          {recentJobs.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-1">
              {recentJobs.map((job) => (
                <Card
                  key={job.id}
                  className={cn(
                    "border-border/60 bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
                  )}
                >
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        {job.title}
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {job.company}
                        </span>
                      </span>
                      {typeof job.postedMinutesAgo === "number" ? (
                        <Badge
                          variant="outline"
                          className="border-border/60 bg-white/5 text-[10px] text-muted-foreground"
                        >
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {job.postedMinutesAgo <= 5 ? "<5m" : `${job.postedMinutesAgo}m`}
                          </span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-border/60 bg-white/5 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            recent
                          </span>
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      {job.link ? (
                        <a
                          href={job.link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <Briefcase className="h-3.5 w-3.5" />
                          View link
                        </a>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 rounded-xl"
                        onClick={() => onUseJob(job)}
                      >
                        Use this job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

        <JobProfileDialog
          open={jobProfileOpen}
          onOpenChange={onJobProfileOpenChange}
          resumeData={resumeData}
          onSaved={(p) => onJobProfileSaved?.(p)}
        />
      </div>
    </div>
  );
}

