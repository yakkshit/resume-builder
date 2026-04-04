"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AVAILABLE_MODELS, type ChatSettings } from "./chat-store";
import { useToast } from "@/hooks/use-toast";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
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
  defaultEmailProvider: "gmail",
  targetRoles: "",
  careerNotes: "",
};

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

function saveProfile(p: UserProfile) {
  try {
    tryLocalStorageSet(PROFILE_STORE_ID, JSON.stringify(p));
    window.dispatchEvent(new CustomEvent("ai-chat-profile-updated"));
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
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });
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
    saveProfile(profile);
    onSettingsChange({
      model: settings.model,
      contextWindow: settings.contextWindow,
      openAiCompatBaseUrl: settings.openAiCompatBaseUrl,
      openAiCompatModel: settings.openAiCompatModel,
      huggingFaceCustomModel: settings.huggingFaceCustomModel,
    });
    toast({
      title: "Profile saved",
      description: "Global profile, RAG context, and chat settings have been updated.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85dvh] overflow-y-auto rounded-2xl border-border/60 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-base">Profile & Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pb-1">
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

