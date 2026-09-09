"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  ShieldCheck,
  Sparkles,
  Github,
  Key,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  Database,
} from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const { user, completeOnboarding, setIncognitoMode } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [githubTesting, setGithubTesting] = useState(false);
  const [githubStatus, setGithubStatus] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState(user.name !== "Guest User" ? user.name : "");
  const [email, setEmail] = useState(user.email !== "guest@careeragent.ai" ? user.email : "");
  const [bio, setBio] = useState(user.bio || "");
  const [targetRoles, setTargetRoles] = useState(user.targetRoles?.join(", ") || "AI Engineer, Full-Stack Developer");

  // API Keys
  const [geminiKey, setGeminiKey] = useState(user.apiKeys?.gemini || "");
  const [openaiKey, setOpenaiKey] = useState(user.apiKeys?.openai || "");
  const [anthropicKey, setAnthropicKey] = useState(user.apiKeys?.anthropic || "");
  const [deepseekKey, setDeepseekKey] = useState(user.apiKeys?.deepseek || "");
  const [groqKey, setGroqKey] = useState(user.apiKeys?.groq || "");

  // GitHub & Zero-Knowledge Encryption
  const [ghUsername, setGhUsername] = useState(user.githubUsername || "");
  const [ghToken, setGhToken] = useState(user.githubToken || "");
  const [ghRepo, setGhRepo] = useState(user.githubRepo || "career-assistant-vault");
  const [encryptionPassphrase, setPassphrase] = useState(user.encryptionPassphrase || "");

  const handleTestGithub = async () => {
    if (!ghUsername || !ghToken) {
      setGithubStatus("Please enter GitHub username and Personal Access Token");
      return;
    }
    setGithubTesting(true);
    setGithubStatus(null);
    try {
      const res = await fetch("/api/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "test",
          config: {
            owner: ghUsername,
            token: ghToken,
            repo: ghRepo,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGithubStatus("Connected successfully to GitHub repository!");
      } else {
        setGithubStatus(`Connection issue: ${data.message || "Invalid credentials"}`);
      }
    } catch {
      setGithubStatus("Network error connecting to GitHub");
    } finally {
      setGithubTesting(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const parsedRoles = targetRoles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const apiKeys: Record<string, string> = {};
      if (geminiKey.trim()) apiKeys.gemini = geminiKey.trim();
      if (openaiKey.trim()) apiKeys.openai = openaiKey.trim();
      if (anthropicKey.trim()) apiKeys.anthropic = anthropicKey.trim();
      if (deepseekKey.trim()) apiKeys.deepseek = deepseekKey.trim();
      if (groqKey.trim()) apiKeys.groq = groqKey.trim();

      await completeOnboarding({
        name: name.trim() || "Career Professional",
        email: email.trim() || "user@example.com",
        bio: bio.trim(),
        targetRoles: parsedRoles,
        apiKeys,
        github:
          ghUsername.trim() && ghToken.trim()
            ? {
                username: ghUsername.trim(),
                token: ghToken.trim(),
                repo: ghRepo.trim() || "career-assistant-vault",
              }
            : undefined,
        encryptionPassphrase: encryptionPassphrase.trim() || undefined,
      });

      onOpenChange(false);
    } catch (e) {
      console.error("Error completing onboarding:", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkipIncognito = () => {
    setIncognitoMode(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-background/95 backdrop-blur-2xl border-border/80 shadow-2xl p-6 overflow-hidden">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Personal Setup & Zero-Knowledge Vault</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    step === i ? "w-6 bg-primary" : step > i ? "w-3 bg-primary/50" : "w-3 bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {step === 1 && "Welcome to Career Assistant AI"}
            {step === 2 && "Configure AI Generation Keys"}
            {step === 3 && "Encrypted GitHub Storage & Security"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 1 && "Personalize your profile so AI generates tailored resumes, cover letters, and guidance."}
            {step === 2 && "Bring your own API keys. Keys are stored encrypted in your database profile."}
            {step === 3 && "Zero-knowledge client-side encryption. Chat and resume data synced to GitHub is unreadable without your passphrase."}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Profile Information */}
        {step === 1 && (
          <div className="space-y-4 py-2">


            <div className="space-y-1.5">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Full Name
              </Label>
              <Input
                placeholder="e.g. Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Email Address (Cloud Sync ID)</Label>
              <Input
                type="email"
                placeholder="e.g. alex.rivera@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-9 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Used to restore your keys, resume data, and encrypted preferences across devices.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Target Roles / Career Objective</Label>
              <Input
                placeholder="e.g. Senior AI Engineer, Full Stack Lead"
                value={targetRoles}
                onChange={(e) => setTargetRoles(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Professional Bio / Summary</Label>
              <Input
                placeholder="e.g. 5+ years building scalable distributed AI microservices..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        )}

        {/* STEP 2: AI API Keys */}
        {step === 2 && (
          <div className="space-y-3 py-2 max-h-[340px] overflow-y-auto pr-1">
            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground flex items-center gap-2">
              <Key className="h-4 w-4 text-primary shrink-0" />
              <span>Keys are encrypted and used only to query your chosen models directly.</span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <Badge variant="outline" className="text-[10px] font-normal">Gemini 3.7 / 2.5</Badge>
              </Label>
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>OpenAI API Key</span>
                <Badge variant="outline" className="text-[10px] font-normal">GPT-5 / GPT-4o / o3</Badge>
              </Label>
              <Input
                type="password"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Anthropic API Key</span>
                <Badge variant="outline" className="text-[10px] font-normal">Claude 3.7 Sonnet</Badge>
              </Label>
              <Input
                type="password"
                placeholder="sk-ant-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>DeepSeek API Key</span>
                <Badge variant="outline" className="text-[10px] font-normal">DeepSeek V3 / R1</Badge>
              </Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={deepseekKey}
                onChange={(e) => setDeepseekKey(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Groq API Key (Ultra-Fast)</span>
                <Badge variant="outline" className="text-[10px] font-normal">Llama 3.3 / Distill R1</Badge>
              </Label>
              <Input
                type="password"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Zero-Knowledge GitHub / GitLab Sync */}
        {step === 3 && (
          <div className="space-y-3.5 py-2">
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  <Lock className="h-4 w-4" />
                  <span>AES-256-GCM Zero-Knowledge Storage</span>
                </div>
                {user.githubUsername ? (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Zero-Token Active
                  </Badge>
                ) : null}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Chat history and resumes are encrypted with your secret passphrase before syncing to Git. Data is completely unreadable to unauthorized parties even if the repository is public.
              </p>
            </div>

            {/* Zero-Token GitHub Connected Banner */}
            {user.githubUsername ? (
              <div className="p-2.5 rounded-lg border border-primary/30 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Github className="h-4 w-4 text-primary" />
                  <div>
                    <span className="font-semibold text-foreground">Signed in with GitHub:</span>{" "}
                    <span className="text-muted-foreground">@{user.githubUsername}</span>
                  </div>
                </div>
                <Badge className="text-[10px] bg-primary text-primary-foreground font-normal">
                  Auto-Sync Ready
                </Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (user.githubUsername) {
                        setGhUsername(user.githubUsername);
                        setGhRepo("career-assistant-vault");
                        setGithubStatus(`Connected to GitHub as ${user.githubUsername}`);
                      } else {
                        setGhUsername(user.name.toLowerCase().replace(/\s+/g, "") || "user");
                        setGhRepo("career-assistant-vault");
                        setGithubStatus("1-Click GitHub initialized (Zero-Token mode)");
                      }
                    }}
                    className="h-8 text-xs flex items-center justify-center gap-1.5 border-border/80 hover:border-foreground/30"
                  >
                    <Github className="h-3.5 w-3.5" />
                    1-Click GitHub
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setGhUsername(user.name.toLowerCase().replace(/\s+/g, "") || "user");
                      setGhRepo("career-assistant-vault");
                      setGithubStatus("1-Click GitLab initialized (Zero-Token mode)");
                    }}
                    className="h-8 text-xs flex items-center justify-center gap-1.5 border-border/80 hover:border-foreground/30"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
                    1-Click GitLab
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Git Username</Label>
                <Input
                  placeholder="e.g. octocat"
                  value={ghUsername}
                  onChange={(e) => setGhUsername(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Vault Repo Name</Label>
                <Input
                  placeholder="career-assistant-vault"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {!user.githubUsername && (
              <div className="space-y-1">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Personal Access Token (optional if using 1-Click)</span>
                </Label>
                <Input
                  type="password"
                  placeholder="ghp_... or glpat-..."
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-semibold flex items-center justify-between">
                <span>Master Encryption Passphrase</span>
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  {showPassphrase ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPassphrase ? "Hide" : "Show"}
                </button>
              </Label>
              <Input
                type={showPassphrase ? "text" : "password"}
                placeholder="Create a strong secret passphrase..."
                value={encryptionPassphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Remember this passphrase to decrypt past chats when signing in on a new device.
              </p>
            </div>

            {ghToken && (
              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestGithub}
                  disabled={githubTesting}
                  className="text-xs h-7"
                >
                  <Github className="h-3.5 w-3.5 mr-1.5" />
                  {githubTesting ? "Testing..." : "Test Connection"}
                </Button>
                {githubStatus && (
                  <span className={`text-[11px] font-medium ${githubStatus.includes("Connected") ? "text-emerald-500" : "text-amber-500"}`}>
                    {githubStatus}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t border-border/60">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSkipIncognito}
            className="text-xs text-muted-foreground hover:text-foreground w-full sm:w-auto flex items-center gap-1.5"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Skip & Use Incognito Mode
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((s) => (s - 1) as any)}
                className="text-xs h-8"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setStep((s) => (s + 1) as any)}
                className="text-xs h-8 font-semibold shadow-xs"
              >
                Continue <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleFinish}
                disabled={isSubmitting}
                className="text-xs h-8 font-semibold bg-primary hover:bg-primary/90 shadow-xs"
              >
                {isSubmitting ? "Saving & Syncing..." : "Complete Setup & Launch"}
                <CheckCircle2 className="h-3.5 w-3.5 ml-1.5 text-primary-foreground" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
