/**
 * Production Server-Side Photo Resolver & Verification Engine
 * 
 * Inlines user avatars as clean, downsized base64 data URIs directly into PDF templates.
 * Enforces zero-galaxy fail-loud contract, eliminates relative URL failures in headless renderers,
 * and guarantees emitted PDFs remain < 2 MB.
 */

import { getFirebaseFirestore, isFirebaseConfigured, doc, getDoc, setDoc } from "@/lib/firebase";
import { DatabaseService } from "@/lib/db/plsql-storage";
import { inMemoryAvatarStore } from "@/app/api/avatar/[userId]/route";
import { sanitizeAndValidateImage } from "@/lib/crypto/image-sanitizer";

export class PhotoResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoResolutionError";
  }
}

export interface PhotoResolutionResult {
  photoEmbedded: boolean;
  photoSource: "storage" | "profile-doc" | "github" | "memory" | "none";
  photoHash: string;
  photoBytes: number;
  photoDataUri: string;
  isPlaceholder: boolean;
}

// Banned placeholder markers that must NEVER leak as user headshots
const BANNED_PLACEHOLDER_MARKERS = [
  "deepmind-picture-2.jpg",
  "default-user",
  "placeholder.svg",
  "og-image.png",
];

export function isPlaceholderUri(uri?: string | null): boolean {
  if (!uri || typeof uri !== "string" || !uri.trim()) return true;
  const clean = uri.trim().toLowerCase();
  return BANNED_PLACEHOLDER_MARKERS.some((marker) => clean.includes(marker));
}

/**
 * Creates a clean 256x256 WebP / JPEG base64 Data URI from raw buffer
 */
export function createDownsizedPhotoDataUri(
  buffer: Buffer,
  declaredMimeType: string = "image/jpeg"
): { dataUri: string; mimeType: string; hash: string; bytes: number } {
  const sanitized = sanitizeAndValidateImage(buffer, declaredMimeType);
  const mime = sanitized.mimeType;
  const base64 = sanitized.cleanBuffer.toString("base64");
  const dataUri = `data:${mime};base64,${base64}`;

  return {
    dataUri,
    mimeType: mime,
    hash: sanitized.contentHash,
    bytes: sanitized.cleanBuffer.length,
  };
}

/**
 * Determines whether a user has an authentic uploaded photo in any persistent store
 */
export async function userHasUploadedPhoto(userId: string): Promise<boolean> {
  const cleanId = (userId || "default-user").trim();

  // 1. Fast in-memory check
  if (inMemoryAvatarStore.has(cleanId)) {
    const cached = inMemoryAvatarStore.get(cleanId);
    if (cached && cached.buffer && cached.buffer.length > 0) return true;
  }

  // 2. Firestore check
  if (isFirebaseConfigured()) {
    try {
      const db = getFirebaseFirestore();
      if (db) {
        const profileSnap = await getDoc(doc(db, "users", cleanId, "profile", "main"));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          if (data?.photoDataUri && !isPlaceholderUri(data.photoDataUri)) return true;
          if (data?.profilePicture && !isPlaceholderUri(data.profilePicture)) return true;
        }

        const userSnap = await getDoc(doc(db, "users", cleanId));
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data?.photoDataUri && !isPlaceholderUri(data.photoDataUri)) return true;
          if (data?.profilePicture && !isPlaceholderUri(data.profilePicture)) return true;
        }
      }
    } catch {}
  }

  // 3. DatabaseService check
  try {
    const dbUser = await DatabaseService.getUserProfile(cleanId);
    if (dbUser?.avatarUrl && !isPlaceholderUri(dbUser.avatarUrl)) return true;
  } catch {}

  return false;
}

/**
 * Resolves user avatar server-side with zero external HTTP requests, zero cookie dependencies,
 * and zero reliance on relative URLs.
 */
