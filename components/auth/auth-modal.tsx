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
import { ShieldCheck, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const { user, logout, signInWithGoogle, signInWithGithub, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithEmail(email, password);
      onOpenChange(false);
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setErrorMsg(fbErr.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setErrorMsg(fbErr.message || "OAuth sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-background/95 backdrop-blur-xl border-border/80 shadow-2xl p-6">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
            <ShieldCheck className="h-4 w-4" />
            <span>Firebase Authentication</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight">
            {user.isAuthenticated ? "Account & Cloud Sync" : "Sign In to Workspace"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {user.isAuthenticated 
              ? "Your career vault and AI documents are synchronized." 
              : "Sign in with Firebase to access your resume studio, AI models, and career vaults."}
          </DialogDescription>
        </DialogHeader>

        {user.isAuthenticated ? (
          <div className="space-y-4 pt-2">
            <div className="p-3.5 rounded-xl border border-border/60 bg-muted/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email || "Active User"}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Authenticated
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => onOpenChange(false)}
              >
                <Link href="/profile">Open Profile Dashboard</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-full text-xs"
                onClick={async () => {
                  await logout();
                  onOpenChange(false);
                }}
              >
                Sign Out
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {errorMsg && (
              <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-lg border border-destructive/20">
                {errorMsg}
              </p>
            )}

            <Tabs defaultValue="oauth" className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-8">
                <TabsTrigger value="oauth" className="text-xs">Quick OAuth</TabsTrigger>
                <TabsTrigger value="email" className="text-xs">Email & Pass</TabsTrigger>
              </TabsList>

              <TabsContent value="oauth" className="space-y-2.5 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleOAuth("google")}
                  className="w-full h-9 text-xs font-medium justify-center gap-2 border-border/80"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleOAuth("github")}
                  className="w-full h-9 text-xs font-medium justify-center gap-2 border-border/80"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    />
                  </svg>
                  Continue with GitHub
                </Button>
              </TabsContent>

              <TabsContent value="email" className="space-y-3 pt-3">
                <form onSubmit={handleEmailLogin} className="space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Password</Label>
                    <Input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full text-xs h-8 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Sign In with Email"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="pt-2 text-center border-t border-border/60">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary hover:underline h-7"
                onClick={() => onOpenChange(false)}
              >
                <Link href="/sign-up">
                  <span>Need an account? Sign up here</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
