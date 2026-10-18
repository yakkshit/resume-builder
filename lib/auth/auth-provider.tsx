"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";
import { 
  getFirebaseAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider, 
  firebaseSignOut, 
  updateProfile,
  sendPasswordResetEmail,
  isFirebaseConfigured,
  type FirebaseUser
} from "@/lib/firebase";
import { getStoredProfile } from "@/components/chat/profile-settings-dialog";

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

export interface AuthContextType {
  user: AuthUser;
  loading: boolean;
  firebaseUser: FirebaseUser | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  login: (email: string, name?: string, passphrase?: string) => Promise<void>;
  oneClickAuth: (provider?: "google" | "github" | "guest") => Promise<void>;
  logout: () => Promise<void>;
  linkGithub: (username: string, token: string, repo: string, branch?: string) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  setIncognitoMode: (enabled: boolean) => void;
  updateApiKeys: (keys: Record<string, string>) => Promise<void>;
  setEncryptionPassphrase: (passphrase: string) => void;
  fetchCloudProfile: (userId: string, email?: string) => Promise<boolean>;
  isClerkActive: boolean;
}

const DEFAULT_USER: AuthUser = {
  id: "guest-user",
  email: "yakkshit.tactopus@gmail.com",
  name: "Yakkshit Sai",
  isAuthenticated: false,
  isOnboarded: false,
  isIncognito: false,
  apiKeys: {},
};

const AuthContext = createContext<AuthContextType | null>(null);

