import { describe, it, expect } from "vitest";
import { DatabaseService } from "@/lib/db/plsql-storage";

describe("DatabaseService & User Onboarding Persistence", () => {
  it("gracefully handles database operations in offline or fallback mode", async () => {
    // When DATABASE_URL is not set or points to local mock, service returns safe fallbacks
    const profile = await DatabaseService.getUserProfile("test-user@example.com");
    // Fallback profile object is returned safely without throwing
    expect(profile).toBeDefined();
  });

  it("handles upsertUserProfile and saveUserOnboarding without throwing errors", async () => {
    const upsertRes = await DatabaseService.upsertUserProfile({
      email: "engineer@company.com",
      name: "Jordan Lee",
      bio: "AI Systems Architect",
      targetRoles: ["AI Lead", "Tech Lead"],
      apiKeys: { openai: "sk-mock-123", gemini: "AIza-mock-456" },
      isOnboarded: true,
      isIncognito: false,
      githubSyncEnabled: true,
      preferences: { githubOwner: "jordanlee", githubRepo: "my-career-vault" },
    });

    expect(upsertRes).toBeDefined();

    const onboardingRes = await DatabaseService.saveUserOnboarding({
      email: "engineer@company.com",
      name: "Jordan Lee",
      apiKeys: { openai: "sk-mock-123" },
      githubSyncEnabled: true,
      preferences: { githubOwner: "jordanlee", githubRepo: "my-career-vault" },
    });

    expect(onboardingRes).toBeDefined();
  });

  it("handles saveResume and getUserResumes gracefully", async () => {
    const resumeRes = await DatabaseService.saveResume({
      userId: "user-123",
      title: "Senior AI Engineer Resume",
      template: "gradient",
      data: {
        basicInfo: { name: "Jordan Lee" },
        skills: { Core: ["Next.js", "PostgreSQL", "Drizzle ORM"] },
      },
    });

    expect(resumeRes).toBeDefined();

    const userResumes = await DatabaseService.getUserResumes("user-123");
    expect(Array.isArray(userResumes)).toBe(true);
  });
});
