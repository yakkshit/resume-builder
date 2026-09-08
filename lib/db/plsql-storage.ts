/**
 * PostgreSQL / XataDB Data Storage Layer
 * Implements high-efficiency storage for users, onboarding data, resumes, and custom AI models via Drizzle ORM.
 */

import { db } from "./index";
import { users, resumes, customModels, type User, type Resume, type CustomModel } from "./schema";
import { eq, desc } from "drizzle-orm";

export class DatabaseService {
  /**
   * Get user profile by clerkId or internal UUID
   */
  static async getUserProfile(clerkIdOrId: string): Promise<User | null> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return null;
    }

    try {
      const [byClerk] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkIdOrId))
        .limit(1);

      if (byClerk) return byClerk;

      const [byId] = await db
        .select()
        .from(users)
        .where(eq(users.id, clerkIdOrId as any))
        .limit(1);

      return byId || null;
    } catch (e) {
      console.warn("Database getUserProfile error:", e);
      return null;
    }
  }

  /**
   * Upsert a user profile by clerkId or email
   */
  static async upsertUserProfile(user: {
    clerkId?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    bio?: string;
    targetRoles?: string[];
    isOnboarded?: boolean;
    isIncognito?: boolean;
    apiKeys?: Record<string, string>;
    githubUsername?: string;
    githubRepo?: string;
    githubToken?: string;
    githubSyncEnabled?: boolean;
    preferences?: Record<string, unknown>;
  }): Promise<{ success: boolean; user?: User }> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return { success: true };
    }

    const effectiveId = user.clerkId || user.email || `usr_${Date.now()}`;

    try {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, effectiveId))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(users)
          .set({
            email: user.email ?? existing.email,
            name: user.name ?? existing.name,
            avatarUrl: user.avatarUrl ?? existing.avatarUrl,
            bio: user.bio ?? existing.bio,
            isOnboarded: user.isOnboarded ?? existing.isOnboarded,
            isIncognito: user.isIncognito ?? existing.isIncognito,
            apiKeys: user.apiKeys ?? existing.apiKeys,
            githubUsername: user.githubUsername ?? existing.githubUsername,
            githubRepo: user.githubRepo ?? existing.githubRepo,
            githubToken: user.githubToken ?? existing.githubToken,
            githubSyncEnabled: user.githubSyncEnabled ?? existing.githubSyncEnabled,
            preferences: user.preferences ?? existing.preferences,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, effectiveId))
          .returning();
        return { success: true, user: updated };
      }

      const [created] = await db
        .insert(users)
        .values({
          clerkId: effectiveId,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          isOnboarded: user.isOnboarded ?? false,
          isIncognito: user.isIncognito ?? false,
          apiKeys: user.apiKeys ?? {},
          githubUsername: user.githubUsername,
          githubRepo: user.githubRepo,
          githubToken: user.githubToken,
          githubSyncEnabled: user.githubSyncEnabled ?? false,
          preferences: user.preferences ?? {},
        })
        .returning();

      return { success: true, user: created };
    } catch (e) {
      console.warn("Database upsertUserProfile error:", e);
      return { success: false };
    }
  }

  /**
   * Save onboarding completion data including profile, API keys, and GitHub sync settings
   */
  static async saveUserOnboarding(data: {
    clerkId?: string;
    name?: string;
    email?: string;
    bio?: string;
    targetRoles?: string[];
    isOnboarded?: boolean;
    isIncognito?: boolean;
    apiKeys?: Record<string, string>;
    githubUsername?: string;
    githubRepo?: string;
    githubToken?: string;
    githubSyncEnabled?: boolean;
    preferences?: Record<string, unknown>;
  }): Promise<{ success: boolean; user?: User }> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return { success: true };
    }

    const effectiveId = data.clerkId || data.email || `usr_${Date.now()}`;

    try {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, effectiveId))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(users)
          .set({
            name: data.name ?? existing.name,
            email: data.email ?? existing.email,
            bio: data.bio ?? existing.bio,
            isOnboarded: data.isOnboarded ?? true,
            isIncognito: data.isIncognito ?? existing.isIncognito,
            apiKeys: data.apiKeys ?? existing.apiKeys,
            githubUsername: data.githubUsername ?? existing.githubUsername,
            githubRepo: data.githubRepo ?? existing.githubRepo,
            githubToken: data.githubToken ?? existing.githubToken,
            githubSyncEnabled: data.githubSyncEnabled ?? existing.githubSyncEnabled,
            preferences: data.preferences ?? existing.preferences,
            updatedAt: new Date(),
          })
          .where(eq(users.clerkId, effectiveId))
          .returning();
        return { success: true, user: updated };
      }

      const [created] = await db
        .insert(users)
        .values({
          clerkId: effectiveId,
          name: data.name,
          email: data.email,
          bio: data.bio,
          isOnboarded: data.isOnboarded ?? true,
          isIncognito: data.isIncognito ?? false,
          apiKeys: data.apiKeys ?? {},
          githubUsername: data.githubUsername,
          githubRepo: data.githubRepo,
          githubToken: data.githubToken,
          githubSyncEnabled: data.githubSyncEnabled ?? false,
          preferences: data.preferences ?? {},
        })
        .returning();

      return { success: true, user: created };
    } catch (e) {
      console.warn("Database saveUserOnboarding error:", e);
      return { success: false };
    }
  }

  /**
   * Save or insert structured resume data into Drizzle resumes table
   */
  static async saveResume(resume: {
    userId?: string;
    title: string;
    template?: string;
    data: Record<string, unknown>;
    pdfUrl?: string;
  }): Promise<{ success: boolean; resume?: Resume }> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return { success: true };
    }

    try {
      const [created] = await db
        .insert(resumes)
        .values({
          userId: resume.userId,
          title: resume.title,
          template: resume.template ?? "modern",
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
   * Get user's saved resumes
   */
  static async getUserResumes(userId: string): Promise<Resume[]> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return [];
    }

    try {
      return await db
        .select()
        .from(resumes)
        .where(eq(resumes.userId, userId))
        .orderBy(desc(resumes.updatedAt));
    } catch (e) {
      console.warn("Database getUserResumes error:", e);
      return [];
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
