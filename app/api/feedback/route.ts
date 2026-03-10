import { NextResponse } from "next/server"
import { saveFeedbackToSheet } from "@/database/migrations"
import type { NextRequest } from "next/server"
import { requireApiKey } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  try {
    const auth = requireApiKey(req)
    if (auth) return auth

    const data = await req.json()

    // Validate required fields
    const requiredFields = ["name", "email", "type", "service", "message"]
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Save feedback to Google Sheet
    await saveFeedbackToSheet(data)

    return NextResponse.json({ success: true, message: "Feedback submitted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error processing feedback:", error)
    return NextResponse.json({ error: "Failed to process feedback" }, { status: 500 })
  }
}