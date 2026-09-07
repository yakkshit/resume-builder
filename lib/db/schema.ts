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

// TypeScript Inference Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;

export type CustomModel = typeof customModels.$inferSelect;
export type NewCustomModel = typeof customModels.$inferInsert;
