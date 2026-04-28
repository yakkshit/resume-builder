"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Loader2, UserRound } from "lucide-react";
import { AVAILABLE_MODELS, type ChatSettings } from "./chat-store";
import { useToast } from "@/hooks/use-toast";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
import { ProfilePhotoCropDialog } from "@/components/chat/profile-photo-crop-dialog";
import { EMAIL_PROVIDER_LABELS, normalizeDefaultEmailProvider, type EmailProviderId } from "@/lib/email-compose-urls";
import {
  isOpenAiCompatibleChatModel,
  isHuggingFaceCustomHubModel,
  needsHuggingFaceCustomModelField,
} from "@/lib/chat-provider-settings";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  github: string;
  /** data URL or https — used on resume / PDF when global profile context is on */
  profilePicture?: string;
  /** Preferred provider when opening “Email HR” compose links */
  defaultEmailProvider: string;
  /** Comma-separated or free-text target roles for RAG-style context */
  targetRoles: string;
  /** Long-form career goals, constraints, preferences (chunked into knowledge store) */
  careerNotes: string;
};

export const PROFILE_STORE_ID = "ai-chat-profile";

const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  website: "",
  github: "",
  profilePicture: "",
  defaultEmailProvider: "gmail",
  targetRoles: "",
  careerNotes: "",
};

function safeStoredProfilePicture(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim();
  if (!s) return "";
  if (s.startsWith("data:image/") || s.startsWith("https://") || s.startsWith("http://")) return s;
  return "";
}

/** Keep resume builder localStorage in sync so PDF preview matches the global profile photo */
function syncResumeProfilePicture(picture: string | undefined) {
  try {
    const raw = tryLocalStorageGet("resumeData");
    let base: Record<string, unknown> = {};
    if (raw) {
      try {
        base = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        base = {};
      }
    }
    const prev =
      base.basicInfo && typeof base.basicInfo === "object" && !Array.isArray(base.basicInfo)
        ? (base.basicInfo as Record<string, unknown>)
        : {};
    base.basicInfo = { ...prev };
    const pic = safeStoredProfilePicture(picture ?? "");
    if (pic) (base.basicInfo as Record<string, unknown>).profilePicture = pic;
    else delete (base.basicInfo as Record<string, unknown>).profilePicture;
    tryLocalStorageSet("resumeData", JSON.stringify(base));
    window.dispatchEvent(new CustomEvent("resume-storage-updated"));
  } catch {
    // quota / private mode
  }
}

function loadProfile(): UserProfile {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };
  try {
    const raw = tryLocalStorageGet(PROFILE_STORE_ID);
    if (!raw) return { ...EMPTY_PROFILE };
    const p = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: typeof p.name === "string" ? p.name : "",
      email: typeof p.email === "string" ? p.email : "",
      phone: typeof p.phone === "string" ? p.phone : "",
      location: typeof p.location === "string" ? p.location : "",
      linkedin: typeof p.linkedin === "string" ? p.linkedin : "",
      website: typeof p.website === "string" ? p.website : "",
      github: typeof p.github === "string" ? p.github : "",
      profilePicture: safeStoredProfilePicture(p.profilePicture),
      defaultEmailProvider:
        typeof p.defaultEmailProvider === "string" && p.defaultEmailProvider.trim()
          ? p.defaultEmailProvider.trim()
          : "gmail",
      targetRoles: typeof p.targetRoles === "string" ? p.targetRoles : "",
      careerNotes: typeof p.careerNotes === "string" ? p.careerNotes : "",
    };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

