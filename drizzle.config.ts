import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL || process.env.XATA_DATABASE_URL || "";

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  tablesFilter: ["users", "resumes", "custom_models", "mcp_servers", "agent_harnesses"],
  dbCredentials: {
    url: dbUrl,
  },
});
