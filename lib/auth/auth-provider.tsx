"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";

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
  logout: () => void;
  linkGithub: (username: string, token: string, repo: string, branch?: string) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  setIncognitoMode: (enabled: boolean) => void;
  updateApiKeys: (keys: Record<string, string>) => Promise<void>;
  setEncryptionPassphrase: (passphrase: string) => void;
  fetchCloudProfile: (email: string) => Promise<boolean>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(DEFAULT_USER);

  useEffect(() => {
    try {
      const stored = tryLocalStorageGet("career-agent-auth-user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUser((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Keep default
    }
  }, []);

  const saveUser = useCallback((updated: AuthUser) => {
    setUser(updated);
    // Don't persist sensitive tokens or secrets to local storage if incognito
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

  const fetchCloudProfile = useCallback(async (email: string): Promise<boolean> => {
    if (!email || email === "guest@careeragent.ai") return false;
    try {
      const res = await fetch(`/api/user/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser((prev) => {
            const next: AuthUser = {
              ...prev,
              id: data.user.id || prev.id,
              email: data.user.email,
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

  const login = useCallback(async (email: string, name = "Career Professional", passphrase?: string) => {
    const nextUser: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
      isAuthenticated: true,
      isOnboarded: false,
      isIncognito: false,
      encryptionPassphrase: passphrase,
    };
    saveUser(nextUser);

    // Try to load existing profile from DB
    await fetchCloudProfile(email);
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
        isOnboarded: enabled ? true : prev.isOnboarded, // allows bypass to chat
      };
      if (enabled) {
        // Clear stored credentials in incognito
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

    // Save to DB if authenticated
    if (user.email && !user.isIncognito) {
      fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        logout,
        linkGithub,
        completeOnboarding,
        setIncognitoMode,
        updateApiKeys,
        setEncryptionPassphrase,
        fetchCloudProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

