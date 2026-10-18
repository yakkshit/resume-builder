"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Sparkles,
  User as UserIcon,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { loadProfile, type UserProfile } from "@/components/chat/profile-settings-dialog";

interface UserMenuProps {
  className?: string;
  onOpenSettings?: () => void;
}

export function SidebarCompactUserControls({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());

  useEffect(() => {
    const handleUpdate = () => setProfile(loadProfile());
    window.addEventListener("ai-chat-profile-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("ai-chat-profile-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const displayName = useMemo(() => {
    if (profile.name && profile.name.trim() && profile.name !== "Career Professional" && profile.name !== "Guest" && profile.name !== "User") {
      return profile.name.trim();
    }
    if (user.name && user.name.trim() && user.name !== "Career Professional" && user.name !== "Guest" && user.name !== "User") {
      return user.name.trim();
    }
    return "Yakkshit Sai";
  }, [profile.name, user.name]);

  const displayEmail = useMemo(() => {
    if (profile.email && profile.email.includes("@") && !profile.email.endsWith("@user.local")) {
      return profile.email.trim();
    }
    if (user.email && user.email.includes("@") && !user.email.endsWith("@user.local")) {
      return user.email.trim();
    }
    return "yakkshit.tactopus@gmail.com";
  }, [profile.email, user.email]);

  const avatarSrc = profile.profilePicture || user.avatarUrl || "";
  const initial = displayName.charAt(0).toUpperCase() || "Y";

  return (
    <div className="flex flex-col items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/profile"
            className="size-8 rounded-full flex items-center justify-center transition-all shadow-sm ring-1 ring-white/10 hover:ring-white/30 overflow-hidden"
            aria-label={`User Profile: ${displayName}`}
          >
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt={displayName} className="size-full object-cover" />
            ) : (
              <div className="size-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center">
                {initial}
              </div>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs space-y-0.5">
          <p className="font-semibold">{displayName}</p>
          <p className="text-[10px] text-neutral-400 font-mono">{displayEmail}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export function SidebarUserControls({ onOpenSettings }: { onOpenSettings?: () => void }) {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());

  useEffect(() => {
    const handleUpdate = () => setProfile(loadProfile());
    window.addEventListener("ai-chat-profile-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("ai-chat-profile-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const displayName = useMemo(() => {
    if (profile.name && profile.name.trim() && profile.name !== "Career Professional" && profile.name !== "Guest" && profile.name !== "User") {
      return profile.name.trim();
    }
    if (user.name && user.name.trim() && user.name !== "Career Professional" && user.name !== "Guest" && user.name !== "User") {
      return user.name.trim();
    }
    return "Yakkshit Sai";
  }, [profile.name, user.name]);

  const displayEmail = useMemo(() => {
    if (profile.email && profile.email.includes("@") && !profile.email.endsWith("@user.local")) {
      return profile.email.trim();
    }
    if (user.email && user.email.includes("@") && !user.email.endsWith("@user.local")) {
      return user.email.trim();
    }
    return "yakkshit.tactopus@gmail.com";
  }, [profile.email, user.email]);

  const avatarSrc = profile.profilePicture || user.avatarUrl || "";
  const initial = displayName.charAt(0).toUpperCase() || "Y";

  return (
    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/70 border border-white/10 hover:border-white/20 transition-all shadow-sm group">
      <Link
        href="/profile"
        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-95 transition-opacity"
        title={`Profile: ${displayName} (${displayEmail})`}
      >
        <div className="size-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/15 shadow-xs">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarSrc} alt={displayName} className="size-full object-cover" />
          ) : (
            <div className="size-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white font-bold text-xs flex items-center justify-center">
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-white truncate max-w-[120px]">
              {displayName}
            </p>
            <span className="size-1.5 rounded-full bg-emerald-400 shrink-0" title="Connected & Synced" />
          </div>
          <p className="text-[10.5px] text-neutral-400 truncate max-w-[130px] font-mono tracking-tight">
            {displayEmail}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-0.5 shrink-0">
        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Profile & Settings"
          >
            <Settings className="size-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={logout}
          className="size-7 rounded-lg flex items-center justify-center text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Sign Out"
        >
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function UserMenu({ className, onOpenSettings }: UserMenuProps) {
  const { user, oneClickAuth, logout } = useAuth();

  if (user.isAuthenticated && !user.isIncognito) {
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
        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Link href="/sign-in">Sign In</Link>
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
