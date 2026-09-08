/**
 * PostgreSQL / XataDB Data Storage Layer
 * Implements high-efficiency storage for users, onboarding data, resumes, and custom AI models via Drizzle ORM.
 */

import { db } from "./index";
import {
  users,
  resumes,
  customModels,
  mcpServers,
  agentHarnesses,
  type User,
  type Resume,
  type CustomModel,
  type DbMcpServer,
  type DbAgentHarness,
} from "./schema";
import { eq, desc, or, and } from "drizzle-orm";

const inMemoryMcpServers = new Map<string, DbMcpServer>();
const inMemoryHarnesses = new Map<string, DbAgentHarness>();

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

  /**
   * Save or update an MCP server configuration in database
   */
  static async saveMcpServer(server: {
    id?: string;
    userId?: string;
    name: string;
    url: string;
    type?: string;
    authToken?: string;
    enabled?: boolean;
    tools?: any[];
    enabledTools?: string[];
    headers?: Record<string, string>;
  }): Promise<{ success: boolean; server?: DbMcpServer }> {
    const fallbackServer: DbMcpServer = {
      id: (server.id || `local-mcp-${Date.now()}`) as any,
      userId: server.userId || null,
      name: server.name,
      url: server.url,
      type: server.type || "http",
      authToken: server.authToken || null,
      enabled: server.enabled !== false,
      tools: server.tools || [],
      enabledTools: server.enabledTools || [],
      headers: server.headers || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      inMemoryMcpServers.set(fallbackServer.id.toString(), fallbackServer);
      return {
        success: true,
        server: fallbackServer,
      };
    }

    try {
      if (server.id) {
        const [existing] = await db
          .select()
          .from(mcpServers)
          .where(eq(mcpServers.id, server.id as any))
          .limit(1);

        if (existing) {
          const [updated] = await db
            .update(mcpServers)
            .set({
              name: server.name ?? existing.name,
              url: server.url ?? existing.url,
              type: server.type ?? existing.type,
              authToken: server.authToken ?? existing.authToken,
              enabled: server.enabled ?? existing.enabled,
              tools: server.tools ?? existing.tools,
              enabledTools: server.enabledTools ?? existing.enabledTools,
              headers: server.headers ?? existing.headers,
              updatedAt: new Date(),
            })
            .where(eq(mcpServers.id, server.id as any))
            .returning();
          return { success: true, server: updated };
        }
      }

      const [created] = await db
        .insert(mcpServers)
        .values({
          userId: server.userId,
          name: server.name,
          url: server.url,
          type: server.type ?? "http",
          authToken: server.authToken,
          enabled: server.enabled ?? true,
          tools: server.tools ?? [],
          enabledTools: server.enabledTools ?? [],
          headers: server.headers ?? {},
        })
        .returning();

      return { success: true, server: created };
    } catch (e) {
      console.warn("Database saveMcpServer error:", e);
      return { success: false };
    }
  }

  /**
   * Get MCP servers for a user
   */
  static async getUserMcpServers(userId?: string): Promise<DbMcpServer[]> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return Array.from(inMemoryMcpServers.values());
    }

    try {
      if (userId) {
        return await db
          .select()
          .from(mcpServers)
          .where(eq(mcpServers.userId, userId))
          .orderBy(desc(mcpServers.createdAt));
      }
      return await db.select().from(mcpServers).orderBy(desc(mcpServers.createdAt));
    } catch (e) {
      console.warn("Database getUserMcpServers error:", e);
      return [];
    }
  }

  /**
   * Delete an MCP server
   */
  static async deleteMcpServer(id: string): Promise<boolean> {
    inMemoryMcpServers.delete(id);
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return true;
    }

    try {
      await db.delete(mcpServers).where(eq(mcpServers.id, id as any));
      return true;
    } catch (e) {
      console.warn("Database deleteMcpServer error:", e);
      return false;
    }
  }

  /**
   * Save or update an Agent Harness configuration in database
   */
  static async saveAgentHarness(harness: {
    id?: string;
    userId?: string;
    name: string;
    description?: string;
    slug: string;
    authToken: string;
    systemPrompt?: string;
    selectedTools?: string[];
    customInstructions?: string;
    isPublic?: boolean;
  }): Promise<{ success: boolean; harness?: DbAgentHarness }> {
    const fallbackHarness: DbAgentHarness = {
      id: (harness.id || `local-harness-${Date.now()}`) as any,
      userId: harness.userId || null,
      name: harness.name,
      description: harness.description || null,
      slug: harness.slug,
      authToken: harness.authToken,
      systemPrompt: harness.systemPrompt || null,
      selectedTools: harness.selectedTools || [],
      customInstructions: harness.customInstructions || null,
      isPublic: harness.isPublic || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      inMemoryHarnesses.set(harness.slug, fallbackHarness);
      inMemoryHarnesses.set(fallbackHarness.id.toString(), fallbackHarness);
      return {
        success: true,
        harness: fallbackHarness,
      };
    }

    try {
      const [existing] = await db
        .select()
        .from(agentHarnesses)
        .where(or(
          harness.id ? eq(agentHarnesses.id, harness.id as any) : undefined,
          eq(agentHarnesses.slug, harness.slug)
        ))
        .limit(1);

      if (existing) {
        const [updated] = await db
          .update(agentHarnesses)
          .set({
            name: harness.name ?? existing.name,
            description: harness.description ?? existing.description,
            authToken: harness.authToken ?? existing.authToken,
            systemPrompt: harness.systemPrompt ?? existing.systemPrompt,
            selectedTools: harness.selectedTools ?? existing.selectedTools,
            customInstructions: harness.customInstructions ?? existing.customInstructions,
            isPublic: harness.isPublic ?? existing.isPublic,
            updatedAt: new Date(),
          })
          .where(eq(agentHarnesses.id, existing.id))
          .returning();
        return { success: true, harness: updated };
      }

      const [created] = await db
        .insert(agentHarnesses)
        .values({
          userId: harness.userId,
          name: harness.name,
          description: harness.description,
          slug: harness.slug,
          authToken: harness.authToken,
          systemPrompt: harness.systemPrompt,
          selectedTools: harness.selectedTools ?? [],
          customInstructions: harness.customInstructions,
          isPublic: harness.isPublic ?? false,
        })
        .returning();

      return { success: true, harness: created };
    } catch (e) {
      console.warn("Database saveAgentHarness error:", e);
      return { success: false };
    }
  }

  /**
   * Get all Agent Harnesses for a user
   */
  static async getUserAgentHarnesses(userId?: string): Promise<DbAgentHarness[]> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      // Filter out duplicate entries stored by ID vs slug
      const uniqueHarnesses = new Map<string, DbAgentHarness>();
      for (const h of inMemoryHarnesses.values()) {
        uniqueHarnesses.set(h.slug, h);
      }
      return Array.from(uniqueHarnesses.values());
    }

    try {
      if (userId) {
        return await db
          .select()
          .from(agentHarnesses)
          .where(eq(agentHarnesses.userId, userId))
          .orderBy(desc(agentHarnesses.createdAt));
      }
      return await db.select().from(agentHarnesses).orderBy(desc(agentHarnesses.createdAt));
    } catch (e) {
      console.warn("Database getUserAgentHarnesses error:", e);
      return [];
    }
  }

  /**
   * Find an Agent Harness by slug or ID and verify token
   */
  static async getAgentHarnessBySlugOrToken(
    slugOrId: string,
    token?: string
  ): Promise<DbAgentHarness | null> {
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      const match = inMemoryHarnesses.get(slugOrId);
      if (match) {
        if (token && match.authToken !== token && !match.isPublic) {
          return null;
        }
        return match;
      }
      return null;
    }

    try {
      const [bySlug] = await db
        .select()
        .from(agentHarnesses)
        .where(eq(agentHarnesses.slug, slugOrId))
        .limit(1);

      if (bySlug) {
        if (token && bySlug.authToken !== token && !bySlug.isPublic) {
          return null;
        }
        return bySlug;
      }

      const [byId] = await db
        .select()
        .from(agentHarnesses)
        .where(eq(agentHarnesses.id, slugOrId as any))
        .limit(1);

      if (byId) {
        if (token && byId.authToken !== token && !byId.isPublic) {
          return null;
        }
        return byId;
      }

      return null;
    } catch (e) {
      console.warn("Database getAgentHarnessBySlugOrToken error:", e);
      return null;
    }
  }

  /**
   * Delete an Agent Harness
   */
  static async deleteAgentHarness(idOrSlug: string): Promise<boolean> {
    inMemoryHarnesses.delete(idOrSlug);
    if (!process.env.DATABASE_URL && !process.env.XATA_DATABASE_URL) {
      return true;
    }

    try {
      await db
        .delete(agentHarnesses)
        .where(or(eq(agentHarnesses.id, idOrSlug as any), eq(agentHarnesses.slug, idOrSlug)));
      return true;
    } catch (e) {
      console.warn("Database deleteAgentHarness error:", e);
      return false;
    }
  }
}
