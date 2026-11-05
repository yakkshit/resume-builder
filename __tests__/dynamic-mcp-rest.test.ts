import { describe, it, expect, beforeEach } from "vitest";
import { POST as RestPOST, GET as RestGET } from "@/app/api/mcp/rest/route";
import { POST as SlugRestPOST, GET as SlugRestGET } from "@/app/api/mcp/rest/[slug]/route";
import { POST as SlugMcpPOST, GET as SlugMcpGET } from "@/app/api/mcp/[slug]/route";
import { GET as ConfigGET, POST as ConfigPOST } from "@/app/api/mcp/user-config/route";
import { NextRequest } from "next/server";
import {
  saveUserMcpConfig,
  getUserMcpConfig,
  checkAndConsumeQuota,
  getMcpUsageStats,
} from "@/lib/firebase/mcp-storage";

describe("Dynamic Custom MCP & REST Platform with Multi-Auth, Shared Memory Vault & Quota", () => {
  const testUserId = "user_dynamic_test_42";
  const testSlug = "tester-slug-42";

  beforeEach(async () => {
    // Set up test config with 100 requests daily limit
    await saveUserMcpConfig({
      userId: testUserId,
      slug: testSlug,
      authType: "none", // start with public
      bearerToken: "test_bearer_123",
      oauthClientId: "test_client_id",
      oauthClientSecret: "test_client_sec",
      dailyLimit: 100,
      isPublic: true,
    });
  });

  it("allows public REST access without any auth token when authType is none", async () => {
    const req = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "get_memory_vault",
        args: {},
      }),
    });

    const res = await SlugRestPOST(req, { params: Promise.resolve({ slug: testSlug }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.tool).toBe("get_memory_vault");
    expect(data.result.vaultMarkdown).toBeDefined();
    expect(data.quota).toBeDefined();
    expect(data.quota.limit).toBe(100);
    expect(data.quota.remaining).toBeLessThanOrEqual(100);
  });

  it("enforces Bearer token authentication when configured", async () => {
    // Switch auth mode to bearer
    await saveUserMcpConfig({
      userId: testUserId,
      slug: testSlug,
      authType: "bearer",
      isPublic: false,
    });

    // Request without token should fail with 401
    const unauthReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "get_memory_vault", args: {} }),
    });
    const unauthRes = await SlugRestPOST(unauthReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(unauthRes.status).toBe(401);

    // Request with valid Bearer token should succeed
    const authReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test_bearer_123",
      },
      body: JSON.stringify({ tool: "get_memory_vault", args: {} }),
    });
    const authRes = await SlugRestPOST(authReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(authRes.status).toBe(200);
    const data = await authRes.json();
    expect(data.success).toBe(true);
  });

  it("supports OAuth Client authorization (Basic Auth & Custom Headers)", async () => {
    // Switch auth mode to OAuth
    await saveUserMcpConfig({
      userId: testUserId,
      slug: testSlug,
      authType: "oauth",
      isPublic: false,
    });

    // Basic Auth header base64(client_id:client_secret)
    const credentials = Buffer.from("test_client_id:test_client_sec").toString("base64");
    const req = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
      },
      body: JSON.stringify({
        tool: "search_memory_vault",
        args: { query: "engineer" },
      }),
    });

    const res = await SlugRestPOST(req, { params: Promise.resolve({ slug: testSlug }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.tool).toBe("search_memory_vault");
  });

  it("appends and reads shared Memory Vault via tools", async () => {
    // Append to vault
    const appendReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "append_memory_vault",
        args: {
          title: "Promoted to Principal Architect",
          content: "Led migration of 200 microservices to Kubernetes with zero downtime.",
        },
      }),
    });

    const appendRes = await SlugRestPOST(appendReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(appendRes.status).toBe(200);

    // Search for newly appended milestone
    const searchReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "search_memory_vault",
        args: { query: "Principal Architect" },
      }),
    });

    const searchRes = await SlugRestPOST(searchReq, { params: Promise.resolve({ slug: testSlug }) });
    const searchData = await searchRes.json();
    expect(searchData.success).toBe(true);
    expect(searchData.result.matchCount).toBeGreaterThan(0);
  });

  it("executes career coaching, outreach drafting, and interview question tools", async () => {
    // Career Coach
    const coachReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "ask_career_coach",
        args: { question: "How to negotiate equity at a Series B startup?" },
      }),
    });
    const coachRes = await SlugRestPOST(coachReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(coachRes.status).toBe(200);
    const coachData = await coachRes.json();
    expect(coachData.result.coachingAdvice).toBeDefined();

    // Outreach Email
    const emailReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "draft_outreach_email",
        args: { recipientName: "Sarah Connor", company: "Cyberdyne", goal: "coffee_chat" },
      }),
    });
    const emailRes = await SlugRestPOST(emailReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(emailRes.status).toBe(200);
    const emailData = await emailRes.json();
    expect(emailData.result.subject).toBeDefined();
    expect(emailData.result.body).toContain("Cyberdyne");

    // Interview Questions
    const intReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tool: "generate_interview_questions",
        args: { roleTitle: "Staff Backend Engineer" },
      }),
    });
    const intRes = await SlugRestPOST(intReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(intRes.status).toBe(200);
    const intData = await intRes.json();
    expect(intData.result.questions.length).toBeGreaterThan(0);
  });

  it("enforces daily limit of 100 requests per user and returns rate limit headers", async () => {
    const quota = await checkAndConsumeQuota(testUserId, 1);
    expect(quota.allowed).toBe(true);
    expect(quota.limit).toBe(100);
    expect(quota.remaining).toBeLessThan(100);

    // Call quota telemetry tool
    const quotaReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: "get_mcp_quota_status", args: {} }),
    });
    const quotaRes = await SlugRestPOST(quotaReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(quotaRes.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(quotaRes.headers.get("X-RateLimit-Remaining")).toBeDefined();
  });

  it("allows user to update MCP configuration and retrieve telemetry via user-config API", async () => {
    // 1. Get initial config
    const getReq = new NextRequest(`http://localhost:3000/api/mcp/user-config?userId=${testUserId}`);
    const getRes = await ConfigGET(getReq);
    expect(getRes.status).toBe(200);
    const getData = await getRes.json();
    expect(getData.config.userId).toBe(testUserId);
    expect(getData.stats.limit).toBe(100);
    expect(getData.endpoints.mcp).toContain(testSlug);
    expect(getData.endpoints.rest).toContain(testSlug);

    // 2. Update config to custom auth type
    const postReq = new NextRequest(`http://localhost:3000/api/mcp/user-config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: testUserId,
        slug: "renamed-custom-slug",
        authType: "custom_header",
        customHeaderName: "x-custom-key",
        customHeaderValue: "super-secret-123",
      }),
    });
    const postRes = await ConfigPOST(postReq);
    expect(postRes.status).toBe(200);
    const postData = await postRes.json();
    expect(postData.config.slug).toBe("renamed-custom-slug");
    expect(postData.config.authType).toBe("custom_header");
  });

  it("allows safe discovery tool list_templates without 401 even under strict bearer auth", async () => {
    await saveUserMcpConfig({
      userId: testUserId,
      slug: testSlug,
      authType: "bearer",
      isPublic: false,
    });

    const mcpReq = new NextRequest(`http://localhost:3000/api/mcp/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-call-1",
        method: "tools/call",
        params: { name: "list_templates", arguments: { category: "all" } },
      }),
    });

    const mcpRes = await SlugMcpPOST(mcpReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(mcpRes.status).toBe(200);
    const mcpData = await mcpRes.json();
    expect(mcpData.result).toBeDefined();
    expect(mcpData.result.content[0].text).toContain("resumeTemplates");
  });

  it("authenticates MCP tools via query parameter token (?token=...)", async () => {
    await saveUserMcpConfig({
      userId: testUserId,
      slug: testSlug,
      authType: "bearer",
      bearerToken: "test_query_tok",
      isPublic: false,
    });

    const mcpReq = new NextRequest(`http://localhost:3000/api/mcp/${testSlug}?token=test_query_tok`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "test-call-2",
        method: "tools/call",
        params: { name: "get_memory_vault", arguments: {} },
      }),
    });

    const mcpRes = await SlugMcpPOST(mcpReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(mcpRes.status).toBe(200);
    const mcpData = await mcpRes.json();
    expect(mcpData.result).toBeDefined();
  });
});

