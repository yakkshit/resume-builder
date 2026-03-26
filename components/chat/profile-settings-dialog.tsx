"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_MODELS, type ChatSettings } from "./chat-store";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  github: string;
};

export const PROFILE_STORE_ID = "ai-chat-profile";

function loadProfile(): UserProfile {
  if (typeof window === "undefined") return { name: "", email: "", phone: "", location: "", linkedin: "", website: "", github: "" };
  try {
    const raw = localStorage.getItem(PROFILE_STORE_ID);
    if (!raw) return { name: "", email: "", phone: "", location: "", linkedin: "", website: "", github: "" };
    const p = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: typeof p.name === "string" ? p.name : "",
      email: typeof p.email === "string" ? p.email : "",
      phone: typeof p.phone === "string" ? p.phone : "",
      location: typeof p.location === "string" ? p.location : "",
      linkedin: typeof p.linkedin === "string" ? p.linkedin : "",
      website: typeof p.website === "string" ? p.website : "",
      github: typeof p.github === "string" ? p.github : "",
    };
  } catch {
    return { name: "", email: "", phone: "", location: "", linkedin: "", website: "", github: "" };
  }
}

function saveProfile(p: UserProfile) {
  try {
    localStorage.setItem(PROFILE_STORE_ID, JSON.stringify(p));
  } catch {
    // ignore quota errors
  }
}

export function ProfileSettingsDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: ChatSettings;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
}) {
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", phone: "", location: "", linkedin: "", website: "", github: "" });
  const [apiKeyDraft, setApiKeyDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setProfile(loadProfile());
    // API key must NOT be persisted; only edit in-memory.
    setApiKeyDraft(settings.apiKey || "");
  }, [open, settings.apiKey]);

  const modelsByProvider = useMemo(() => {
    return AVAILABLE_MODELS.reduce<Record<string, typeof AVAILABLE_MODELS>>((acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    }, {});
  }, []);

  const handleSave = () => {
    saveProfile(profile);
    onSettingsChange({
      model: settings.model,
      contextWindow: settings.contextWindow,
      // API key is intentionally only kept in memory (not persisted in useChatSettings).
      apiKey: apiKeyDraft,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Profile & Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
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
                placeholder="e.g., Remote / Bengaluru / NYC"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">LinkedIn</Label>
              <Input
                value={profile.linkedin}
                onChange={(e) => setProfile((p) => ({ ...p, linkedin: e.target.value }))}
                placeholder="linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Website</Label>
              <Input
                value={profile.website}
                onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
                placeholder="yourwebsite.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">GitHub</Label>
            <Input
              value={profile.github}
              onChange={(e) => setProfile((p) => ({ ...p, github: e.target.value }))}
              placeholder="github.com/username"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Default model</Label>
            <Select value={settings.model} onValueChange={(v) => onSettingsChange({ model: v })}>
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {Object.entries(modelsByProvider).map(([provider, models]) => (
                  <React.Fragment key={provider}>
                    <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {provider}
                    </div>
                    {models.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-xs pl-6">
                        {m.label}
                      </SelectItem>
                    ))}
                  </React.Fragment>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Context (used as RAG/profile prompt)</Label>
            <Textarea
              value={settings.contextWindow}
              onChange={(e) => onSettingsChange({ contextWindow: e.target.value })}
              placeholder="Your profile context: skills, goals, target roles, constraints…"
              className="min-h-[110px] rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">API key (not saved)</Label>
            <Input
              type="password"
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              placeholder="Not persisted. Lost on refresh."
              className="h-10 rounded-xl"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" className="flex-1" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getStoredProfile(): UserProfile {
  return loadProfile();
}

