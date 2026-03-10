import type { NextRequest } from "next/server"
import { POST as generatePdf } from "@/app/api/generate-pdf/route"
import { requireApiKey } from "@/lib/api-auth"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request)
  if (auth) return auth

  // Simple alias to the existing PDF generation route for REST-style usage.
  return generatePdf(request)
}

