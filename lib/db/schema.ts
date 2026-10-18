/**
 * Data Storage Contracts & Entity Types
 * Pure TypeScript schema contracts independent of ORMs and external platforms.
 */

export interface User {
  id: string;
  clerkId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  githubUsername?: string | null;
  githubRepo?: string | null;
  githubToken?: string | null;
  githubSyncEnabled: boolean;
  isOnboarded: boolean;
  isIncognito: boolean;
  apiKeys?: Record<string, string> | null;
  encryptionSalt?: string | null;
  preferences?: Record<string, unknown> | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export type NewUser = Partial<User>;

export interface Resume {
  id: string;
  userId?: string | null;
  title: string;
  template?: string | null;
  data: Record<string, unknown>;
  pdfUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
export type NewResume = Partial<Resume>;

export interface CustomModel {
  id: string;
  userId?: string | null;
  name: string;
  provider: string; // 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq' | 'ollama' | 'openrouter' | 'custom'
  apiKey?: string | null;
  endpointUrl?: string | null;
  modelName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type NewCustomModel = Partial<CustomModel>;

export interface DbMcpServer {
  id: string;
  userId?: string | null;
  name: string;
  url: string;
  type: string; // 'http' | 'sse' | 'builtin'
  authToken?: string | null;
  enabled: boolean;
  tools: any[];
  enabledTools: string[];
  headers: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
export type NewDbMcpServer = Partial<DbMcpServer>;

export interface DbAgentHarness {
  id: string;
  userId?: string | null;
  name: string;
  description?: string | null;
  slug: string;
  authToken: string;
  systemPrompt?: string | null;
  selectedTools: string[];
  customInstructions?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export type NewDbAgentHarness = Partial<DbAgentHarness>;

// Entity descriptor mappings for backward-compatible naming
export const users = { tableName: "users" };
export const resumes = { tableName: "resumes" };
export const customModels = { tableName: "custom_models" };
export const mcpServers = { tableName: "mcp_servers" };
export const agentHarnesses = { tableName: "agent_harnesses" };
