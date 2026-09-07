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
  Sparkles
} from "lucide-react";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
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

export function UserMenu({ className, onOpenSettings }: UserMenuProps) {
  if (isClerkConfigured()) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <ClerkUserControls onOpenSettings={onOpenSettings} />
      </div>
    );
  }

  // When Clerk API key is not yet pasted in .env, offer direct links to Clerk routes + Settings
  return (
    <div className={cn("flex items-center gap-2", className)}>
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
        asChild
        variant="ghost"
        size="sm"
        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
      >
        <Link href="/sign-in">
          <span>Sign In</span>
        </Link>
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
