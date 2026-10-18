"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { SignupLoadingScreen } from "@/components/auth/signup-loading-screen";

interface FirebaseAuthCardProps {
  initialMode?: "sign-in" | "sign-up";
}

export function FirebaseAuthCard({ initialMode = "sign-in" }: FirebaseAuthCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("redirect") || "/chat";
  const { toast } = useToast();
  const { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle, 
    signInWithGithub, 
    resetPassword,
    oneClickAuth 
  } = useAuth();

  const [mode, setMode] = useState<"sign-in" | "sign-up">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSignupLoading, setShowSignupLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 21st.dev ambient particle canvas effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();

    type Particle = { x: number; y: number; v: number; o: number; size: number };
    let particles: Particle[] = [];

    const makeParticle = (): Particle => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      v: Math.random() * 0.3 + 0.05,
      o: Math.random() * 0.4 + 0.1,
      size: Math.random() * 2 + 1,
    });

    const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 18000));
    for (let i = 0; i < count; i++) {
      particles.push(makeParticle());
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.y -= p.v;
        if (p.y < 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
        }
        ctx.fillStyle = `rgba(175, 243, 62, ${p.o})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      rafId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }
    if (mode === "sign-up" && password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "sign-in") {
        await signInWithEmail(email, password);
        toast({
          title: "Welcome back!",
          description: "Signed in successfully with Firebase.",
        });
        router.replace(redirectTarget);
      } else {
        await signUpWithEmail(email, password, name.trim() || undefined);
        toast({
          title: "Account created!",
          description: "Welcome to your AI career workspace.",
        });
        setShowSignupLoading(true);
      }
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      let friendly = "Authentication failed. Please verify your credentials.";
      if (fbErr.code === "auth/invalid-credential" || fbErr.code === "auth/wrong-password" || fbErr.code === "auth/user-not-found") {
        friendly = "Invalid email or password. Please check your credentials.";
      } else if (fbErr.code === "auth/email-already-in-use") {
        friendly = "An account with this email already exists. Try signing in instead.";
      } else if (fbErr.code === "auth/weak-password") {
        friendly = "Password is too weak. Please use at least 6 characters.";
      } else if (fbErr.code === "auth/invalid-email") {
        friendly = "Please enter a valid email address.";
      } else if (fbErr.message) {
        friendly = fbErr.message;
      }
      setErrorMsg(friendly);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: "google" | "github") => {
    setErrorMsg(null);
    setLoading(true);
    try {
      if (provider === "google") {
        await signInWithGoogle();
      } else {
        await signInWithGithub();
      }
      toast({
        title: "Authenticated!",
        description: `Signed in via ${provider === "google" ? "Google" : "GitHub"}.`,
      });
      if (mode === "sign-up") {
        setShowSignupLoading(true);
      } else {
        router.replace(redirectTarget);
      }
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }
      setErrorMsg(fbErr.message || `Failed to sign in with ${provider}.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg("Please enter your email to receive a password reset link.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      toast({
        title: "Reset link sent",
        description: `Password recovery instructions sent to ${email}`,
      });
    } catch (err: unknown) {
      const fbErr = err as { message?: string };
      setErrorMsg(fbErr.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  if (showSignupLoading) {
    return (
      <SignupLoadingScreen
        userName={name.trim() || undefined}
        userEmail={email}
        onComplete={() => router.replace(redirectTarget)}
      />
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 overflow-hidden bg-background text-foreground">
      {/* 21st.dev ambient particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 mix-blend-screen"
      />

      {/* Subtle radial ambient glow */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(ellipse_80%_50%_at_50%_40%,rgba(175,243,62,0.08),transparent_70%)]" />

      {/* Main Auth Card */}
      <div className="relative z-10 w-full max-w-[420px]">
        <Card className="border-border/80 bg-card/85 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden transition-all">
          <CardHeader className="space-y-3 text-center pb-4 pt-6 px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>

            <div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {forgotPasswordOpen 
                  ? "Reset Password" 
                  : mode === "sign-in" 
                    ? "Welcome Back" 
                    : "Create an Account"}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {forgotPasswordOpen
                  ? "Enter your email address to receive recovery instructions."
                  : mode === "sign-in"
                    ? "Sign in to access your AI resume builder and career vault."
                    : "Join to build ATS-optimized resumes and intelligent career workflows."}
              </CardDescription>
            </div>

            {/* Mode Switcher Tabs */}
            {!forgotPasswordOpen && (
              <div className="grid grid-cols-2 p-1 bg-muted/60 rounded-xl border border-border/60 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setMode("sign-in"); setErrorMsg(null); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    mode === "sign-in"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("sign-up"); setErrorMsg(null); }}
                  className={`py-1.5 rounded-lg transition-all ${
                    mode === "sign-up"
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed animate-in fade-in duration-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {resetSent && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs leading-relaxed">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Password reset link sent! Check your inbox.</span>
              </div>
            )}

            {forgotPasswordOpen ? (
              <form onSubmit={handlePasswordReset} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="reset-email"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs bg-muted/30 border-border"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending Instructions...
                    </span>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setForgotPasswordOpen(false); setResetSent(false); }}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {mode === "sign-up" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-name" className="text-xs font-medium">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="auth-name"
                        type="text"
                        placeholder="Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-9 h-9 text-xs bg-muted/30 border-border"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="auth-email" className="text-xs font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="auth-email"
                      type="email"
                      required
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-9 text-xs bg-muted/30 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auth-password" className="text-xs font-medium">Password</Label>
                    {mode === "sign-in" && (
                      <button
                        type="button"
                        onClick={() => { setForgotPasswordOpen(true); setErrorMsg(null); }}
                        className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-9 h-9 text-xs bg-muted/30 border-border"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="w-full h-9 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {mode === "sign-in" ? "Signing In..." : "Creating Account..."}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      {mode === "sign-in" ? "Continue to Workspace" : "Complete Registration"}
                    </span>
                  )}
                </Button>
              </form>
            )}

            {!forgotPasswordOpen && (
              <>
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/60" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-card px-2 text-muted-foreground tracking-wider font-semibold">
                      Or Connect With
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleSocialAuth("google")}
                    className="h-8 text-xs font-medium border-border/80 hover:bg-muted/60"
                  >
                    <svg className="h-3.5 w-3.5 mr-1.5" viewBox="0 0 24 24">
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
                    Google
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleSocialAuth("github")}
                    className="h-8 text-xs font-medium border-border/80 hover:bg-muted/60"
                  >
                    <svg className="h-3.5 w-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    GitHub
                  </Button>
                </div>

                <div className="pt-2 text-center">
                  <Link
                    href="/"
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Back to Home Page
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
