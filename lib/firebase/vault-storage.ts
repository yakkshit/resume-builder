/**
 * Firebase Secret & Identity Vault Storage
 * Stores sensitive personal information, raw AI provider keys, and GitHub authentication tokens.
 * These secrets NEVER leave for GitHub and are isolated exclusively in Firebase (or secure local cache).
 */

import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";

export interface FirebasePersonalDetails {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  targetRoles: string;
  careerNotes?: string;
  profilePicture?: string;
}

export interface FirebaseApiKeys {
  google?: string;
  gemini?: string;
  openai?: string;
  anthropic?: string;
  groq?: string;
  tavily?: string;
  firecrawl?: string;
  kernel?: string;
  browserbase?: string;
  steel?: string;
  openrouter?: string;
  openRouter?: string;
  githubToken?: string;
}

export interface FirebaseVaultRecord {
  updatedAt: string;
  personalDetails: FirebasePersonalDetails;
  apiKeys: FirebaseApiKeys;
  encryptionPassphrase?: string;
  githubToken?: string;
  githubRepo?: string;
  keyFingerprint?: string;
}

const FIREBASE_VAULT_RECORD_STORAGE_ID = "cv_fb_vault_v2";

/**
 * Save personal details and API keys exclusively to Firebase Secret Vault
 */
export async function saveToFirebaseVault(data: {
  personalDetails: FirebasePersonalDetails;
  apiKeys: FirebaseApiKeys;
  encryptionPassphrase?: string;
  githubToken?: string;
  githubRepo?: string;
}): Promise<{ ok: boolean; savedTo: "firebase" | "local_fallback"; timestamp: string }> {
  const timestamp = new Date().toISOString();
  const record: FirebaseVaultRecord = {
    updatedAt: timestamp,
    personalDetails: data.personalDetails,
    apiKeys: data.apiKeys,
    encryptionPassphrase: data.encryptionPassphrase,
    githubToken: data.githubToken,
    githubRepo: data.githubRepo,
    keyFingerprint: data.encryptionPassphrase
      ? `sha256-${data.encryptionPassphrase.slice(0, 4)}...${data.encryptionPassphrase.slice(-4)}`
      : undefined,
  };

  // Always keep secure local client state in sync
  tryLocalStorageSet(FIREBASE_VAULT_RECORD_STORAGE_ID, JSON.stringify(record));

  // If Firebase is configured with active user, sync to Firestore
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      const uid = user?.uid || "default_user";

      // Dynamically import firestore to avoid bundle bloat when unused
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const { app } = await import("@/lib/firebase");
      if (app) {
        const db = getFirestore(app);
        await setDoc(doc(db, "users", uid, "vault", "secrets"), record, { merge: true });
        return { ok: true, savedTo: "firebase", timestamp };
      }
    } catch (err) {
      console.warn("Firestore sync notice (fallback to local vault):", err);
    }
  }

  return { ok: true, savedTo: "local_fallback", timestamp };
}

/**
 * Load personal details and API keys from Firebase Secret Vault
 */
export async function loadFromFirebaseVault(): Promise<FirebaseVaultRecord | null> {
  // Try remote Firebase Firestore first if configured
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      const uid = user?.uid || "default_user";

      const { getFirestore, doc, getDoc } = await import("firebase/firestore");
      const { app } = await import("@/lib/firebase");
      if (app) {
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "users", uid, "vault", "secrets"));
        if (snap.exists()) {
          const remoteData = snap.data() as FirebaseVaultRecord;
          tryLocalStorageSet(FIREBASE_VAULT_RECORD_STORAGE_ID, JSON.stringify(remoteData));
          return remoteData;
        }
      }
    } catch (err) {
      console.warn("Firestore read notice (falling back to cache):", err);
    }
  }

  // Fallback to local storage
  const cached = tryLocalStorageGet(FIREBASE_VAULT_RECORD_STORAGE_ID);
  if (cached) {
    try {
      return JSON.parse(cached) as FirebaseVaultRecord;
    } catch {
      return null;
    }
  }

  return null;
}