function setAuthCookie(userId?: string) {
  if (typeof document === "undefined") return;
  if (userId) {
    document.cookie = `career_auth_session=${encodeURIComponent(userId)}; path=/; max-age=2592000; SameSite=Lax`;
  } else {
    document.cookie = "career_auth_session=; path=/; max-age=0; SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = tryLocalStorageGet("career-agent-auth-user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.isAuthenticated) return false;
        }
        const prof = getStoredProfile();
        if (prof.name && prof.name !== "Career Professional") return false;
      } catch {}
    }
    return true;
  });
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = tryLocalStorageGet("career-agent-auth-user");
        const prof = getStoredProfile();
        if (stored) {
          const parsed = JSON.parse(stored);
          const name = parsed.name && parsed.name !== "Career Professional" && parsed.name !== "Guest"
            ? parsed.name
            : prof.name || "Yakkshit Sai";
          const email = parsed.email && parsed.email.includes("@") && !parsed.email.endsWith("@user.local")
            ? parsed.email
            : prof.email || "yakkshit.tactopus@gmail.com";
          return {
            ...DEFAULT_USER,
            ...parsed,
            name,
            email,
            avatarUrl: parsed.avatarUrl || prof.profilePicture,
          };
        }
        if (prof.name) {
          return {
            ...DEFAULT_USER,
            name: prof.name,
            email: prof.email || "yakkshit.tactopus@gmail.com",
            avatarUrl: prof.profilePicture,
            isAuthenticated: true,
          };
        }
      } catch {}
    }
    return DEFAULT_USER;
  });

  const saveUser = useCallback((updated: AuthUser) => {
    setUser(updated);
    if (updated.isAuthenticated) {
      setAuthCookie(updated.id);
    } else {
      setAuthCookie(undefined);
    }
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

  const fetchCloudProfile = useCallback(async (userId: string, email?: string): Promise<boolean> => {
    if (!userId || userId === "guest-user") return false;
    try {
      const res = await fetch(`/api/user/profile?clerkId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser((prev) => {
            const stored = getStoredProfile();
            const validName = data.user.name && data.user.name !== "Career Professional" && data.user.name !== "Guest"
              ? data.user.name
              : stored.name || prev.name || "Yakkshit Sai";
            const validEmail = data.user.email && data.user.email.includes("@") && !data.user.email.endsWith("@user.local")
              ? data.user.email
              : stored.email || email || prev.email || "yakkshit.tactopus@gmail.com";
            const validPhoto = data.user.avatarUrl || stored.profilePicture || prev.avatarUrl;

            const next: AuthUser = {
              ...prev,
              id: data.user.id || prev.id,
              email: validEmail,
              name: validName,
              avatarUrl: validPhoto,
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

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const stored = getStoredProfile();
        const resolvedName = (fbUser.displayName && fbUser.displayName !== "User" && fbUser.displayName !== "Career Professional")
          ? fbUser.displayName
          : (stored.name && stored.name !== "Career Professional" ? stored.name : (fbUser.email ? fbUser.email.split("@")[0] : "Yakkshit Sai"));
        const resolvedEmail = (fbUser.email && fbUser.email.includes("@") && !fbUser.email.endsWith("@user.local"))
          ? fbUser.email
          : (stored.email && stored.email.includes("@") ? stored.email : "yakkshit.tactopus@gmail.com");
        const resolvedPhoto = fbUser.photoURL || stored.profilePicture || undefined;

        // Sync displayName to Firebase Auth user object if empty or generic
        if (!fbUser.displayName || fbUser.displayName === "User" || fbUser.displayName === "Career Professional") {
          try {
            await updateProfile(fbUser, { displayName: resolvedName });
          } catch {}
        }

        const updated: AuthUser = {
          id: fbUser.uid,
          email: resolvedEmail,
          name: resolvedName,
          avatarUrl: resolvedPhoto,
          isAuthenticated: true,
          isOnboarded: true,
          isIncognito: false,
        };
        saveUser(updated);
        setLoading(false);
        // Sync cloud profile in background without stalling UI hydration
        fetchCloudProfile(fbUser.uid, resolvedEmail).catch(() => {});
      } else {
        // If not authenticated in Firebase, preserve locally stored profile info if present
        const stored = getStoredProfile();
        if (stored.name && stored.name !== "Career Professional") {
          setUser((prev) => ({
            ...prev,
            name: stored.name,
            email: stored.email || "yakkshit.tactopus@gmail.com",
            avatarUrl: stored.profilePicture || prev.avatarUrl,
          }));
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [fetchCloudProfile, saveUser]);

  // Firebase Email/Password Sign In
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase auth is not initialized");

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = res.user;
      const updated: AuthUser = {
        id: fbUser.uid,
        email: fbUser.email || email,
        name: fbUser.displayName || email.split("@")[0],
        avatarUrl: fbUser.photoURL || undefined,
        isAuthenticated: true,
        isOnboarded: true,
        isIncognito: false,
      };
      saveUser(updated);
      await fetchCloudProfile(fbUser.uid, fbUser.email || undefined);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      // Fallback for development if dummy/missing config
      if (fbErr.code === "auth/invalid-api-key" || fbErr.code === "auth/api-key-not-valid") {
        const devUser: AuthUser = {
          id: `usr_${Date.now()}`,
          email,
          name: email.split("@")[0] || "Developer",
          isAuthenticated: true,
          isOnboarded: true,
          isIncognito: false,
        };
        saveUser(devUser);
        return;
      }
      throw err;
    }
  }, [fetchCloudProfile, saveUser]);

  // Firebase Email/Password Sign Up
  const signUpWithEmail = useCallback(async (email: string, password: string, name?: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase auth is not initialized");

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = res.user;
      const displayName = name || email.split("@")[0];
      try {
        await updateProfile(fbUser, { displayName });
      } catch {}

      const updated: AuthUser = {
        id: fbUser.uid,
        email: fbUser.email || email,
        name: displayName,
        isAuthenticated: true,
        isOnboarded: true,
        isIncognito: false,
      };
      saveUser(updated);
      await fetchCloudProfile(fbUser.uid, fbUser.email || undefined);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === "auth/invalid-api-key" || fbErr.code === "auth/api-key-not-valid") {
        const devUser: AuthUser = {
          id: `usr_${Date.now()}`,
          email,
          name: name || email.split("@")[0],
          isAuthenticated: true,
          isOnboarded: true,
          isIncognito: false,
        };
        saveUser(devUser);
        return;
      }
      throw err;
    }
  }, [fetchCloudProfile, saveUser]);

  // Firebase Google OAuth Sign In
  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase auth is not initialized");

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      const res = await signInWithPopup(auth, provider);
      const fbUser = res.user;
      const updated: AuthUser = {
        id: fbUser.uid,
        email: fbUser.email || "",
        name: fbUser.displayName || "Google User",
        avatarUrl: fbUser.photoURL || undefined,
        isAuthenticated: true,
        isOnboarded: true,
        isIncognito: false,
      };
      saveUser(updated);
      await fetchCloudProfile(fbUser.uid, fbUser.email || undefined);
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      if (fbErr.code === "auth/popup-closed-by-user") return;
      if (fbErr.code === "auth/invalid-api-key" || fbErr.code === "auth/api-key-not-valid") {
        const devUser: AuthUser = {
          id: `usr_google_${Date.now()}`,
          email: "user@gmail.com",
          name: "Google User",
          isAuthenticated: true,
          isOnboarded: true,
          isIncognito: false,
        };
        saveUser(devUser);
        return;
      }
      throw err;
    }
  }, [fetchCloudProfile, saveUser]);

  // Firebase GitHub OAuth Sign In
  const signInWithGithub = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase auth is not initialized");

    const provider = new GithubAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      const fbUser = res.user;
      const updated: AuthUser = {
        id: fbUser.uid,
        email: fbUser.email || "",
        name: fbUser.displayName || "GitHub User",
        avatarUrl: fbUser.photoURL || undefined,
        isAuthenticated: true,
        isOnboarded: true,
        isIncognito: false,
      };
      saveUser(updated);
      await fetchCloudProfile(fbUser.uid, fbUser.email || undefined);
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      if (fbErr.code === "auth/popup-closed-by-user") return;
      if (fbErr.code === "auth/invalid-api-key" || fbErr.code === "auth/api-key-not-valid") {
        const devUser: AuthUser = {
          id: `usr_github_${Date.now()}`,
          email: "developer@github.com",
          name: "GitHub Developer",
          githubUsername: "developer",
          isAuthenticated: true,
          isOnboarded: true,
          isIncognito: false,
        };
        saveUser(devUser);
        return;
      }
      throw err;
    }
  }, [fetchCloudProfile, saveUser]);

  // Password reset
  const resetPassword = useCallback(async (email: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase auth is not initialized");
    await sendPasswordResetEmail(auth, email);
  }, []);

  // Backward-compatible login helper
  const login = useCallback(async (email: string, name = "Yakkshit Sai", passphrase?: string) => {
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

  // Backward-compatible one-click auth helper
  const oneClickAuth = useCallback(async (provider: "google" | "github" | "guest" = "github") => {
    if (provider === "google") {
      await signInWithGoogle();
      return;
    }
    if (provider === "github") {
      await signInWithGithub();
      return;
    }

    const guestUser: AuthUser = {
      id: `guest_${Date.now()}`,
      email: "guest@careeragent.ai",
      name: "Guest Explorer",
      isAuthenticated: true,
      isOnboarded: true,
      isIncognito: true,
    };
    saveUser(guestUser);
  }, [signInWithGoogle, signInWithGithub, saveUser]);

  // Sign out from Firebase and clear state
  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch {}
    }
    setUser(DEFAULT_USER);
    setAuthCookie(undefined);
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

    // Persist to Database API
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
        loading,
        firebaseUser,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithGithub,
        resetPassword,
        login,
        oneClickAuth,
        logout,
        linkGithub,
        completeOnboarding,
        setIncognitoMode,
        updateApiKeys,
        setEncryptionPassphrase,
        fetchCloudProfile,
        isClerkActive: false,
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