export async function resolveUserAvatarServerSide(userId: string): Promise<PhotoResolutionResult> {
  const cleanId = (userId || "default-user").trim();

  // 1. Check in-memory avatar store (highest priority, freshly uploaded in session)
  if (inMemoryAvatarStore.has(cleanId)) {
    const cached = inMemoryAvatarStore.get(cleanId)!;
    if (cached.buffer && cached.buffer.length > 0) {
      const { dataUri, hash, bytes } = createDownsizedPhotoDataUri(cached.buffer, cached.mimeType);
      return {
        photoEmbedded: true,
        photoSource: "memory",
        photoHash: hash,
        photoBytes: bytes,
        photoDataUri: dataUri,
        isPlaceholder: false,
      };
    }
  }

  // 2. Check Firestore profile document (photoDataUri or profilePicture)
  if (isFirebaseConfigured()) {
    try {
      const db = getFirebaseFirestore();
      if (db) {
        // First check profile/main subcollection
        const profileSnap = await getDoc(doc(db, "users", cleanId, "profile", "main"));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          const targetUri = data?.photoDataUri || data?.profilePicture;
          if (targetUri && typeof targetUri === "string" && !isPlaceholderUri(targetUri)) {
            const match = targetUri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (match) {
              const mimeType = match[1];
              const buf = Buffer.from(match[2], "base64");
              const { dataUri, hash, bytes } = createDownsizedPhotoDataUri(buf, mimeType);
              // Cache in memory for subsequent tool calls
              inMemoryAvatarStore.set(cleanId, { buffer: buf, mimeType, timestamp: Date.now() });
              return {
                photoEmbedded: true,
                photoSource: "profile-doc",
                photoHash: hash,
                photoBytes: bytes,
                photoDataUri: dataUri,
                isPlaceholder: false,
              };
            }
          }
        }

        // Second check top-level users document
        const userSnap = await getDoc(doc(db, "users", cleanId));
        if (userSnap.exists()) {
          const data = userSnap.data();
          const targetUri = data?.photoDataUri || data?.profilePicture;
          if (targetUri && typeof targetUri === "string" && !isPlaceholderUri(targetUri)) {
            const match = targetUri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (match) {
              const mimeType = match[1];
              const buf = Buffer.from(match[2], "base64");
              const { dataUri, hash, bytes } = createDownsizedPhotoDataUri(buf, mimeType);
              inMemoryAvatarStore.set(cleanId, { buffer: buf, mimeType, timestamp: Date.now() });
              return {
                photoEmbedded: true,
                photoSource: "profile-doc",
                photoHash: hash,
                photoBytes: bytes,
                photoDataUri: dataUri,
                isPlaceholder: false,
              };
            }
          }
        }

        // Third check vault secrets
        const vaultSnap = await getDoc(doc(db, "users", cleanId, "vault", "secrets"));
        if (vaultSnap.exists()) {
          const data = vaultSnap.data();
          const targetUri = data?.personalDetails?.profilePicture || data?.personalDetails?.photoDataUri;
          if (targetUri && typeof targetUri === "string" && !isPlaceholderUri(targetUri)) {
            const match = targetUri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
            if (match) {
              const mimeType = match[1];
              const buf = Buffer.from(match[2], "base64");
              const { dataUri, hash, bytes } = createDownsizedPhotoDataUri(buf, mimeType);
              inMemoryAvatarStore.set(cleanId, { buffer: buf, mimeType, timestamp: Date.now() });
              return {
                photoEmbedded: true,
                photoSource: "profile-doc",
                photoHash: hash,
                photoBytes: bytes,
                photoDataUri: dataUri,
                isPlaceholder: false,
              };
            }
          }
        }
      }
    } catch (err) {
      console.warn("Firestore photo lookup warning:", err);
    }
  }

  // 3. Check DatabaseService
  try {
    const dbUser = await DatabaseService.getUserProfile(cleanId);
    if (dbUser?.avatarUrl && !isPlaceholderUri(dbUser.avatarUrl)) {
      if (dbUser.avatarUrl.startsWith("data:image/")) {
        const match = dbUser.avatarUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const buf = Buffer.from(match[2], "base64");
          const { dataUri, hash, bytes } = createDownsizedPhotoDataUri(buf, mimeType);
          return {
            photoEmbedded: true,
            photoSource: "profile-doc",
            photoHash: hash,
            photoBytes: bytes,
            photoDataUri: dataUri,
            isPlaceholder: false,
          };
        }
      }
    }
  } catch {}

  // 4. Fail-Loud Check: If the user actually has an uploaded photo but it failed to resolve
  const hasPhoto = await userHasUploadedPhoto(cleanId);
  if (hasPhoto) {
    throw new PhotoResolutionError(
      `PhotoResolutionError: User '${cleanId}' has an uploaded profile photo, but server-side resolution failed. Falling back to default-user or galaxy placeholder is strictly prohibited.`
    );
  }

  // 5. Genuine No-Photo state (Zero galaxy banner fallback)
  return {
    photoEmbedded: false,
    photoSource: "none",
    photoHash: "",
    photoBytes: 0,
    photoDataUri: "",
    isPlaceholder: true,
  };
}
