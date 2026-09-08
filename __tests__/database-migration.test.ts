import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

describe("Database Migration Status", () => {
    it("should be able to run db:push or generate without errors (dry run)", () => {
        try {
            // Run a simple generation to check that schema is valid
            const output = execSync("pnpm run db:generate", { encoding: "utf-8" });
            expect(output).toContain("drizzle-kit generate");
        } catch (err: any) {
            // If it fails, we throw to fail the test
            throw new Error(`Database schema check failed: ${err.message}\n${err.stdout}\n${err.stderr}`);
        }
    });
});
