import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

function getAllowedKeys(): string[] {
  const keys = [
    process.env.API_AUTH_KEY,
    process.env.API_SECRET_KEY,
    process.env.APP_API_KEY,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0)

  return Array.from(new Set(keys))
}

/**
 * Standard API auth:
 * - Client sends header: `api-key: <secret>`
 * - We also accept `x-api-key` for backwards compatibility.
 *
 * If no env keys are configured, auth is disabled (returns null).
 */
export function requireApiKey(request: NextRequest): NextResponse | null {
  const allowed = getAllowedKeys()
  if (allowed.length === 0) return null

  const provided =
    request.headers.get("api-key") ?? request.headers.get("x-api-key")

  if (!provided || !allowed.includes(provided)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Missing or invalid api-key header.",
      },
      { status: 401 },
    )
  }

  return null
}

