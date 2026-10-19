/**
 * Firebase User Profile Database Synchronization
 * Synchronizes user identity (name, email, avatar, career metadata) directly with Firebase Firestore
 * and Firebase Auth state.
 */

import {
  getFirebaseAuth,
  getFirebaseFirestore,
  isFirebaseConfigured,
  updateProfile as firebaseUpdateProfile,
  doc,
  setDoc,
  getDoc,
} from "@/lib/firebase";
import { loadProfile, saveProfile, type UserProfile } from "@/components/chat/profile-settings-dialog";
import { saveToFirebaseVault } from "@/lib/firebase/vault-storage";

export interface FirebaseProfileSyncResult {
  ok: boolean;
  syncedTo: "firestore" | "local_cache";
  uid: string;
  name: string;
  email: string;
  timestamp: string;
  error?: string;
}

/**
 * Pushes the complete user profile into Firebase Firestore and updates Firebase Auth displayName/photoURL.
 */
export async function syncUserProfileToFirebase(
  profilePatch: Partial<UserProfile>
): Promise<FirebaseProfileSyncResult> {
  const current = loadProfile();
  const merged: UserProfile = { ...current, ...profilePatch };
  
  // Save locally first
  saveProfile(merged);

  const timestamp = new Date().toISOString();
  let uid = "default_user";

  if (isFirebaseConfigured()) {
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth?.currentUser;
      if (currentUser) {
        uid = currentUser.uid;

        // 1. Update Firebase Auth displayName and photoURL if available
        if (merged.name || merged.profilePicture) {
          try {
            await firebaseUpdateProfile(currentUser, {
              displayName: merged.name || currentUser.displayName || undefined,
              photoURL: merged.profilePicture || currentUser.photoURL || undefined,
            });
          } catch (authErr) {
            console.warn("Notice updating Firebase Auth profile:", authErr);
          }
        }
      }

      // 2. Push profile record to Firestore database
      const db = getFirebaseFirestore();
      if (db) {
        const profilePayload = {
          uid,
          name: (merged.name && merged.name !== "Yakkshit Sai") ? merged.name : "",
          email: (merged.email && merged.email !== "yakkshit.tactopus@gmail.com") ? merged.email : (currentUser?.email && currentUser.email !== "yakkshit.tactopus@gmail.com" ? currentUser.email : ""),
          phone: merged.phone || "",
          location: merged.location || "",
          linkedin: merged.linkedin || "",
          github: merged.github || "",
          targetRoles: merged.targetRoles || "",
          careerNotes: merged.careerNotes || "",
          profilePicture: merged.profilePicture || "",
          defaultEmailProvider: merged.defaultEmailProvider || "gmail",
          updatedAt: timestamp,
          syncedToFirebase: true,
        };

        // Write to both top-level users doc and profile subcollection
        await setDoc(doc(db, "users", uid), profilePayload, { merge: true });
        await setDoc(doc(db, "users", uid, "profile", "main"), profilePayload, { merge: true });

        // 3. Keep secret vault in sync
        await saveToFirebaseVault({
          personalDetails: {
            name: profilePayload.name,
            email: profilePayload.email,
            phone: profilePayload.phone,
            location: profilePayload.location,
            linkedin: profilePayload.linkedin,
            github: profilePayload.github,
            targetRoles: profilePayload.targetRoles,
            careerNotes: profilePayload.careerNotes,
            profilePicture: profilePayload.profilePicture,
          },
          apiKeys: {},
          encryptionPassphrase: merged.encryptionPassphrase,
          githubToken: merged.githubToken,
          githubRepo: merged.githubRepo,
        });

        // Trigger reactive update across all open components
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ai-chat-profile-updated", { detail: profilePayload }));
        }

        return {
          ok: true,
          syncedTo: "firestore",
          uid,
          name: profilePayload.name,
          email: profilePayload.email,
          timestamp,
        };
      }
    } catch (err: any) {
      console.warn("Firestore profile sync notice (saved to local cache):", err);
    }
  }

  // Trigger reactive local update
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("ai-chat-profile-updated", { detail: merged }));
  }

  return {
    ok: true,
    syncedTo: "local_cache",
    uid,
    name: (merged.name && merged.name !== "Yakkshit Sai") ? merged.name : "",
    email: (merged.email && merged.email !== "yakkshit.tactopus@gmail.com") ? merged.email : "",
    timestamp,
  };
}

/**
 * Pulls profile record from Firestore database and merges with local profile
 */
export async function fetchUserProfileFromFirebase(targetUid?: string): Promise<UserProfile | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const auth = getFirebaseAuth();
    const uid = targetUid || auth?.currentUser?.uid || "default_user";
    const db = getFirebaseFirestore();

    if (db) {
      const snap = await getDoc(doc(db, "users", uid, "profile", "main"));
      if (snap.exists()) {
        const data = snap.data();
        const current = loadProfile();
        const merged: UserProfile = {
          ...current,
          name: data.name || current.name,
          email: data.email || current.email,
          phone: data.phone || current.phone,
          location: data.location || current.location,
          linkedin: data.linkedin || current.linkedin,
          github: data.github || current.github,
          targetRoles: data.targetRoles || current.targetRoles,
          careerNotes: data.careerNotes || current.careerNotes,
          profilePicture: data.profilePicture || current.profilePicture,
        };
        saveProfile(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn("Could not fetch profile from Firebase Firestore:", err);
  }

  return null;
}
