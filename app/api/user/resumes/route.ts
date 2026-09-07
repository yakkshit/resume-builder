import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, resumes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ resumes: [] });
    }

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ resumes: [] });
    }

    const userResumes = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userRecord[0].id))
      .orderBy(desc(resumes.updatedAt));

    return NextResponse.json({ resumes: userResumes });
  } catch (error) {
    console.error("[User Resumes GET Error]:", error);
    return NextResponse.json({ error: "Failed to fetch resumes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let userRecord = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    if (userRecord.length === 0) {
      try {
        const inserted = await db
          .insert(users)
          .values({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses?.[0]?.emailAddress,
            name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
          })
          .onConflictDoUpdate({
            target: users.clerkId,
            set: { updatedAt: new Date() },
          })
          .returning();
        userRecord = inserted;
      } catch {
        userRecord = await db
          .select()
          .from(users)
          .where(eq(users.clerkId, clerkUser.id))
          .limit(1);
      }
    }

    const body = await req.json();
    const { id, title = "My Resume", template = "modern", data, pdfUrl } = body;

    if (!data) {
      return NextResponse.json({ error: "Resume data is required" }, { status: 400 });
    }

    let savedResume;
    if (id) {
      // Update existing
      savedResume = await db
        .update(resumes)
        .set({
          title,
          template,
          data,
          pdfUrl,
          updatedAt: new Date(),
        })
        .where(eq(resumes.id, id))
        .returning();
    } else {
      // Insert new
      savedResume = await db
        .insert(resumes)
        .values({
          userId: userRecord[0].id,
          title,
          template,
          data,
          pdfUrl,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      resume: savedResume[0],
    });
  } catch (error) {
    console.error("[User Resumes POST Error]:", error);
    return NextResponse.json({ error: "Failed to save resume" }, { status: 500 });
  }
}
