"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
import { isClerkConfigured } from "@/lib/auth/clerk-config";
import { useUser, useClerk } from "@clerk/nextjs";

export interface GitHubSyncState {
  username: string;
  token: string;
  repo: string;
  branch?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  githubUsername?: string;
  githubToken?: string;
  githubRepo?: string;
  isAuthenticated: boolean;
  isOnboarded: boolean;
  isIncognito: boolean;
  apiKeys?: Record<string, string>;
  encryptionPassphrase?: string;
  bio?: string;
  targetRoles?: string[];
}

export interface OnboardingData {
  name: string;
  email: string;
  bio?: string;
  targetRoles?: string[];
  apiKeys?: Record<string, string>;
  github?: {
    username: string;
    token: string;
    repo: string;
    branch?: string;
  };
  encryptionPassphrase?: string;
}

interface AuthContextType {
  user: AuthUser;
  login: (email: string, name?: string, passphrase?: string) => Promise<void>;
  oneClickAuth: (provider?: "google" | "github" | "guest") => Promise<void>;
  logout: () => void;
  linkGithub: (username: string, token: string, repo: string, branch?: string) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  setIncognitoMode: (enabled: boolean) => void;
  updateApiKeys: (keys: Record<string, string>) => Promise<void>;
  setEncryptionPassphrase: (passphrase: string) => void;
  fetchCloudProfile: (email: string) => Promise<boolean>;
  isClerkActive: boolean;
}

const DEFAULT_USER: AuthUser = {
  id: "guest-user",
  email: "guest@careeragent.ai",
  name: "Guest User",
  isAuthenticated: false,
  isOnboarded: false,
  isIncognito: false,
  apiKeys: {},
};

const AuthContext = createContext<AuthContextType | null>(null);

