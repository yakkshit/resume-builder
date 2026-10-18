import { NextResponse } from "next/server";
import { DatabaseService } from "@/lib/db/plsql-storage";

function getUserId(req?: Request): string {
  if (req) {
    const headerId = req.headers.get("x-user-id");
    if (headerId) return headerId;
    try {
      const url = new URL(req.url);
      const queryId = url.searchParams.get("userId") || url.searchParams.get("clerkId");
      if (queryId) return queryId;
    } catch {}
  }
  return "default-user";
}

export async function GET(req: Request) {
  try {
    const userId = getUserId(req);
    const userResumes = await DatabaseService.getUserResumes(userId);
    return NextResponse.json({ resumes: userResumes });
  } catch (error) {
    console.error("[User Resumes GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId || body.clerkId || req.headers.get("x-user-id") || "default-user";
    const { id, title = "My Resume", template = "modern", data, pdfUrl } = body;

    if (!data) {
      return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
    }

    const result = await DatabaseService.saveResume({
      id,
      userId,
      title,
      template,
      data,
      pdfUrl,
    });

    return NextResponse.json({
      success: true,
      resume: result.resume,
    });
  } catch (error) {
    console.error("[User Resumes POST Error]:", error);
    return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
  }
}
