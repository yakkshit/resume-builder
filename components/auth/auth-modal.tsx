"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-provider";
import { Database, Github, Mail, ShieldCheck, Sparkles, Check, Key, LogIn, ExternalLink } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { user, login, logout, linkGithub } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [githubUser, setGithubUser] = useState(user.githubUsername || "");
  const [githubToken, setGithubToken] = useState("");
  const [githubRepo, setGithubRepo] = useState("career-agent-backup");
  const [isSaved, setIsSaved] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email, name || "Career Professional");
    onOpenChange(false);
  };

  const handleLinkGithub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUser) return;
    linkGithub(githubUser, githubToken, githubRepo);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onOpenChange(false);
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-background/95 backdrop-blur-xl border-border/80 shadow-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>Account & Cloud Sync</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {user.isAuthenticated ? "Manage Account & Storage" : "Authentication & Sync"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Sign in with Clerk, connect PostgreSQL database storage, or link free GitHub backups.
          </DialogDescription>
        </DialogHeader>

        {user.isAuthenticated ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  DB Synced
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground/80">
                <Github className="h-3.5 w-3.5" />
                <span>GitHub Zero-Knowledge Storage</span>
              </div>
              <form onSubmit={handleLinkGithub} className="space-y-2.5">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">GitHub Username</Label>
                  <Input
                    placeholder="e.g. octocat"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    className="h-8 text-xs bg-muted/30"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Backup Repository</Label>
                  <Input
                    placeholder="career-agent-backup"
                    value={githubRepo}
                    onChange={(e) => setGithubRepo(e.target.value)}
                    className="h-8 text-xs bg-muted/30"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full text-xs h-8">
                  {isSaved ? (
                    <span className="flex items-center gap-1 text-emerald-300">
                      <Check className="h-3.5 w-3.5" /> Synced with GitHub
                    </span>
                  ) : (
                    "Save GitHub Link"
                  )}
                </Button>
              </form>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs text-destructive hover:bg-destructive/10"
                onClick={() => {
                  logout();
                  onOpenChange(false);
                }}
              >
                Sign Out
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Tabs defaultValue="clerk" className="pt-2">
            <TabsList className="grid grid-cols-3 w-full h-8">
              <TabsTrigger value="clerk" className="text-xs">Clerk Auth</TabsTrigger>
              <TabsTrigger value="email" className="text-xs">Local Mode</TabsTrigger>
              <TabsTrigger value="github" className="text-xs">GitHub Sync</TabsTrigger>
            </TabsList>

            <TabsContent value="clerk" className="space-y-3 pt-3">
              <div className="p-4 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/5 via-cyan-500/5 to-transparent space-y-3 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Clerk Authentication</h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Access the complete multi-model career workspace with standard Clerk sign-in and sign-up templates.
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button asChild size="sm" variant="outline" className="flex-1 text-xs h-9">
                    <Link href="/sign-in" onClick={() => onOpenChange(false)}>
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="flex-1 text-xs h-9 font-semibold shadow-xs">
                    <Link href="/sign-up" onClick={() => onOpenChange(false)}>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Sign Up
                    </Link>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-3 pt-3">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Email Address</Label>
                  <Input
                    type="email"
                    required
                    placeholder="alex@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full text-xs h-9 font-semibold">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Continue Locally
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="github" className="space-y-3 pt-3">
              <div className="p-3 rounded-lg border border-border/60 bg-muted/30 text-xs text-muted-foreground">
                Link your GitHub personal access token to automatically commit your resumes and chat sessions to your private repository for free.
              </div>
              <form onSubmit={handleLinkGithub} className="space-y-2.5">
                <div className="space-y-1">
                  <Label className="text-xs">GitHub Username</Label>
                  <Input
                    required
                    placeholder="octocat"
                    value={githubUser}
                    onChange={(e) => setGithubUser(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Personal Access Token (optional)</Label>
                  <Input
                    type="password"
                    placeholder="ghp_..."
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <Button type="submit" size="sm" className="w-full text-xs h-9">
                  <Github className="h-3.5 w-3.5 mr-1.5" /> Connect GitHub
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