function ClerkSyncBridge({
  onSync,
}: {
  onSync: (clerkUser: any) => void;
}) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser) {
      onSync(clerkUser);
    }
  }, [isLoaded, isSignedIn, clerkUser, onSync]);

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = tryLocalStorageGet("career-agent-auth-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_USER, ...parsed };
        }
      } catch {}
    }
    return DEFAULT_USER;
  });
  const clerkActive = typeof window !== "undefined" ? isClerkConfigured() : false;

  useEffect(() => {
    // Any post-hydration cloud sync can happen here if needed
  }, []);

  const saveUser = useCallback((updated: AuthUser) => {
    setUser(updated);
    if (updated.isIncognito) {
      return;
    }
    const safeToStore = {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      avatarUrl: updated.avatarUrl,
      githubUsername: updated.githubUsername,
      githubRepo: updated.githubRepo,
      isAuthenticated: updated.isAuthenticated,
      isOnboarded: updated.isOnboarded,
      isIncognito: updated.isIncognito,
      bio: updated.bio,
      targetRoles: updated.targetRoles,
    };
    tryLocalStorageSet("career-agent-auth-user", JSON.stringify(safeToStore));
  }, []);

  const fetchCloudProfile = useCallback(async (clerkId: string, email?: string): Promise<boolean> => {
    if (!clerkId || clerkId === "guest") return false;
    try {
      const res = await fetch(`/api/user/profile?clerkId=${encodeURIComponent(clerkId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser((prev) => {
            const next: AuthUser = {
              ...prev,
              id: data.user.id || prev.id,
              email: data.user.email || email || prev.email,
              name: data.user.name || prev.name,
              isOnboarded: data.user.isOnboarded ?? true,
              isIncognito: false,
              isAuthenticated: true,
              apiKeys: data.user.apiKeys || prev.apiKeys || {},
              githubUsername: data.user.preferences?.githubOwner || prev.githubUsername,
              githubRepo: data.user.preferences?.githubRepo || prev.githubRepo,
              githubToken: data.user.preferences?.githubToken || prev.githubToken,
              bio: data.user.bio || prev.bio,
              targetRoles: data.user.targetRoles || prev.targetRoles,
            };
            saveUser(next);
            return next;
          });
          return true;
        }
      }
    } catch (e) {
      console.warn("Could not sync profile from cloud:", e);
    }
    return false;
  }, [saveUser]);

  const handleClerkSync = useCallback((clerkUser: any) => {
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${clerkUser.id}@user.clerk.dev`;
    const name = clerkUser.fullName || clerkUser.username || clerkUser.firstName || "Career User";
    const avatarUrl = clerkUser.imageUrl || undefined;

    // Check external OAuth accounts (e.g. GitHub)
    const githubAccount = clerkUser.externalAccounts?.find(
      (acc: any) => acc.provider === "oauth_github" || acc.provider === "github"
    );
    const ghUsername = githubAccount?.username || undefined;

    setUser((prev) => {
      const next: AuthUser = {
        ...prev,
        id: clerkUser.id,
        email,
        name,
        avatarUrl,
        githubUsername: ghUsername || prev.githubUsername,
        isAuthenticated: true,
        isOnboarded: true, // Unified 1-click Clerk authentication eliminates separate onboarding gate
        isIncognito: false,
      };
      saveUser(next);
      return next;
    });

    // Sync cloud profile using Clerk's user ID (what the API expects)
    fetchCloudProfile(clerkUser.id, email);
  }, [fetchCloudProfile, saveUser]);

  const login = useCallback(async (email: string, name = "Career Professional", passphrase?: string) => {
    const nextUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
      isAuthenticated: true,
      isOnboarded: true,
      isIncognito: false,
      encryptionPassphrase: passphrase,
    };
    saveUser(nextUser);
    await fetchCloudProfile(nextUser.id, email);
  }, [fetchCloudProfile, saveUser]);

  const oneClickAuth = useCallback(async (provider: "google" | "github" | "guest" = "github") => {
    if (provider === "guest") {
      const guestUser: AuthUser = {
        id: `guest_${Date.now()}`,
        email: "guest@careeragent.ai",
        name: "Guest Explorer",
        isAuthenticated: true,
        isOnboarded: true,
        isIncognito: true,
      };
      saveUser(guestUser);
      return;
    }

    const email = provider === "github" ? "developer@github.com" : "user@gmail.com";
    const name = provider === "github" ? "GitHub Developer" : "Google User";
    const nextUser: AuthUser = {
      id: `usr_${provider}_${Date.now()}`,
      email,
      name,
      isAuthenticated: true,
      isOnboarded: true,
      isIncognito: false,
      githubUsername: provider === "github" ? "github-dev" : undefined,
    };
    saveUser(nextUser);
    await fetchCloudProfile(nextUser.id, email);
  }, [fetchCloudProfile, saveUser]);

  const logout = useCallback(() => {
    setUser(DEFAULT_USER);
    tryLocalStorageSet("career-agent-auth-user", JSON.stringify(DEFAULT_USER));
  }, []);

  const setIncognitoMode = useCallback((enabled: boolean) => {
    setUser((prev) => {
      const next: AuthUser = {
        ...prev,
        isIncognito: enabled,
        isOnboarded: enabled ? true : prev.isOnboarded,
      };
      if (enabled) {
        tryLocalStorageSet("career-agent-auth-user", JSON.stringify({ ...DEFAULT_USER, isIncognito: true, isOnboarded: true }));
      }
      return next;
    });
  }, []);

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    const updated: AuthUser = {
      id: user.id && user.id !== "guest-user" ? user.id : `usr_${Date.now()}`,
      email: data.email,
      name: data.name,
      isAuthenticated: true,
      isOnboarded: true,
      isIncognito: false,
      bio: data.bio,
      targetRoles: data.targetRoles,
      apiKeys: data.apiKeys,
      githubUsername: data.github?.username,
      githubToken: data.github?.token,
      githubRepo: data.github?.repo,
      encryptionPassphrase: data.encryptionPassphrase,
    };

    saveUser(updated);

    // Persist to XataDB / Postgres via API
    try {
      await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: data.email,
          name: data.name,
          bio: data.bio,
          targetRoles: data.targetRoles,
          isOnboarded: true,
          isIncognito: false,
          apiKeys: data.apiKeys,
          githubSyncEnabled: !!(data.github?.username && data.github?.token),
          preferences: {
            githubOwner: data.github?.username,
            githubRepo: data.github?.repo,
            githubToken: data.github?.token,
            githubBranch: data.github?.branch || "main",
          },
        }),
      });
    } catch (err) {
      console.warn("Failed to persist user profile to DB API:", err);
    }
  }, [user.id, saveUser]);

  const linkGithub = useCallback((username: string, token: string, repo: string, branch = "main") => {
    setUser((prev) => {
      const next = {
        ...prev,
        githubUsername: username,
        githubToken: token,
        githubRepo: repo,
        isAuthenticated: true,
      };
      saveUser(next);
      return next;
    });

    if (user.email && !user.isIncognito) {
      fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: user.id,
          email: user.email,
          githubSyncEnabled: true,
          preferences: {
            githubOwner: username,
            githubRepo: repo,
            githubToken: token,
            githubBranch: branch,
          },
        }),
      }).catch((e) => console.warn("Failed to update github config in DB:", e));
    }
  }, [user.email, user.isIncognito, saveUser]);

  const updateApiKeys = useCallback(async (keys: Record<string, string>) => {
    setUser((prev) => {
      const next = { ...prev, apiKeys: { ...(prev.apiKeys || {}), ...keys } };
      saveUser(next);
      return next;
    });

    if (user.email && !user.isIncognito) {
      try {
        await fetch("/api/user/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerkId: user.id,
            email: user.email,
            apiKeys: keys,
          }),
        });
      } catch (err) {
        console.warn("Failed to update API keys:", err);
      }
    }
  }, [user.email, user.isIncognito, saveUser]);

  const setEncryptionPassphrase = useCallback((passphrase: string) => {
    setUser((prev) => ({
      ...prev,
      encryptionPassphrase: passphrase,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        oneClickAuth,
        logout,
        linkGithub,
        completeOnboarding,
        setIncognitoMode,
        updateApiKeys,
        setEncryptionPassphrase,
        fetchCloudProfile,
        isClerkActive: clerkActive,
      }}
    >
      {clerkActive && <ClerkSyncBridge onSync={handleClerkSync} />}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
