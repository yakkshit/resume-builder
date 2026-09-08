import { pgTable, uuid, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

/**
 * Users Table
 * Maps Clerk authentication identities to internal user entities and stores profile data.
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").unique().notNull(),
  email: text("email"),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  githubUsername: text("github_username"),
  githubRepo: text("github_repo"),
  githubToken: text("github_token"),
  githubSyncEnabled: boolean("github_sync_enabled").default(false).notNull(),
  isOnboarded: boolean("is_onboarded").default(false).notNull(),
  isIncognito: boolean("is_incognito").default(false).notNull(),
  apiKeys: jsonb("api_keys").default({}),
  encryptionSalt: text("encryption_salt"),
  preferences: jsonb("preferences").default({}),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Resumes Table
 * Stores generated and validated JSON resumes, template preferences, and PDF URLs.
 */
export const resumes = pgTable("resumes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Untitled Resume"),
  template: text("template").default("modern"),
  data: jsonb("data").notNull().default({}),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Custom Models Table
 * Allows users to register custom AI models and API keys (OpenAI, Anthropic, Google, DeepSeek, Groq, Ollama, custom endpoints).
 */
export const customModels = pgTable("custom_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq' | 'ollama' | 'openrouter' | 'custom'
  apiKey: text("api_key"),
  endpointUrl: text("endpoint_url"),
  modelName: text("model_name").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * MCP Servers Table
 * Stores external and built-in MCP server configurations and credentials.
 */
export const mcpServers = pgTable("mcp_servers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").default("http").notNull(), // 'http' | 'sse' | 'builtin'
  authToken: text("auth_token"),
  enabled: boolean("enabled").default(true).notNull(),
  tools: jsonb("tools").default([]),
  enabledTools: jsonb("enabled_tools").default([]),
  headers: jsonb("headers").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Agent Harnesses Table
 * Stores custom multi-agent server configurations with custom selected tools, tokens, and shareable endpoints.
 */
export const agentHarnesses = pgTable("agent_harnesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  slug: text("slug").unique().notNull(),
  authToken: text("auth_token").notNull(),
  systemPrompt: text("system_prompt"),
  selectedTools: jsonb("selected_tools").default([]), // array of tool names
  customInstructions: text("custom_instructions"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// TypeScript Inference Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;

export type CustomModel = typeof customModels.$inferSelect;
export type NewCustomModel = typeof customModels.$inferInsert;

export type DbMcpServer = typeof mcpServers.$inferSelect;
export type NewDbMcpServer = typeof mcpServers.$inferInsert;

export type DbAgentHarness = typeof agentHarnesses.$inferSelect;
export type NewDbAgentHarness = typeof agentHarnesses.$inferInsert;
