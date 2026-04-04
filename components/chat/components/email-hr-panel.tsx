"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Mail, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { CardTitle } from "@/components/ui/card";
import { ChatArtifactWindow } from "@/components/chat/chat-artifact-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  buildEmailComposeUrl,
  EMAIL_PROVIDER_LABELS,
  normalizeDefaultEmailProvider,
  type EmailProviderId,
} from "@/lib/email-compose-urls";
import { PROFILE_STORE_ID, getStoredProfile } from "@/components/chat/profile-settings-dialog";
import { tryLocalStorageGet } from "@/lib/safe-local-storage";

const PROVIDER_ORDER: EmailProviderId[] = ["gmail", "yahoo", "hotmail", "outlook", "mailto"];

function readResumeSummary(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = tryLocalStorageGet("resumeData");
    if (!raw) return "";
    const j = JSON.parse(raw) as Record<string, unknown>;
    const bi = j?.basicInfo as Record<string, unknown> | undefined;
    const parts = [
      typeof bi?.name === "string" ? bi.name : "",
      typeof bi?.title === "string" ? bi.title : "",
      typeof bi?.summary === "string" ? bi.summary : "",
    ].filter(Boolean);
    const text = parts.join(" — ").slice(0, 3500);
    return text;
  } catch {
    return "";
  }
}

function readContextSnippet(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = tryLocalStorageGet("ai-chat-settings");
    if (!raw) return "";
    const j = JSON.parse(raw) as { contextWindow?: string };
    return typeof j.contextWindow === "string" ? j.contextWindow.slice(0, 4000) : "";
  } catch {
    return "";
  }
}

export function EmailHrPanel({
  data = {},
  chatApiKey,
  chatModel,
}: {
  data?: Record<string, unknown>;
  chatApiKey?: string;
  /** Matches chat model selector (Gemini id) */
  chatModel?: string;
}) {
  const initial = useMemo(() => {
    const d = data as Record<string, string | undefined>;
    return {
      to: (d.to || d.hrEmail || "").trim(),
      subject: (d.subject || "").trim(),
      body: (d.body || d.message || "").trim(),
      company: (d.company || "").trim(),
      jobTitle: (d.jobTitle || d.role || "").trim(),
    };
  }, [data]);

  const [to, setTo] = useState(initial.to);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [company, setCompany] = useState(initial.company);
  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [provider, setProvider] = useState<EmailProviderId>(() =>
    normalizeDefaultEmailProvider(getStoredProfile().defaultEmailProvider),
  );
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    setTo(initial.to);
    setSubject(initial.subject);
    setBody(initial.body);
    setCompany(initial.company);
    setJobTitle(initial.jobTitle);
  }, [initial.to, initial.subject, initial.body, initial.company, initial.jobTitle]);

  useEffect(() => {
    const syncProvider = () =>
      setProvider(normalizeDefaultEmailProvider(getStoredProfile().defaultEmailProvider));
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_STORE_ID) syncProvider();
    };
    const onProfileSaved = () => syncProvider();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", syncProvider);
    window.addEventListener("ai-chat-profile-updated", onProfileSaved as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", syncProvider);
      window.removeEventListener("ai-chat-profile-updated", onProfileSaved as EventListener);
    };
  }, []);

  const openCompose = useCallback(() => {
    const url = buildEmailComposeUrl(provider, { to, subject, body });
    window.open(url, "_blank", "noopener,noreferrer");
  }, [provider, to, subject, body]);

  const refineWithAi = useCallback(async () => {
    setDraftError(null);
    const key = (chatApiKey || "").trim();
    if (!key) {
      setDraftError("Add a Google API key in Profile & Settings to generate drafts (Gemini).");
      return;
    }
    setDraftLoading(true);
    try {
      const res = await fetch("/api/email-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: key,
          model: (chatModel || "").trim() || undefined,
          hrEmail: to,
          company,
          jobTitle,
          contextText: readContextSnippet(),
          resumeSummary: readResumeSummary(),
          userNote: [subject && `Preferred subject hint: ${subject}`, body && `Starting draft / notes:\n${body}`]
            .filter(Boolean)
            .join("\n\n"),
        }),
      });
      const json = (await res.json()) as { subject?: string; body?: string; error?: string };
      if (!res.ok) {
        setDraftError(json.error || "Draft request failed");
        return;
      }
      if (json.subject) setSubject(json.subject);
      if (json.body) setBody(json.body);
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : "Network error");
    } finally {
      setDraftLoading(false);
    }
  }, [chatApiKey, chatModel, to, company, jobTitle, subject, body]);

  return (
    <ChatArtifactWindow
      variant="light"
      cardClassName="w-full overflow-hidden border-border/60 bg-background/80 shadow-lg rounded-2xl"
      headerClassName="pb-2 border-b border-border/50 bg-muted/20 !items-start"
      contentClassName="space-y-3 pt-4"
      title={
        <div className="space-y-1 min-w-0">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-500" />
            Email HR / recruiter
          </CardTitle>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Choose your provider, refine the message (optional AI assist), then open a compose window. You send the email from your own account.
          </p>
        </div>
      }
    >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">To (HR email)</Label>
            <Input
              className="h-9 text-sm rounded-lg"
              placeholder="recruiter@company.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Open draft in</Label>
            <Select value={provider} onValueChange={(v) => setProvider(v as EmailProviderId)}>
              <SelectTrigger className="h-9 text-sm rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_ORDER.map((id) => (
                  <SelectItem key={id} value={id} className="text-xs">
                    {EMAIL_PROVIDER_LABELS[id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Company (optional)</Label>
            <Input className="h-9 text-sm rounded-lg" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Role / job title (optional)</Label>
            <Input className="h-9 text-sm rounded-lg" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Subject</Label>
          <Input className="h-9 text-sm rounded-lg" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Message</Label>
          <Textarea className="min-h-[140px] text-sm rounded-xl" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>

        {draftError && <p className="text-xs text-destructive">{draftError}</p>}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-xl"
            onClick={refineWithAi}
            disabled={draftLoading}
          >
            {draftLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Refine with AI
          </Button>
          <Button type="button" size="sm" className="gap-1.5 rounded-xl flex-1" onClick={openCompose}>
            <ExternalLink className="w-3.5 h-3.5" />
            Open draft in {EMAIL_PROVIDER_LABELS[provider]}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          AI drafting uses Google Gemini via your chat API key (multistep tool flow on the server). Default provider comes from your global profile.
        </p>
    </ChatArtifactWindow>
  );
}
