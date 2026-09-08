"use client";

import React from "react";
import Link from "next/link";
import { 
  SignInButton, 
  SignUpButton, 
  UserButton,
  useUser,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Sparkles,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { useAuth } from "@/lib/auth/auth-provider";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  className?: string;
  onOpenSettings?: () => void;
}

function ClerkUserControls({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="h-8 w-16 animate-pulse rounded bg-muted/40" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Profile, Memory Vault & Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 ring-2 ring-primary/20 hover:ring-primary/40 transition-all",
              userButtonPopoverCard: "bg-background border border-border shadow-xl text-xs",
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {onOpenSettings && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Profile, Memory Vault & Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      <SignInButton mode="modal">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Sign In
        </Button>
      </SignInButton>

      <SignUpButton mode="modal">
        <Button
          size="sm"
          className="h-8 px-3 text-xs font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Sign Up
        </Button>
      </SignUpButton>
    </div>
  );
}

function FallbackUserControls({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { user, oneClickAuth, logout } = useAuth();

  if (user.isAuthenticated && !user.isIncognito) {
    return (
      <div className="flex items-center gap-2">
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            title="Profile, Memory Vault & Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium">
          <UserIcon className="h-3.5 w-3.5 text-primary" />
          <span className="max-w-[110px] truncate">{user.name}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {onOpenSettings && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Profile, Memory Vault & Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => oneClickAuth("github")}
        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <span>1-Click Sign In</span>
      </Button>

      <Button
        asChild
        size="sm"
        className="h-8 px-3 text-xs font-semibold shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Link href="/sign-up">
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          <span>Sign Up</span>
        </Link>
      </Button>
    </div>
  );
}

export function SidebarCompactUserControls({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const clerkActive = isClerkConfigured();
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const { user: fallbackUser } = useAuth();

  if (clerkActive && isLoaded && isSignedIn) {
    return (
      <div className="flex flex-col items-center gap-2">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-8 ring-2 ring-emerald-500/30 hover:ring-emerald-400 transition-all",
              userButtonPopoverCard: "bg-[#161619] border border-white/10 shadow-2xl text-xs",
            },
          }}
        />
      </div>
    );
  }

  const displayName = fallbackUser.isAuthenticated && !fallbackUser.isIncognito
    ? fallbackUser.name
    : "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onOpenSettings}
            className="size-8 rounded-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center transition-all shadow-xs"
            aria-label="User Profile & Settings"
          >
            {initial}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{displayName}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function SidebarUserControls({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const clerkActive = isClerkConfigured();
  const { isSignedIn, isLoaded, user: clerkUser } = useUser();
  const { user: fallbackUser, oneClickAuth, logout } = useAuth();

  if (clerkActive) {
    if (!isLoaded) {
      return (
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/5 animate-pulse">
          <div className="size-8 rounded-full bg-white/10" />
          <div className="space-y-1 flex-1">
            <div className="h-3 w-20 rounded bg-white/10" />
            <div className="h-2 w-28 rounded bg-white/5" />
          </div>
        </div>
      );
    }

    if (isSignedIn && clerkUser) {
      const name = clerkUser.fullName || clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0] || "User";
      const email = clerkUser.primaryEmailAddress?.emailAddress || "Signed in with Clerk";

      return (
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8 ring-2 ring-emerald-500/30 hover:ring-emerald-400 transition-all",
                  userButtonPopoverCard: "bg-[#161619] border border-white/10 shadow-2xl text-xs",
                },
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{name}</p>
              <p className="text-[10px] text-neutral-400 truncate">{email}</p>
            </div>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Profile & AI Settings"
            >
              <Settings className="size-3.5" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-neutral-400">Account</span>
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="text-neutral-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="size-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SignInButton mode="modal">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs text-neutral-300 hover:text-white hover:bg-white/10"
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs"
            >
              Sign Up
            </Button>
          </SignUpButton>
        </div>
      </div>
    );
  }

  // Fallback Auth Mode
  if (fallbackUser.isAuthenticated && !fallbackUser.isIncognito) {
    const initial = fallbackUser.name.charAt(0).toUpperCase();
    return (
      <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
        <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" onClick={onOpenSettings}>
          <div className="size-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{fallbackUser.name}</p>
            <p className="text-[10px] text-neutral-400 truncate">{fallbackUser.email || "Career AI User"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Settings"
            >
              <Settings className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-destructive hover:bg-white/10 transition-colors"
            title="Sign Out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-neutral-400">Account</span>
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="size-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => oneClickAuth("github")}
          className="h-7 flex-1 text-xs text-neutral-300 hover:text-white hover:bg-white/10"
        >
          1-Click Sign In
        </Button>
        <Button
          asChild
          size="sm"
          className="h-7 flex-1 text-xs bg-indigo-600 text-white hover:bg-indigo-500 shadow-xs"
        >
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}

export function UserMenu({ className, onOpenSettings }: UserMenuProps) {
  if (isClerkConfigured()) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <ClerkUserControls onOpenSettings={onOpenSettings} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <FallbackUserControls onOpenSettings={onOpenSettings} />
    </div>
  );
}

