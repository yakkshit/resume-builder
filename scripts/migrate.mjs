import postgres from "postgres";
import fs from "fs";
import path from "path";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const connectionString = process.env.DATABASE_URL || process.env.XATA_DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in .env or .env.local");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

async function run() {
  console.log("🚀 Initializing & migrating database schema...");

  // 1. Synchronize users table
  console.log("📦 Synchronizing 'users' table...");
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "clerk_id" text UNIQUE NOT NULL,
      "email" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" text;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_username" text;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_repo" text;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "github_token" text;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" text;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
  `);

  // 2. Synchronize resumes table
  console.log("📦 Synchronizing 'resumes' table...");
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "resumes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
      "title" text DEFAULT 'Untitled Resume' NOT NULL,
      "data" jsonb DEFAULT '{}'::jsonb NOT NULL,
      "pdf_url" text,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "template" text DEFAULT 'modern';
    ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
  `);

  // 3. Synchronize custom_models table
  console.log("📦 Synchronizing 'custom_models' table...");
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "custom_models" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
      "provider" text NOT NULL,
      "model_id" text NOT NULL,
      "api_key" text,
      "base_url" text,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "custom_models" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
  `);

  console.log("✨ All database tables and columns are 100% synchronized!");
  await sql.end();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
