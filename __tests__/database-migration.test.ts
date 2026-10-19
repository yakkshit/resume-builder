import { describe, it, expect } from "vitest";
import { DatabaseService } from "@/lib/db/plsql-storage";

describe("Database Storage Layer", () => {
    it("operates self-contained storage methods without errors", async () => {
        // Querying non-existent user properly returns null (clean user isolation)
        const nonExistent = await DatabaseService.getUserProfile("non-existent-user-id");
        expect(nonExistent).toBeNull();

        // Upsert user profile
        await DatabaseService.upsertUserProfile({
            id: "test-user-id",
            name: "Test User",
            email: "test@example.com",
            isOnboarded: true,
        });

        const user = await DatabaseService.getUserProfile("test-user-id");
        expect(user).toBeDefined();
        expect(user?.name).toBe("Test User");

        const resumeRes = await DatabaseService.saveResume({
            userId: "test-user-id",
            title: "Test Resume",
            data: { basicInfo: { name: "Test User" } },
        });
        expect(resumeRes.success).toBe(true);
        expect(resumeRes.resume?.title).toBe("Test Resume");

        const resumes = await DatabaseService.getUserResumes("test-user-id");
        expect(Array.isArray(resumes)).toBe(true);
        expect(resumes.length).toBeGreaterThan(0);
    });
});
