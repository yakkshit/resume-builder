import { describe, it, expect, vi } from "vitest";
import { POST, GET } from "@/app/api/chat/feedback/route";
import { NextRequest } from "next/server";

describe("Chat RLHF Feedback API & Model Training Export", () => {
  it("successfully accepts and records positive chat feedback", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: "msg-12345",
        prompt: "Draft a resume summary for a Staff AI Engineer",
        response: "Staff AI Engineer with 8+ years leading large model architectures...",
        rating: 5,
        isPositive: true,
        tags: ["Accurate & Clear", "Perfect Resume Tailoring"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.feedbackId).toBeDefined();
  });

  it("successfully records correction data for negative feedback", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: "msg-67890",
        prompt: "List skills for a modern web architect",
        response: "PHP, jQuery, SVN",
        rating: 1,
        isPositive: false,
        correction: "TypeScript, Next.js, GraphQL, PostgreSQL, Docker",
        tags: ["Outdated Tech"],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("exports dataset in JSONL format for fine-tuning pipelines", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat/feedback?format=jsonl", {
      method: "GET",
    });

    const res = await GET(req);
    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("ndjson");
  });
});
