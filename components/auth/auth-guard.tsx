"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PUBLIC_PREFIXES = ["/sign-in", "/sign-up"];

function isRoutePublic(pathname: string): boolean {
  if (pathname === "/") return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return true;
    }
  }
  return false;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPublic = isRoutePublic(pathname || "/");

  useEffect(() => {
    if (!mounted || loading) return;

    // If route is NOT public and user is NOT authenticated, redirect to sign-in
    if (!isPublic && !user.isAuthenticated) {
      const redirectUrl = `/sign-in?redirect=${encodeURIComponent(pathname || "/chat")}`;
      router.replace(redirectUrl);
    }

    // If route is sign-in or sign-up and user IS already authenticated, redirect to chat
    if ((pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) && user.isAuthenticated) {
      router.replace("/chat");
    }
  }, [mounted, loading, isPublic, user.isAuthenticated, pathname, router]);

  // During SSR and initial client hydration, always render children to guarantee exact DOM match.
  // Auth state checks and redirects execute safely on the client after mount.
  if (!mounted) {
    return <>{children}</>;
  }

  // Once mounted on the client: while checking auth for protected routes, show loading screen
  if (loading && !isPublic && !user.isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <div className="size-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <Sparkles className="size-4 text-primary absolute" />
          </div>
          <p className="text-xs text-muted-foreground font-medium animate-pulse">
            Verifying workspace access...
          </p>
        </div>
      </div>
    );
  }

  // If on a protected route and not authenticated, block rendering and show protection card
  if (!isPublic && !user.isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card/90 p-6 text-center shadow-2xl backdrop-blur-md space-y-4">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldAlert className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Sign In Required</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Except for the home screen, all career workspace features, tools, and profile vaults are protected.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild className="w-full text-xs font-semibold h-9 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href={`/sign-in?redirect=${encodeURIComponent(pathname || "/chat")}`}>
                <span>Go to Sign In</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
