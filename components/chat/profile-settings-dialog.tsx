"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  Loader2, 
  UserRound, 
  Key, 
  Github, 
  Database, 
  ShieldCheck, 
  Check, 
  Sparkles, 
  Server,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { AVAILABLE_MODELS, type ChatSettings } from "./chat-store";
import { useToast } from "@/hooks/use-toast";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
import { ProfilePhotoCropDialog } from "@/components/chat/profile-photo-crop-dialog";
import { EMAIL_PROVIDER_LABELS, normalizeDefaultEmailProvider, type EmailProviderId } from "@/lib/email-compose-urls";
import { TRANSLATION_LANGUAGES } from "@/lib/translation";
import { GitHubSyncService, type GitHubSyncConfig } from "@/lib/github/sync";
import { useAuth } from "@/lib/auth/auth-provider";
import { Eye, EyeOff, Download } from "lucide-react";

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  website: string;
  github: string;
  profilePicture?: string;
  defaultEmailProvider: string;
  targetRoles: string;
  careerNotes: string;
  // Complete Master Career Vault (RAG Profile)
  masterSkills?: string;
  masterExperience?: string;
  masterProjects?: string;
  masterEducation?: string;
  masterCertifications?: string;
  ragKnowledgeBase?: string;
  // GitHub zero-knowledge settings
  githubToken?: string;
  githubRepo?: string;
  autoSyncGithub?: boolean;
  encryptionPassphrase?: string;
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
  masterSkills: "",
  masterExperience: "",
  masterProjects: "",
  masterEducation: "",
  masterCertifications: "",
  ragKnowledgeBase: "",
  githubToken: "",
  githubRepo: "career-agent-backup",
  autoSyncGithub: false,
  encryptionPassphrase: "",
};

export interface ProviderKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  deepseek?: string;
  groq?: string;
  openrouter?: string;
  ollamaEndpoint?: string;
}

const AI_PROVIDER_CONFIG_STORAGE_ID = "ai-provider-configs";

