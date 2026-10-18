/**
 * Local & Cloud-Ready Data Storage Layer
 * High-performance, self-contained data service for users, resumes, models, and MCP tools.
 * Operates without external ORM or vendor-locked database dependencies.
 */

import {
  type User,
  type Resume,
  type CustomModel,
  type DbMcpServer,
  type DbAgentHarness,
} from "./schema";

const inMemoryUsers = new Map<string, User>();
const inMemoryResumes = new Map<string, Resume>();
const inMemoryCustomModels = new Map<string, CustomModel>();
const inMemoryMcpServers = new Map<string, DbMcpServer>();
const inMemoryHarnesses = new Map<string, DbAgentHarness>();

export class DatabaseService {
  /**
   * Get user profile by ID or external identifier
   */
  static async getUserProfile(clerkIdOrId: string): Promise<User | null> {
    if (!clerkIdOrId) return null;

    // Check direct ID or clerkId lookup
    for (const u of inMemoryUsers.values()) {
      if (u.id === clerkIdOrId || u.clerkId === clerkIdOrId || u.email === clerkIdOrId) {
        return u;
      }
    }

    // Default fallback user for offline / local testing
    return {
      id: clerkIdOrId,
      clerkId: clerkIdOrId,
      email: (clerkIdOrId.includes("@") && !clerkIdOrId.endsWith("@user.local"))
        ? clerkIdOrId
        : "yakkshit.tactopus@gmail.com",
      name: "Yakkshit Sai",
      avatarUrl: null,
      githubUsername: null,
      githubRepo: null,
      githubToken: null,
      githubSyncEnabled: false,
      isOnboarded: true,
      isIncognito: false,
      apiKeys: {},
      encryptionSalt: null,
      preferences: {},
      bio: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Upsert a user profile
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
    const effectiveId = user.clerkId || user.email || `usr_${Date.now()}`;
    const existing = inMemoryUsers.get(effectiveId);

    const updatedUser: User = {
      id: existing?.id || effectiveId,
      clerkId: effectiveId,
      email: user.email ?? existing?.email ?? null,
      name: user.name ?? existing?.name ?? "Career User",
      avatarUrl: user.avatarUrl ?? existing?.avatarUrl ?? null,
      bio: user.bio ?? existing?.bio ?? null,
      isOnboarded: user.isOnboarded ?? existing?.isOnboarded ?? true,
      isIncognito: user.isIncognito ?? existing?.isIncognito ?? false,
      apiKeys: user.apiKeys ?? existing?.apiKeys ?? {},
      githubUsername: user.githubUsername ?? existing?.githubUsername ?? null,
      githubRepo: user.githubRepo ?? existing?.githubRepo ?? null,
      githubToken: user.githubToken ?? existing?.githubToken ?? null,
      githubSyncEnabled: user.githubSyncEnabled ?? existing?.githubSyncEnabled ?? false,
      preferences: user.preferences ?? existing?.preferences ?? {},
      encryptionSalt: existing?.encryptionSalt ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    inMemoryUsers.set(effectiveId, updatedUser);
    return { success: true, user: updatedUser };
  }

  /**
   * Save onboarding completion data
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
    return this.upsertUserProfile(data);
  }

  /**
   * Save or insert structured resume data
   */
  static async saveResume(resume: {
    id?: string;
    userId?: string;
    title: string;
    template?: string;
    data: Record<string, unknown>;
    pdfUrl?: string;
  }): Promise<{ success: boolean; resume?: Resume }> {
    const resumeId = resume.id || `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const existing = inMemoryResumes.get(resumeId);

    const saved: Resume = {
      id: resumeId,
      userId: resume.userId || existing?.userId || "default-user",
      title: resume.title || existing?.title || "My Resume",
      template: resume.template ?? existing?.template ?? "modern",
      data: resume.data || existing?.data || {},
      pdfUrl: resume.pdfUrl ?? existing?.pdfUrl ?? null,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    inMemoryResumes.set(resumeId, saved);
    return { success: true, resume: saved };
  }

  /**
   * Get user's saved resumes
   */
  static async getUserResumes(userId: string): Promise<Resume[]> {
    const list: Resume[] = [];
    for (const r of inMemoryResumes.values()) {
      if (!userId || r.userId === userId || r.userId === "default-user") {
        list.push(r);
      }
    }
    return list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Get resume by ID
   */
  static async getResumeById(id: string): Promise<Resume | null> {
    return inMemoryResumes.get(id) || null;
  }

  /**
   * Fetch custom models for a user
   */
  static async getUserCustomModels(userId: string): Promise<CustomModel[]> {
    const models: CustomModel[] = [];
    for (const m of inMemoryCustomModels.values()) {
      if (!userId || m.userId === userId || m.userId === "default-user") {
        models.push(m);
      }
    }
    return models;
  }

  /**
   * Save or update a custom model
   */
  static async saveCustomModel(model: {
    id?: string;
    userId?: string;
    name: string;
    provider: string;
    apiKey?: string | null;
    endpointUrl?: string | null;
    modelName: string;
    isActive?: boolean;
  }): Promise<CustomModel> {
    const modelKey = model.id || `${model.userId || "default"}_${model.provider}`;
    const existing = inMemoryCustomModels.get(modelKey);

    const saved: CustomModel = {
      id: existing?.id || model.id || `mod_${Date.now()}`,
      userId: model.userId || existing?.userId || "default-user",
      name: model.name || existing?.name || `${model.provider} (${model.modelName})`,
      provider: model.provider,
      apiKey: model.apiKey !== undefined ? model.apiKey : existing?.apiKey ?? null,
      endpointUrl: model.endpointUrl !== undefined ? model.endpointUrl : existing?.endpointUrl ?? null,
      modelName: model.modelName || existing?.modelName || "default",
      isActive: model.isActive !== undefined ? model.isActive : existing?.isActive ?? true,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    inMemoryCustomModels.set(saved.id, saved);
    inMemoryCustomModels.set(modelKey, saved);
    return saved;
  }

  /**
   * Delete custom model
   */
  static async deleteCustomModel(userId: string, idOrProvider: string): Promise<boolean> {
    for (const [key, m] of inMemoryCustomModels.entries()) {
      if ((m.userId === userId || m.userId === "default-user") && (m.id === idOrProvider || m.provider === idOrProvider)) {
        inMemoryCustomModels.delete(key);
      }
    }
    return true;
  }

  /**
   * Save or update an MCP server configuration
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
    const id = server.id || `mcp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existing = inMemoryMcpServers.get(id);

    const saved: DbMcpServer = {
      id,
      userId: server.userId || existing?.userId || null,
      name: server.name || existing?.name || "MCP Server",
      url: server.url || existing?.url || "",
      type: server.type || existing?.type || "http",
      authToken: server.authToken !== undefined ? server.authToken : existing?.authToken ?? null,
      enabled: server.enabled !== undefined ? server.enabled : existing?.enabled ?? true,
      tools: server.tools || existing?.tools || [],
      enabledTools: server.enabledTools || existing?.enabledTools || [],
      headers: server.headers || existing?.headers || {},
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    inMemoryMcpServers.set(id, saved);
    return { success: true, server: saved };
  }

  /**
   * Get MCP servers for a user
   */
  static async getUserMcpServers(userId?: string): Promise<DbMcpServer[]> {
    if (!userId) return Array.from(inMemoryMcpServers.values());
    return Array.from(inMemoryMcpServers.values()).filter(
      (s) => !s.userId || s.userId === userId
    );
  }

  /**
   * Delete an MCP server
   */
  static async deleteMcpServer(id: string): Promise<boolean> {
    inMemoryMcpServers.delete(id);
    return true;
  }

  /**
   * Save or update an Agent Harness configuration
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
    const id = harness.id || `harness_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const existing = inMemoryHarnesses.get(harness.slug) || inMemoryHarnesses.get(id);

    const saved: DbAgentHarness = {
      id: existing?.id || id,
      userId: harness.userId || existing?.userId || null,
      name: harness.name || existing?.name || "Agent Harness",
      description: harness.description !== undefined ? harness.description : existing?.description ?? null,
      slug: harness.slug,
      authToken: harness.authToken || existing?.authToken || "",
      systemPrompt: harness.systemPrompt !== undefined ? harness.systemPrompt : existing?.systemPrompt ?? null,
      selectedTools: harness.selectedTools || existing?.selectedTools || [],
      customInstructions: harness.customInstructions !== undefined ? harness.customInstructions : existing?.customInstructions ?? null,
      isPublic: harness.isPublic !== undefined ? harness.isPublic : existing?.isPublic ?? false,
      createdAt: existing?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    inMemoryHarnesses.set(saved.slug, saved);
    inMemoryHarnesses.set(saved.id, saved);
    return { success: true, harness: saved };
  }

  /**
   * Get all Agent Harnesses for a user
   */
  static async getUserAgentHarnesses(userId?: string): Promise<DbAgentHarness[]> {
    const unique = new Map<string, DbAgentHarness>();
    for (const h of inMemoryHarnesses.values()) {
      if (!userId || !h.userId || h.userId === userId) {
        unique.set(h.slug, h);
      }
    }
    return Array.from(unique.values());
  }

  /**
   * Find an Agent Harness by slug or ID and verify token
   */
  static async getAgentHarnessBySlugOrToken(
    slugOrId: string,
    token?: string
  ): Promise<DbAgentHarness | null> {
    const match = inMemoryHarnesses.get(slugOrId);
    if (!match) return null;
    if (token && match.authToken !== token && !match.isPublic) {
      return null;
    }
    return match;
  }

  /**
   * Delete an Agent Harness
   */
  static async deleteAgentHarness(idOrSlug: string): Promise<boolean> {
    const match = inMemoryHarnesses.get(idOrSlug);
    if (match) {
      inMemoryHarnesses.delete(match.slug);
      inMemoryHarnesses.delete(match.id);
    }
    return true;
  }
}
