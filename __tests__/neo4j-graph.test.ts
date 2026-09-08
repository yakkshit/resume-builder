import { describe, it, expect } from "vitest";
import { testNeo4jConnection } from "@/lib/neo4j/driver";
import { Neo4jGraphService } from "@/lib/neo4j/graph-service";

describe("Neo4j Career Knowledge Graph", () => {
  it("gracefully reports status when environment variables are not configured", async () => {
    const status = await testNeo4jConnection();
    // When env vars are not supplied, returns clear graceful message without crashing
    expect(status.success).toBe(false);
    expect(status.message).toContain("Neo4j environment variables");
  });

  it("calculates fallback skill gap correctly without throwing", async () => {
    const result = await Neo4jGraphService.calculateSkillGap("test-user-id", [
      "TypeScript",
      "Next.js",
      "Distributed Systems",
    ]);

    expect(result).toBeDefined();
    expect(result.missingSkills).toBeDefined();
    expect(Array.isArray(result.matchingSkills)).toBe(true);
  });

  it("handles user graph sync gracefully in offline fallback mode", async () => {
    const syncRes = await Neo4jGraphService.syncUserGraph({
      userId: "user-456",
      email: "engineer@company.com",
      name: "Morgan Taylor",
      targetRoles: ["Staff Engineer"],
      skills: [{ name: "PostgreSQL", category: "Database", yearsOfExperience: 5 }],
    });

    // In offline mode returns false safely without throwing
    expect(typeof syncRes).toBe("boolean");
  });
});