function loadProviderKeys(): ProviderKeys {
  if (typeof window === "undefined") return {};
  try {
    const raw = tryLocalStorageGet(AI_PROVIDER_CONFIG_STORAGE_ID);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProviderKeys(keys: ProviderKeys) {
  tryLocalStorageSet(AI_PROVIDER_CONFIG_STORAGE_ID, JSON.stringify(keys));
}

function loadProfile(): UserProfile {
  if (typeof window === "undefined") return { ...EMPTY_PROFILE };
  try {
    const raw = tryLocalStorageGet(PROFILE_STORE_ID);
    if (!raw) return { ...EMPTY_PROFILE };
    const p = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name: p.name || "",
      email: p.email || "",
      phone: p.phone || "",
      location: p.location || "",
      linkedin: p.linkedin || "",
      website: p.website || "",
      github: p.github || "",
      profilePicture: p.profilePicture || "",
      defaultEmailProvider: p.defaultEmailProvider || "gmail",
      targetRoles: p.targetRoles || "",
      careerNotes: p.careerNotes || "",
      masterSkills: p.masterSkills || "",
      masterExperience: p.masterExperience || "",
      masterProjects: p.masterProjects || "",
      masterEducation: p.masterEducation || "",
      masterCertifications: p.masterCertifications || "",
      ragKnowledgeBase: p.ragKnowledgeBase || "",
      githubToken: p.githubToken || "",
      githubRepo: p.githubRepo || "career-agent-backup",
      autoSyncGithub: Boolean(p.autoSyncGithub),
      encryptionPassphrase: p.encryptionPassphrase || "",
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
  isOnboarding,
  onSkipOnboarding,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  settings: ChatSettings;
  onSettingsChange: (patch: Partial<ChatSettings>) => void;
  isOnboarding?: boolean;
  onSkipOnboarding?: () => void;
}) {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });
  const [keys, setKeys] = useState<ProviderKeys>({});
  const [saving, setSaving] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [githubTesting, setGithubTesting] = useState(false);
  const [githubStatus, setGithubStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<string>("Checking...");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { completeOnboarding, setEncryptionPassphrase } = useAuth();

  useEffect(() => {
    if (!open) return;
    setProfile(loadProfile());
    setKeys(loadProviderKeys());

    // Fetch cloud profile if logged in
    fetch("/api/user/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.isAuthenticated && data.user) {
          setDbStatus("Connected (PostgreSQL / Xata)");
          setProfile((prev) => ({
            ...prev,
            name: data.user.name || prev.name,
            email: data.user.email || prev.email,
            githubUsername: data.user.githubUsername || prev.github,
            githubRepo: data.user.githubRepo || prev.githubRepo,
          }));
        } else {
          setDbStatus("Local Mode (Anonymous)");
        }
      })
      .catch(() => setDbStatus("Local Mode"));
  }, [open]);

  const modelsByProvider = useMemo(() => {
    return AVAILABLE_MODELS.reduce<Record<string, typeof AVAILABLE_MODELS>>((acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    }, {});
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    saveProfile(profile);
    saveProviderKeys(keys);
    
    if (profile.encryptionPassphrase) {
      setEncryptionPassphrase(profile.encryptionPassphrase);
    }

    try {
      if (isOnboarding) {
        await completeOnboarding({
          name: profile.name,
          email: profile.email,
          bio: profile.careerNotes,
          targetRoles: profile.targetRoles.split(",").map((r) => r.trim()).filter(Boolean),
          apiKeys: Object.entries(keys).reduce((acc, [k, v]) => {
            if (v) acc[k] = v;
            return acc;
          }, {} as Record<string, string>),
          github: (profile.github && profile.githubToken) ? {
            username: profile.github,
            token: profile.githubToken,
            repo: profile.githubRepo || "career-agent-backup",
          } : undefined,
          encryptionPassphrase: profile.encryptionPassphrase,
        });
      } else {
        // Sync with PostgreSQL backend if authenticated
        await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: profile.name,
            avatarUrl: profile.profilePicture,
            githubUsername: profile.github,
            githubRepo: profile.githubRepo,
            githubToken: profile.githubToken,
            bio: profile.careerNotes,
          }),
        });

        // Save custom API keys to DB
        for (const [provider, keyVal] of Object.entries(keys)) {
          if (keyVal) {
            await fetch("/api/user/keys", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                provider,
                apiKey: keyVal,
                modelName: provider === "local" ? "local" : "default",
              }),
            });
          }
        }
      }
    } catch {
      // Local fallback
    }

    onSettingsChange({
      model: settings.model,
      contextWindow: settings.contextWindow,
      defaultLanguage: settings.defaultLanguage,
    });

    toast({
      title: "Settings Saved",
      description: "Profile, API keys, and cloud configurations updated successfully.",
    });

    setSaving(false);
    onOpenChange(false);
  };

  const handleTestGithub = async () => {
    if (!profile.githubToken || !profile.github || !profile.githubRepo) {
      setGithubStatus({ success: false, message: "Enter GitHub username, repository, and Personal Access Token." });
      return;
    }
    setGithubTesting(true);
    setGithubStatus(null);
    const res = await GitHubSyncService.testConnection({
      token: profile.githubToken,
      owner: profile.github,
      repo: profile.githubRepo,
    });
    setGithubTesting(false);
    setGithubStatus(res);
  };

  const onPickPhoto: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Invalid image", description: "Choose a JPEG, PNG, or WebP image." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageToCrop(reader.result);
        setCropOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const onCropDone = (dataUrl: string) => {
    setProfile((prev) => ({ ...prev, profilePicture: dataUrl }));
    setImageToCrop(null);
    toast({ title: "Photo Updated", description: "Profile photo saved." });
  };

  const generatePassphrase = () => {
    const array = new Uint32Array(4);
    window.crypto.getRandomValues(array);
    const key = Array.from(array, dec => dec.toString(16).padStart(8, "0")).join("");
    setProfile(p => ({ ...p, encryptionPassphrase: key }));
    toast({ title: "Key Generated", description: "A secure passphrase has been generated." });
  };

  const downloadPassphrase = () => {
    if (!profile.encryptionPassphrase) {
      toast({ variant: "destructive", title: "No Passphrase", description: "Generate or enter a passphrase first." });
      return;
    }
    const blob = new Blob([`Career Assistant AI - Master Encryption Passphrase\n\n${profile.encryptionPassphrase}\n\nKeep this safe! If you lose this, you cannot decrypt your data on a new device.`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "career_ai_encryption_key.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-2xl max-h-[88dvh] overflow-y-auto rounded-2xl border-border/70 bg-background/95 backdrop-blur-xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <Sparkles className="h-4 w-4" />
            <span>Workspace Control Center</span>
          </div>
          <DialogTitle className="text-xl font-bold">Profile & Model Settings</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your personal profile, custom AI provider API keys, GitHub backup sync, and database storage.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
          <TabsList className="grid grid-cols-4 w-full h-9">
            <TabsTrigger value="profile" className="text-xs gap-1">
              <UserRound className="h-3.5 w-3.5" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs gap-1 font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Memory Vault</span>
            </TabsTrigger>
            <TabsTrigger value="keys" className="text-xs gap-1">
              <Key className="h-3.5 w-3.5" />
              <span>API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="github" className="text-xs gap-1">
              <Github className="h-3.5 w-3.5" />
              <span>GitHub</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: PROFILE */}
          <TabsContent value="profile" className="space-y-4 pt-3">
            <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
                  {profile.profilePicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profilePicture} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound className="h-7 w-7 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <Label className="text-xs font-semibold">Profile Photo</Label>
                  <p className="text-[11px] text-muted-foreground">Used on your resumes, PDF exports, and career profile.</p>
                </div>
              </div>
              <div className="flex gap-2 sm:ml-auto">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-3.5 w-3.5" /> Upload & Crop
                </Button>
                {profile.profilePicture && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-destructive" onClick={() => setProfile((p) => ({ ...p, profilePicture: "" }))}>
                    Remove
                  </Button>
                )}
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
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Alex Morgan" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email Address</Label>
                <Input value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="alex@example.com" className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 019-2834" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input value={profile.location} onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))} placeholder="San Francisco, CA / Remote" className="h-9 text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">LinkedIn Profile</Label>
                <Input value={profile.linkedin} onChange={(e) => setProfile((p) => ({ ...p, linkedin: e.target.value }))} placeholder="linkedin.com/in/alexmorgan" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">GitHub Username</Label>
                <Input value={profile.github} onChange={(e) => setProfile((p) => ({ ...p, github: e.target.value }))} placeholder="alexmorgan" className="h-9 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Target Roles (for AI tailoring & ATS matching)</Label>
              <Input value={profile.targetRoles} onChange={(e) => setProfile((p) => ({ ...p, targetRoles: e.target.value }))} placeholder="e.g. Senior Software Engineer, Full Stack Tech Lead" className="h-9 text-xs" />
            </div>
          </TabsContent>

          {/* TAB 2: MASTER MEMORY VAULT (PLAIN MARKDOWN) */}
          <TabsContent value="memory" className="space-y-3 pt-3">
            <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs text-muted-foreground leading-relaxed">
              <div className="font-semibold text-primary flex items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Memory Vault (Markdown)</span>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                  {(profile.ragKnowledgeBase || "").length} chars
                </span>
              </div>
              Add your career goals, notes, full job history, projects, metrics, skills, or attached document excerpts here in Markdown. The AI assistant grounds on this Memory Vault for all resume, cover letter, and chat responses.
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Master Memory Vault Markdown</Label>
                {!profile.ragKnowledgeBase && (
                  <button
                    type="button"
                    onClick={() => setProfile((p) => ({
                      ...p,
                      ragKnowledgeBase: `# Master Career Memory Vault\n\n## Career Goals & Target Roles\n- Target: Senior / Staff Software Engineer, AI Engineer\n- Focus: Agentic AI systems, scalable full-stack applications, robotics\n\n## Summary\nSenior Software Engineer with 6+ years building scalable distributed systems, modern web apps, and AI applications.\n\n## Core Skills\n- Languages: TypeScript, JavaScript, Python, Go, SQL\n- Frontend: React, Next.js, Tailwind CSS\n- Backend & Cloud: Node.js, Express, FastAPI, PostgreSQL, Redis, Docker, AWS, CI/CD\n\n## Work History\n### Senior Full Stack Engineer — TechCorp (2022 – Present)\n- Architected high-throughput microservices handling $20M+ monthly transaction volume.\n- Reduced API latency by 45% through Redis caching and PostgreSQL query optimization.\n- Mentored 5 junior engineers and led migration to Next.js App Router.\n\n### Software Engineer — BetaApp (2020 – 2022)\n- Developed core real-time analytics dashboard with 100k+ active users.\n- Built automated CI/CD deployment pipelines on GitHub Actions.\n\n## Key Projects\n- AI Career Assistant: Full stack career application with real-time model streaming, ATS analyzer, and LaTeX generator.\n\n## Education & Certifications\n- B.S. in Computer Science — State University (2016 – 2020)\n- AWS Certified Solutions Architect Associate (2023)\n`
                    }))}
                    className="text-[11px] text-primary hover:underline font-medium"
                  >
                    + Load Markdown Template
                  </button>
                )}
              </div>
              <Textarea
                value={profile.ragKnowledgeBase || ""}
                onChange={(e) => setProfile((p) => ({ ...p, ragKnowledgeBase: e.target.value }))}
                placeholder="# Master Career Memory Vault&#10;&#10;## Career Goals & Notes&#10;- Target: Senior Software Engineer...&#10;&#10;## Skills&#10;- TypeScript, Python, React, Next.js, Node.js, AWS, PostgreSQL...&#10;&#10;## Work Experience&#10;### Senior Software Engineer — Company A (2022-Present)&#10;- Led backend redesign reducing latency by 40%...&#10;&#10;## Projects & Education&#10;- B.S. Computer Science, AWS Certified..."
                className="min-h-[280px] max-h-[380px] text-xs font-mono leading-relaxed"
              />
            </div>
          </TabsContent>

          {/* TAB 3: API KEYS */}
          <TabsContent value="keys" className="space-y-3 pt-3">
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground">
              Add your custom API keys to unlock higher rate limits, custom quotas, or private Ollama instances. Keys are stored encrypted in your database profile or local browser storage.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Google Gemini API Key</span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    Get Key <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  type="password"
                  value={keys.google || ""}
                  onChange={(e) => setKeys((k) => ({ ...k, google: e.target.value }))}
                  placeholder="AIzaSy..."
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>OpenAI API Key</span>
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    Get Key <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  type="password"
                  value={keys.openai || ""}
                  onChange={(e) => setKeys((k) => ({ ...k, openai: e.target.value }))}
                  placeholder="sk-proj-..."
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Anthropic API Key</span>
                  <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    Get Key <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  type="password"
                  value={keys.anthropic || ""}
                  onChange={(e) => setKeys((k) => ({ ...k, anthropic: e.target.value }))}
                  placeholder="sk-ant-..."
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Groq API Key</span>
                  <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    Get Key <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  type="password"
                  value={keys.groq || ""}
                  onChange={(e) => setKeys((k) => ({ ...k, groq: e.target.value }))}
                  placeholder="gsk_..."
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>DeepSeek API Key</span>
                  <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                    Get Key <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </Label>
                <Input
                  type="password"
                  value={keys.deepseek || ""}
                  onChange={(e) => setKeys((k) => ({ ...k, deepseek: e.target.value }))}
                  placeholder="sk-..."
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs flex items-center justify-between">
                  <span>Ollama Local URL</span>
                  <span className="text-[10px] text-muted-foreground">Default: http://localhost:11434</span>
                </Label>
                <Input
                  value={keys.ollamaEndpoint || ""}
                  onChange={(e) => setKeys((k) => ({ ...k, ollamaEndpoint: e.target.value }))}
                  placeholder="http://localhost:11434"
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: GITHUB SYNC */}
          <TabsContent value="github" className="space-y-3 pt-3">
            <div className="p-3 rounded-xl border border-border/60 bg-muted/30 text-xs text-muted-foreground leading-relaxed">
              <strong>Zero-Knowledge GitHub Backup</strong> commits your resumes, PDF versions, and chat logs directly to your private GitHub repository for 100% free and private storage.
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">GitHub Username</Label>
                <Input
                  value={profile.github}
                  onChange={(e) => setProfile((p) => ({ ...p, github: e.target.value }))}
                  placeholder="e.g. octocat"
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Backup Repository Name</Label>
                <Input
                  value={profile.githubRepo}
                  onChange={(e) => setProfile((p) => ({ ...p, githubRepo: e.target.value }))}
                  placeholder="career-agent-backup"
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs flex items-center justify-between">
                <span>GitHub Personal Access Token (Classic / Fine-Grained)</span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=CareerAgent+Backup"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                >
                  Create Token (repo scope) <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </Label>
              <Input
                type="password"
                value={profile.githubToken || ""}
                onChange={(e) => setProfile((p) => ({ ...p, githubToken: e.target.value }))}
                placeholder="ghp_..."
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Master Encryption Passphrase</span>
                <div className="flex items-center gap-3">
                   <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                   >
                     {showPassphrase ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                     {showPassphrase ? "Hide" : "Show"}
                   </button>
                   <button
                     type="button"
                     onClick={generatePassphrase}
                     className="text-[10px] text-primary hover:underline flex items-center gap-1"
                   >
                     Auto Generate
                   </button>
                </div>
              </Label>
              <div className="flex gap-2">
                <Input
                  type={showPassphrase ? "text" : "password"}
                  placeholder="Create or generate a strong secret passphrase..."
                  value={profile.encryptionPassphrase || ""}
                  onChange={(e) => setProfile((p) => ({ ...p, encryptionPassphrase: e.target.value }))}
                  className="h-9 text-xs flex-1"
                />
                <Button type="button" variant="outline" size="sm" className="h-9 px-3 shrink-0" onClick={downloadPassphrase}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Remember this passphrase to decrypt past chats. We strongly recommend downloading it.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs h-8 gap-1.5"
                onClick={handleTestGithub}
                disabled={githubTesting}
              >
                {githubTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                <span>Test Connection</span>
              </Button>

              {githubStatus && (
                <span className={`text-xs font-medium flex items-center gap-1 ${githubStatus.success ? "text-emerald-500" : "text-destructive"}`}>
                  {githubStatus.success ? <Check className="h-3.5 w-3.5" /> : null}
                  {githubStatus.message}
                </span>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t border-border/60">
          {isOnboarding ? (
             <Button
                type="button"
                variant="ghost"
                className="flex-1 text-xs h-9 text-muted-foreground"
                onClick={() => {
                   if (onSkipOnboarding) onSkipOnboarding();
                   else onOpenChange(false);
                }}
                disabled={saving}
              >
                Skip & Use Incognito Mode
              </Button>
          ) : (
             <Button type="button" variant="outline" className="flex-1 text-xs h-9" onClick={() => onOpenChange(false)} disabled={saving}>
               Cancel
             </Button>
          )}
          <Button type="button" className="flex-1 text-xs h-9 font-semibold" onClick={handleSaveAll} disabled={saving}>
            {saving ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...
              </span>
            ) : isOnboarding ? (
              "Complete Setup & Launch"
            ) : (
              "Save & Apply"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function getStoredProfile(): UserProfile {
  return loadProfile();
}
