import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL as string);

async function main() {
    try {
        await sql`DROP TABLE IF EXISTS "agent_harnesses" CASCADE;`;
        console.log("Dropped agent_harnesses table successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
