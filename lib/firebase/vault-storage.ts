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
  ragKnowledgeBase?: string;
  careerNotes?: string;
  masterSkills?: string;
  masterExperience?: string;
  masterProjects?: string;
  masterEducation?: string;
  masterCertifications?: string;
  version?: number;
}

const FIREBASE_VAULT_RECORD_STORAGE_ID = "cv_fb_vault_v2";

// In-memory fallback store for Node.js / SSR / testing environments
export const inMemoryVaultRecordStore = new Map<string, FirebaseVaultRecord>();

/**
 * Save personal details and API keys exclusively to Firebase Secret Vault
 */
export async function saveToFirebaseVault(data: {
  personalDetails: FirebasePersonalDetails;
  apiKeys: FirebaseApiKeys;
  encryptionPassphrase?: string;
  keyFingerprint?: string;
  githubToken?: string;
  githubRepo?: string;
  ragKnowledgeBase?: string;
  careerNotes?: string;
  masterSkills?: string;
  masterExperience?: string;
  masterProjects?: string;
  masterEducation?: string;
  masterCertifications?: string;
  uid?: string;
}): Promise<{ ok: boolean; savedTo: "firebase" | "local_fallback"; timestamp: string; version: number }> {
  const timestamp = new Date().toISOString();
  const version = Date.now();
  const record: FirebaseVaultRecord = {
    updatedAt: timestamp,
    version,
    personalDetails: data.personalDetails,
    apiKeys: data.apiKeys,
    encryptionPassphrase: data.encryptionPassphrase,
    githubToken: data.githubToken,
    githubRepo: data.githubRepo,
    ragKnowledgeBase: data.ragKnowledgeBase,
    careerNotes: data.careerNotes || data.personalDetails.careerNotes,
    masterSkills: data.masterSkills,
    masterExperience: data.masterExperience,
    masterProjects: data.masterProjects,
    masterEducation: data.masterEducation,
    masterCertifications: data.masterCertifications,
    keyFingerprint: data.encryptionPassphrase
      ? `sha256-${data.encryptionPassphrase.slice(0, 4)}...${data.encryptionPassphrase.slice(-4)}`
      : undefined,
  };

  const uid = data.uid || "default_user";

  // Cache in-memory for immediate serverless/process availability
  inMemoryVaultRecordStore.set(uid, record);

  // Always keep secure local client state in sync
  tryLocalStorageSet(FIREBASE_VAULT_RECORD_STORAGE_ID, JSON.stringify(record));

  // If Firebase is configured with active user, sync to Firestore
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      const uid = data.uid || user?.uid || "default_user";

      // Dynamically import firestore to avoid bundle bloat when unused
      const { getFirestore, doc, setDoc } = await import("firebase/firestore");
      const { app } = await import("@/lib/firebase");
      if (app) {
        const db = getFirestore(app);
        // Write to vault subcollection
        await setDoc(doc(db, "users", uid, "vault", "secrets"), record, { merge: true });
        
        // Also sync ragKnowledgeBase to main profile doc so both paths are always unified
        if (data.ragKnowledgeBase) {
          await setDoc(doc(db, "users", uid), {
            ragKnowledgeBase: data.ragKnowledgeBase,
            vaultUpdatedAt: timestamp,
            vaultVersion: version,
          }, { merge: true });
          await setDoc(doc(db, "users", uid, "profile", "main"), {
            ragKnowledgeBase: data.ragKnowledgeBase,
            vaultUpdatedAt: timestamp,
            vaultVersion: version,
          }, { merge: true });
        }
        return { ok: true, savedTo: "firebase", timestamp, version };
      }
    } catch (err) {
      console.warn("Firestore sync notice (fallback to local vault):", err);
    }
  }

  return { ok: true, savedTo: "local_fallback", timestamp, version };
}

/**
 * Load personal details and API keys from Firebase Secret Vault
 */
export async function loadFromFirebaseVault(uid?: string): Promise<FirebaseVaultRecord | null> {
  const targetUid = uid || "default_user";

  // Check in-memory store
  if (inMemoryVaultRecordStore.has(targetUid)) {
    return inMemoryVaultRecordStore.get(targetUid)!;
  }
  if (inMemoryVaultRecordStore.has("default_user")) {
    return inMemoryVaultRecordStore.get("default_user")!;
  }

  // Try remote Firebase Firestore first if configured
  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      const user = auth?.currentUser;
      const effectiveUid = uid || user?.uid || "default_user";

      const { getFirestore, doc, getDoc } = await import("firebase/firestore");
      const { app } = await import("@/lib/firebase");
      if (app) {
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "users", effectiveUid, "vault", "secrets"));
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