function saveProfile(p: UserProfile): boolean {
  try {
    tryLocalStorageSet(PROFILE_STORE_ID, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent("ai-chat-profile-updated"));
    return true;
  } catch {
    return false;
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
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });
  const [saving, setSaving] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setProfile(loadProfile());
  }, [open]);

  const modelsByProvider = useMemo(() => {
    return AVAILABLE_MODELS.reduce<Record<string, typeof AVAILABLE_MODELS>>((acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    }, {});
  }, []);

  const handleSave = () => {
    setSaving(true);
    const ok = saveProfile(profile);
    if (!ok) {
      setSaving(false);
      toast({
        variant: "destructive",
        title: "Could not save profile",
        description: "Your browser storage may be full. Try removing the profile photo or clearing site data.",
      });
      return;
    }
    syncResumeProfilePicture(profile.profilePicture);
    onSettingsChange({
      model: settings.model,
      contextWindow: settings.contextWindow,
      openAiCompatBaseUrl: settings.openAiCompatBaseUrl,
      openAiCompatModel: settings.openAiCompatModel,
      huggingFaceCustomModel: settings.huggingFaceCustomModel,
    });
    toast({
      title: "Profile saved",
      description: "Global profile, photo on your resume, RAG context, and chat settings are updated.",
    });
    toast({
      title: "AI context refreshed",
      description: "Your updated profile will be used in upcoming AI responses.",
    });
    setSaving(false);
    onOpenChange(false);
  };

  const onPickPhoto: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please choose an image file (JPEG, PNG, or WebP).",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = typeof reader.result === "string" ? reader.result : "";
      if (!url) return;
      setImageToCrop(url);
      setCropOpen(true);
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: "Could not read image", description: "Try another file." });
    };
    reader.readAsDataURL(file);
  };

  const onCropDone = (dataUrl: string) => {
    const prevPic = profile.profilePicture;
    const next = { ...profile, profilePicture: dataUrl };
    setProfile(next);
    const ok = saveProfile(next);
    if (!ok) {
      toast({
        variant: "destructive",
        title: "Could not save photo",
        description: "Storage may be full. Try a smaller image or clear site data.",
      });
      setProfile((p) => ({ ...p, profilePicture: prevPic }));
      return;
    }
    syncResumeProfilePicture(dataUrl);
    setImageToCrop(null);
    toast({
      title: "Photo saved",
      description: "Cropped image is stored in your profile and synced to your resume.",
    });
  };

  const clearPhoto = () => {
    const next = { ...profile, profilePicture: "" };
    setProfile(next);
    const ok = saveProfile(next);
    if (!ok) {
      toast({ variant: "destructive", title: "Could not update profile", description: "Try again in a moment." });
      return;
    }
    syncResumeProfilePicture(undefined);
    toast({ title: "Photo removed", description: "Profile photo cleared from your resume and saved settings." });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85dvh] overflow-y-auto rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Profile & Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pb-1">
          <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Changes here sync to your global profile, resume identity fields, and AI context memory for better responses.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-background">
                {profile.profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profilePicture} alt="" className="h-full w-full object-cover" />
                ) : (
                  <UserRound className="h-8 w-8 text-muted-foreground" aria-hidden />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <Label className="text-xs font-medium">Profile photo</Label>
                <p className="text-[10px] text-muted-foreground leading-snug">
                  Crop a square headshot. The same image appears on your resume and PDF exports when profile context is on.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto sm:justify-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={onPickPhoto}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />
                Upload & crop
              </Button>
              {profile.profilePicture ? (
                <Button type="button" variant="ghost" size="sm" className="rounded-xl text-destructive" onClick={clearPhoto}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <ProfilePhotoCropDialog
            open={cropOpen}
            onOpenChange={(v) => {
              setCropOpen(v);
              if (!v) setImageToCrop(null);
            }}
            imageSrc={imageToCrop}
            onCropComplete={onCropDone}
          />

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

          <div className="space-y-2">
            <Label className="text-xs">Default email provider (HR compose)</Label>
            <Select
              value={normalizeDefaultEmailProvider(profile.defaultEmailProvider)}
              onValueChange={(v) => setProfile((p) => ({ ...p, defaultEmailProvider: v }))}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue placeholder="Provider" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(EMAIL_PROVIDER_LABELS) as EmailProviderId[]).map((id) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    {EMAIL_PROVIDER_LABELS[id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground">
              Used when you open “Email HR” drafts. Native desktop mail integration is planned separately.
            </p>
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs">GitHub</Label>
              <Input
                value={profile.github}
                onChange={(e) => setProfile((p) => ({ ...p, github: e.target.value }))}
                placeholder="github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Target roles (for AI context)</Label>
              <Input
                value={profile.targetRoles}
                onChange={(e) => setProfile((p) => ({ ...p, targetRoles: e.target.value }))}
                placeholder="e.g. Embedded SWE, ML Engineer, Staff Backend"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Career notes & preferences</Label>
            <Textarea
              value={profile.careerNotes}
              onChange={(e) => setProfile((p) => ({ ...p, careerNotes: e.target.value }))}
              placeholder="Relocation, visa, salary band, industries you want — used as retrieved memory in chat."
              className="min-h-[88px] rounded-xl"
            />
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-2.5">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Auto-merge assistant resume</Label>
              <p className="text-[10px] text-muted-foreground leading-snug">
                When the assistant sends a CV block, merge it into your saved resume automatically.
              </p>
            </div>
            <Switch
              checked={settings.autoMergeAssistantResume !== false}
              onCheckedChange={(v) => onSettingsChange({ autoMergeAssistantResume: v })}
              aria-label="Toggle auto-merge resume from assistant"
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

          {isOpenAiCompatibleChatModel(settings.model) ? (
            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
              <Label className="text-xs font-medium">OpenAI-compatible API</Label>
              <p className="text-[10px] text-muted-foreground leading-snug">
                Shown because <span className="font-medium text-foreground">OpenAI-compatible</span> is your selected model. Same values as the chat composer side panel (
                <a
                  className="underline underline-offset-2 hover:text-foreground"
                  href="https://ai-sdk.dev/providers/openai-compatible-providers"
                  target="_blank"
                  rel="noreferrer"
                >
                  docs
                </a>
                ).
              </p>
              <Input
                value={settings.openAiCompatBaseUrl}
                onChange={(e) => onSettingsChange({ openAiCompatBaseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="h-10 rounded-xl"
                autoComplete="off"
              />
              <Input
                value={settings.openAiCompatModel}
                onChange={(e) => onSettingsChange({ openAiCompatModel: e.target.value })}
                placeholder="Model id, e.g. gpt-4o-mini"
                className="h-10 rounded-xl"
                autoComplete="off"
              />
            </div>
          ) : null}

          {needsHuggingFaceCustomModelField(settings.model) ? (
            <div className="space-y-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-3">
              <Label className="text-xs font-medium">
                {isHuggingFaceCustomHubModel(settings.model)
                  ? "Hugging Face Hub model id (required)"
                  : "Hugging Face Hub model (optional override)"}
              </Label>
              <p className="text-[10px] text-muted-foreground leading-snug">
                {isHuggingFaceCustomHubModel(settings.model)
                  ? "For “HF custom (Hub id)” you must enter the full Hub id. Same field as the Hub side panel in chat."
                  : "Leave empty to use the model you selected in the list. When set, this Hub id is sent to the API instead."}
              </p>
              <Input
                value={settings.huggingFaceCustomModel}
                onChange={(e) => onSettingsChange({ huggingFaceCustomModel: e.target.value })}
                placeholder="e.g. meta-llama/Llama-3.1-8B-Instruct"
                className="h-10 rounded-xl font-mono text-xs"
                autoComplete="off"
              />
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="inline-flex items-center gap-1.5">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Save"
              )}
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

