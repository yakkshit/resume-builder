import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore, isFirebaseConfigured, doc, setDoc } from "@/lib/firebase";
import { inMemoryAvatarStore } from "@/app/api/avatar/[userId]/route";
import { DatabaseService } from "@/lib/db/plsql-storage";
import { invalidateMcpToolCaches } from "@/lib/mcp/mcp-tools-catalog";
import { sanitizeAndValidateImage } from "@/lib/crypto/image-sanitizer";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-user-id",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let userId = "default-user";
    let dataUri = "";
    let mimeType = "image/jpeg";
    let buffer: Buffer | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      userId = (formData.get("userId") as string) || "default-user";

      if (!file) {
        return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400, headers: corsHeaders });
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Image exceeds 5MB size limit" }, { status: 400, headers: corsHeaders });
      }

      mimeType = file.type || "image/jpeg";
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      const body = await req.json().catch(() => ({}));
      userId = body.userId || "default-user";
      dataUri = body.dataUri || body.image || "";

      if (!dataUri || typeof dataUri !== "string") {
        return NextResponse.json({ ok: false, error: "Missing image data" }, { status: 400, headers: corsHeaders });
      }

      const match = dataUri.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        buffer = Buffer.from(match[2], "base64");
      } else {
        return NextResponse.json({ ok: false, error: "Invalid data URI format" }, { status: 400, headers: corsHeaders });
      }

      if (buffer.length > 5 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: "Image exceeds 5MB limit" }, { status: 400, headers: corsHeaders });
      }
    }

    if (!buffer) {
      return NextResponse.json({ ok: false, error: "Invalid image buffer" }, { status: 400, headers: corsHeaders });
    }

    // Sanitize image: strip EXIF metadata, validate dimensions against decompression bombs
    let sanitized;
    try {
      sanitized = sanitizeAndValidateImage(buffer, mimeType);
    } catch (err: any) {
      return NextResponse.json(
        { ok: false, error: err?.message || "Image validation failed" },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanId = userId.trim() || "default-user";
    const cleanBuffer = sanitized.cleanBuffer;
    const finalMime = sanitized.mimeType;
    const versionHash = sanitized.contentHash;
    const cleanDataUri = `data:${finalMime};base64,${cleanBuffer.toString("base64")}`;

    // 1. Cache stripped buffer in fast in-memory store
    inMemoryAvatarStore.set(cleanId, {
      buffer: cleanBuffer,
      mimeType: finalMime,
      timestamp: Date.now(),
    });

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "resume.cedzlabs.com";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const canonicalShortUrl = `/api/avatar/${cleanId}?v=${versionHash}`;
    const fullShortUrl = `${proto}://${host}${canonicalShortUrl}`;
    const timestamp = new Date().toISOString();

    // 2. Persist in Firestore atomically
    if (isFirebaseConfigured()) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          await setDoc(
            doc(db, "users", cleanId, "profile", "main"),
            {
              profilePicture: cleanDataUri,
              photoDataUri: cleanDataUri,
              avatarUrl: canonicalShortUrl,
              photoUpdatedAt: timestamp,
              photoHash: versionHash,
            },
            { merge: true }
          );

          await setDoc(
            doc(db, "users", cleanId),
            {
              profilePicture: cleanDataUri,
              photoDataUri: cleanDataUri,
              avatarUrl: canonicalShortUrl,
              photoUpdatedAt: timestamp,
              photoHash: versionHash,
            },
            { merge: true }
          );
        }
      } catch (err) {
        console.warn("Firestore photo upload notice:", err);
      }
    }

    // 3. Update database record
    try {
      await DatabaseService.upsertUserProfile({
        id: cleanId,
        avatarUrl: canonicalShortUrl,
      });
    } catch {}

    // 4. Invalidate MCP caches so get_user_profile immediately reflects the new canonical avatar
    invalidateMcpToolCaches(cleanId);

    return NextResponse.json(
      {
        ok: true,
        userId: cleanId,
        avatarUrl: canonicalShortUrl,
        shortUrl: canonicalShortUrl,
        fullUrl: fullShortUrl,
        timestamp,
        mimeType: finalMime,
        byteLength: cleanBuffer.length,
        width: sanitized.width,
        height: sanitized.height,
        version: versionHash,
        message: "Profile photo uploaded and canonical short URL generated successfully.",
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Failed to upload photo" },
      { status: 500, headers: corsHeaders }
    );
  }
}
