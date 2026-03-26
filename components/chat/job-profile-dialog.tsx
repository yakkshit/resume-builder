"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ResumeData } from "@/lib/types";

export type JobSearchProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
};

const STORE_ID = "job-search-profile-store";

function defaultFromResume(resumeData: ResumeData | null): JobSearchProfile {
  return {
    name: resumeData?.basicInfo?.name ?? "",
    email: resumeData?.basicInfo?.email ?? "",
    phone: resumeData?.basicInfo?.phone ?? "",
    location: resumeData?.basicInfo?.location ?? "",
  };
}

export function JobProfileDialog({
  open,
  onOpenChange,
  resumeData,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  resumeData: ResumeData | null;
  onSaved?: (profile: JobSearchProfile) => void;
}) {
  const [profile, setProfile] = useState<JobSearchProfile>(() => defaultFromResume(resumeData));

  useEffect(() => {
    // Load saved profile (or fall back to resume fields) when dialog opens.
    if (!open) return;
    try {
      const raw = localStorage.getItem(STORE_ID);
      if (raw) setProfile({ ...defaultFromResume(resumeData), ...(JSON.parse(raw) as Partial<JobSearchProfile>) });
      else setProfile(defaultFromResume(resumeData));
    } catch {
      setProfile(defaultFromResume(resumeData));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSave = () => {
    try {
      localStorage.setItem(STORE_ID, JSON.stringify(profile));
    } catch {
      // ignore quota errors
    }
    onSaved?.(profile);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Job Search Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Name</Label>
              <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <Input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Location</Label>
              <Input
                value={profile.location}
                onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g., Remote / San Francisco, CA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Tip</Label>
            <Textarea
              value={`We'll use this location to prioritize recent jobs for you.\n\nCurrent saved resume data can still be edited inside the CV Editor.`}
              readOnly
              className="min-h-[72px] text-xs opacity-80"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" className="flex-1" onClick={handleSave}>
              Save profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function loadJobSearchProfile(): JobSearchProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORE_ID);
    if (!raw) return null;
    return JSON.parse(raw) as JobSearchProfile;
  } catch {
    return null;
  }
}

