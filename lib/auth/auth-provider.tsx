"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  githubUsername?: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: AuthUser;
  login: (email: string, name?: string) => void;
  logout: () => void;
  linkGithub: (username: string, token: string, repo: string) => void;
}

const DEFAULT_USER: AuthUser = {
  id: "guest-user",
  email: "guest@careeragent.ai",
  name: "Guest User",
  isAuthenticated: false,
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(DEFAULT_USER);

  useEffect(() => {
    try {
      const stored = tryLocalStorageGet("career-agent-auth-user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Keep default
    }
  }, []);

  const login = (email: string, name = "Career Professional") => {
    const updated: AuthUser = {
      id: `usr_${Date.now()}`,
      email,
      name,
      isAuthenticated: true,
    };
    setUser(updated);
    tryLocalStorageSet("career-agent-auth-user", JSON.stringify(updated));
  };

  const logout = () => {
    setUser(DEFAULT_USER);
    tryLocalStorageSet("career-agent-auth-user", JSON.stringify(DEFAULT_USER));
  };

  const linkGithub = (username: string, _token: string, _repo: string) => {
    setUser((prev) => {
      const next = { ...prev, githubUsername: username, isAuthenticated: true };
      tryLocalStorageSet("career-agent-auth-user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, linkGithub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
