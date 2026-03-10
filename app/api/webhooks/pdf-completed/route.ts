import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { requireApiKey } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request)
  if (auth) return auth

  const payload = await request.json().catch(() => ({}))
  console.log("Received pdf-completed webhook:", payload)

  return NextResponse.json({ received: true }, { status: 200 })
}

