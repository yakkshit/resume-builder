/**
 * PostgreSQL / PLSQL Data Storage Layer
 * Implements high-efficiency storage for users, resumes, and custom AI models via Drizzle ORM.
 */

import { db } from "./index";
import { users, resumes, customModels, type User, type Resume, type CustomModel } from "./schema";
import { eq } from "drizzle-orm";

export class DatabaseService {
  /**
   * Upsert a user profile by clerkId or email
   */
  static async upsertUserProfile(user: { clerkId: string; email?: string }): Promise<{ success: boolean; user?: User }> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return { success: true };
    }

    try {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, user.clerkId))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(users)
          .set({ email: user.email })
          .where(eq(users.clerkId, user.clerkId))
          .returning();
        return { success: true, user: updated };
      }

      const [created] = await db
        .insert(users)
        .values({
          clerkId: user.clerkId,
          email: user.email,
        })
        .returning();

      return { success: true, user: created };
    } catch (e) {
      console.warn("Database upsertUserProfile error:", e);
      return { success: false };
    }
  }

  /**
   * Save or insert structured resume data into Drizzle resumes table
   */
  static async saveResume(resume: { userId?: string; title: string; data: Record<string, unknown>; pdfUrl?: string }): Promise<{ success: boolean; resume?: Resume }> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return { success: true };
    }

    try {
      const [created] = await db
        .insert(resumes)
        .values({
          userId: resume.userId,
          title: resume.title,
          data: resume.data,
          pdfUrl: resume.pdfUrl,
        })
        .returning();

      return { success: true, resume: created };
    } catch (e) {
      console.warn("Database saveResume error:", e);
      return { success: false };
    }
  }

  /**
   * Fetch custom models for a user
   */
  static async getUserCustomModels(userId: string): Promise<CustomModel[]> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return [];
    }

    try {
      return await db
        .select()
        .from(customModels)
        .where(eq(customModels.userId, userId));
    } catch (e) {
      console.warn("Database getUserCustomModels error:", e);
      return [];
    }
  }
}
