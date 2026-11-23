import { NextRequest, NextResponse } from "next/server";
import { getFirebaseFirestore, isFirebaseConfigured, doc, getDoc } from "@/lib/firebase";
import { DatabaseService } from "@/lib/db/plsql-storage";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

// In-memory avatar cache for ultra-fast response
export const inMemoryAvatarStore = new Map<string, { buffer: Buffer; mimeType: string; timestamp: number }>();

function generateInitialsSvg(nameOrId: string): string {
  const clean = (nameOrId || "User").replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : (clean.slice(0, 2).toUpperCase() || "U");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="128" fill="url(#grad)" />
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="96" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">${initials}</text>
</svg>`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    const cleanId = (userId || "default-user").trim();
    const url = new URL(req.url);
    const hasVersionParam = Boolean(url.searchParams.get("v"));
    const cacheControlHeader = hasVersionParam
      ? "public, max-age=31536000, immutable"
      : "public, max-age=300, stale-while-revalidate=600";

    // 1. Fast in-memory hit
    if (inMemoryAvatarStore.has(cleanId)) {
      const cached = inMemoryAvatarStore.get(cleanId)!;
      return new NextResponse(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          "Content-Type": cached.mimeType,
          "Cache-Control": cacheControlHeader,
          "X-Avatar-Source": "in-memory-cache",
        },
      });
    }

    let rawImage: string | null = null;
    let isPrivateUser = false;

    // 2. Query Firestore profile document
    if (isFirebaseConfigured()) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const profileSnap = await getDoc(doc(db, "users", cleanId, "profile", "main"));
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            if (data?.isPrivate || data?.avatarVisibility === "private") {
              isPrivateUser = true;
            }
            if (data?.profilePicture) rawImage = data.profilePicture;
          }

          if (!rawImage) {
            const vaultSnap = await getDoc(doc(db, "users", cleanId, "vault", "secrets"));
            if (vaultSnap.exists()) {
              const data = vaultSnap.data();
              if (data?.personalDetails?.profilePicture) rawImage = data.personalDetails.profilePicture;
            }
          }

          if (!rawImage) {
            const userSnap = await getDoc(doc(db, "users", cleanId));
            if (userSnap.exists()) {
              const data = userSnap.data();
              if (data?.isPrivate) isPrivateUser = true;
              if (data?.profilePicture) rawImage = data.profilePicture;
            }
          }
        }
      } catch (err) {
        console.warn("Avatar Firestore lookup notice:", err);
      }
    }

    // Privacy Guard (T5 / R6): If user profile is private, anonymous enumeration returns 404 with no-store
    if (isPrivateUser) {
      const requesterId = req.headers.get("x-user-id");
      const authHeader = req.headers.get("authorization");
      const isOwner = requesterId === cleanId || Boolean(authHeader);
      if (!isOwner) {
        return new NextResponse(null, {
          status: 404,
          headers: {
            "Cache-Control": "private, no-store",
            "X-Avatar-Privacy": "enforced-private",
          },
        });
      }
    }

    // 3. Query DatabaseService
    if (!rawImage) {
      try {
        const dbUser = await DatabaseService.getUserProfile(cleanId);
        if (dbUser?.avatarUrl) rawImage = dbUser.avatarUrl;
      } catch {}
    }

    // 4. If Data URI, parse & stream
    if (rawImage && rawImage.startsWith("data:image/")) {
      const match = rawImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const buffer = Buffer.from(match[2], "base64");
        inMemoryAvatarStore.set(cleanId, { buffer, mimeType, timestamp: Date.now() });

        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            "Content-Type": mimeType,
            "Cache-Control": cacheControlHeader,
            "X-Avatar-Source": "database-data-uri",
          },
        });
      }
    }

    // 5. If HTTP/HTTPS URL, redirect with cache
    if (rawImage && (rawImage.startsWith("http://") || rawImage.startsWith("https://"))) {
      return NextResponse.redirect(rawImage, {
        status: 307,
        headers: {
          "Cache-Control": cacheControlHeader,
        },
      });
    }

    // 6. Dynamic initials SVG fallback (Zero leaked placeholder assets)
    const svg = generateInitialsSvg(cleanId);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": cacheControlHeader,
        "X-Avatar-Source": "dynamic-svg-initials",
      },
    });
  } catch (err: any) {
    const fallbackSvg = generateInitialsSvg("U");
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}
