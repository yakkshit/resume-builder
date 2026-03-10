import { NextRequest, NextResponse } from "next/server"
import { requireApiKey } from "@/lib/api-auth"

export const runtime = "nodejs"

type CoverLetterData = Record<string, unknown>

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request)
  if (auth) return auth

  const { coverLetterData, jobDescription, model } = (await request.json()) as {
    coverLetterData: CoverLetterData
    jobDescription?: string
    model?: string
  }

  if (!coverLetterData) {
    return NextResponse.json(
      { error: "coverLetterData is required" },
      { status: 400 },
    )
  }

  // For now, this endpoint simply echoes the provided data and job description.
  // The UI already uses the streaming /api/cover-letter-chat route for rich interactions.
  return NextResponse.json(
    {
      coverLetterData,
      jobDescription: jobDescription ?? null,
      model: model ?? null,
    },
    { status: 200 },
  )
}

