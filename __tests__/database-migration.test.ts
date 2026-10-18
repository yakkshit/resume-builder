import { describe, it, expect } from "vitest";
import { DatabaseService } from "@/lib/db/plsql-storage";

describe("Database Storage Layer", () => {
    it("operates self-contained storage methods without errors", async () => {
        const user = await DatabaseService.getUserProfile("test-user-id");
        expect(user).toBeDefined();
        expect(user?.name).toBeDefined();

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
