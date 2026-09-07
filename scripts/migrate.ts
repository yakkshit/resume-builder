import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL || process.env.XATA_DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in .env or .env.local");
  process.exit(1);
}

const isReset = process.argv.includes("--reset");
const sql = postgres(connectionString, { max: 1 });

async function run() {
  console.log("🚀 Initializing & migrating database schema...");

  if (isReset) {
    console.log("⚠️  Resetting existing application tables (--reset)...");
    await sql.unsafe(`
      DROP TABLE IF EXISTS "custom_models" CASCADE;
      DROP TABLE IF EXISTS "resumes" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
    `);
    console.log("🧹 Old tables cleaned.");
  }

  // 1. Create users table
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

  // 2. Create resumes table
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

  // 3. Create custom_models table
  console.log("📦 Synchronizing 'custom_models' table...");
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "custom_models" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid REFERENCES "users"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "provider" text NOT NULL,
      "api_key" text,
      "endpoint_url" text,
      "model_name" text NOT NULL,
      "is_active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "custom_models" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
  `);

  console.log("✅ Database schema synchronized successfully!");
  await sql.end();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("❌ Database migration error:", err);
  await sql.end();
  process.exit(1);
});
