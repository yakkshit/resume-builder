import { describe, it, expect, vi } from "vitest";
import { POST, GET, OPTIONS } from "@/app/api/mcp/route";
import { POST as HarnessPOST, GET as HarnessGET } from "@/app/api/mcp/harness/route";
import { NextRequest } from "next/server";
import { DatabaseService } from "@/lib/db/plsql-storage";

function createPostRequest(body: Record<string, unknown>, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

function createGetRequest(url: string = "http://localhost:3000/api/mcp"): NextRequest {
  return new NextRequest(url, {
    method: "GET",
  });
}

describe("Career Agent MCP Server & Multi-Agent Harness Platform", () => {
  it("handles OPTIONS preflight with CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("handles GET endpoint metadata discovery and client configurations", async () => {
    const req = createGetRequest("http://localhost:3000/api/mcp?token=mcp_test_token");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.server).toBe("career-agent-mcp-server");
    expect(data.name).toBe("Career Agent MCP Server");
    expect(data.endpoint).toContain("/api/mcp?token=mcp_test_token");
    expect(data.supportedTools).toContain("list_templates");
    expect(data.supportedTools).toContain("search_jobs");
    expect(data.supportedTools).toContain("scrape_github_profile");
    expect(data.supportedTools).toContain("scrape_linkedin_profile");
    expect(data.supportedTools).toContain("generate_resume_pdf");
    expect(data.clientConfigurations.cursor).toBeDefined();
    expect(data.clientConfigurations.claudeCode).toBeDefined();
    expect(data.clientConfigurations.claudeDesktop).toBeDefined();
    expect(data.clientConfigurations.windsurf).toBeDefined();
  });

  it("handles JSON-RPC initialize method with Career Agent MCP name", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2024-11-05" },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(1);
    expect(data.result.serverInfo.name).toBe("career-agent-mcp-server");
    expect(data.result.serverInfo.version).toBe("2.0.0");
  });

  it("handles JSON-RPC ping method", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 2,
      method: "ping",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(2);
    expect(data.result).toEqual({});
  });

  it("lists all available MCP tools via tools/list", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 3,
      method: "tools/list",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    const tools = data.result.tools;
    expect(Array.isArray(tools)).toBe(true);

    const toolNames = tools.map((t: any) => t.name);
    expect(toolNames).toContain("list_templates");
    expect(toolNames).toContain("search_jobs");
    expect(toolNames).toContain("scrape_job_posting");
    expect(toolNames).toContain("scrape_github_profile");
    expect(toolNames).toContain("scrape_linkedin_profile");
    expect(toolNames).toContain("generate_resume_pdf");
    expect(toolNames).toContain("generate_cover_letter_pdf");
    expect(toolNames).toContain("prepare_job_application_package");
  });

  it("executes list_templates tool call successfully", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "list_templates",
        arguments: { category: "all" },
      },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.id).toBe(4);
    expect(data.result.content[0].type).toBe("text");
    const parsed = JSON.parse(data.result.content[0].text);
    expect(Array.isArray(parsed.resumeTemplates)).toBe(true);
    expect(parsed.resumeTemplates.length).toBeGreaterThan(0);
  });

  it("executes scrape_github_profile tool call (mock or live fetch)", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "scrape_github_profile",
        arguments: { username: "octocat" },
      },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.result).toBeDefined();
    expect(data.result.content[0].type).toBe("text");
  });

  it("executes scrape_linkedin_profile text parsing", async () => {
    const rawText = "John Doe\nSenior Staff Engineer at Google\nExperience in Distributed Systems, Rust, Go";
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "scrape_linkedin_profile",
        arguments: { profileText: rawText },
      },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.result.content[0].type).toBe("text");
    const parsed = JSON.parse(data.result.content[0].text);
    expect(parsed.headline).toContain("Senior Staff Engineer");
  });

  it("executes search_jobs tool call", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "search_jobs",
        arguments: { query: "Software Engineer", location: "Remote" },
      },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.jsonrpc).toBe("2.0");
    expect(data.result.content[0].type).toBe("text");
    const jobs = JSON.parse(data.result.content[0].text);
    expect(jobs).toBeDefined();
  });

  it("handles unknown tool errors cleanly", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: {
        name: "non_existent_tool",
        arguments: {},
      },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("creates, retrieves, and tests custom Agent Harnesses via API", async () => {
    const harnessReq = new NextRequest("http://localhost:3000/api/mcp/harness", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Job Hunter Agent",
        description: "Specialized in scraping jobs and tailoring ATS resumes",
        slug: "job-hunter-agent-test",
        selectedTools: ["search_jobs", "scrape_job_posting"],
        authToken: "mcp-carrier-harness-id",
      }),
    });

    const harnessRes = await HarnessPOST(harnessReq);
    expect(harnessRes.status).toBe(200);
    const harnessData = await harnessRes.json();
    expect(harnessData.success).toBe(true);
    expect(harnessData.harness.slug).toBe("job-hunter-agent-test");
    expect(harnessData.shareableUrl).toContain("harness=job-hunter-agent-test");

    // Test querying MCP with this harness
    const mcpHarnessReq = new NextRequest(
      "http://localhost:3000/api/mcp?harness=job-hunter-agent-test&token=mcp-carrier-harness-id",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 10,
          method: "tools/list",
        }),
      }
    );

    const mcpHarnessRes = await POST(mcpHarnessReq);
    const mcpHarnessData = await mcpHarnessRes.json();
    expect(mcpHarnessData.result.tools.length).toBe(2);
    const tools = mcpHarnessData.result.tools.map((t: any) => t.name);
    expect(tools).toContain("search_jobs");
    expect(tools).toContain("scrape_job_posting");
    expect(tools).not.toContain("generate_cover_letter_pdf");
  });
});
