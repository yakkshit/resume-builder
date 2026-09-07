import { describe, it, expect, vi } from "vitest";
import { POST, GET, OPTIONS } from "@/app/api/mcp/route";
import { NextRequest } from "next/server";

function createPostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createGetRequest(): NextRequest {
  return new NextRequest("http://localhost:3000/api/mcp", {
    method: "GET",
  });
}

describe("Model Context Protocol (MCP) Server & Tools", () => {
  it("handles OPTIONS preflight with CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("handles GET endpoint metadata discovery", async () => {
    const req = createGetRequest();
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.server).toBe("resume-coverletter-mcp-server");
    expect(data.supportedTools).toContain("list_templates");
    expect(data.supportedTools).toContain("search_jobs");
    expect(data.supportedTools).toContain("scrape_github_profile");
    expect(data.supportedTools).toContain("scrape_linkedin_profile");
    expect(data.supportedTools).toContain("generate_resume_pdf");
  });

  it("handles JSON-RPC initialize method", async () => {
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
    expect(data.result.serverInfo.name).toBe("resume-coverletter-mcp-server");
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
    const parsedText = JSON.parse(data.result.content[0].text);
    expect(parsedText.resumeTemplates.length).toBeGreaterThan(0);
    expect(parsedText.coverLetterTemplates.length).toBeGreaterThan(0);
  });

  it("executes scrape_linkedin_profile tool call successfully", async () => {
    const rawLinkedIn = `
# Yakkshit Sai
Robotics & AI Engineer

## Experience
### Robotics Researcher at University of Konstanz
- Implemented multi-agent ROS2 robot coordination.

## Skills
ROS2, C++, PyTorch, Python, FastAPIs
`;

    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 5,
      method: "tools/call",
      params: {
        name: "scrape_linkedin_profile",
        arguments: { profileText: rawLinkedIn },
      },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.result.content[0].type).toBe("text");
    const parsed = JSON.parse(data.result.content[0].text);
    expect(parsed.headline).toContain("Robotics & AI Engineer");
    expect(parsed.skills).toContain("ROS2");
    expect(parsed.skills).toContain("C++");
  });

  it("executes search_jobs tool call and returns matching job structures", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 6,
      method: "tools/call",
      params: {
        name: "search_jobs",
        arguments: { query: "Robotics Engineer", location: "Remote", maxResults: 3 },
      },
    });
    const res = await POST(req);
    const data = await res.json();
    const parsed = JSON.parse(data.result.content[0].text);
    expect(parsed.total).toBeGreaterThan(0);
    expect(parsed.jobs[0].title).toBeDefined();
    expect(parsed.jobs[0].company).toBeDefined();
  });

  it("executes scrape_job_posting tool call successfully", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: {
        name: "scrape_job_posting",
        arguments: {
          text: "We are seeking a Senior Robotics Engineer with 5+ years of experience in ROS2, C++, and SLAM algorithms.",
        },
      },
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.result.content[0].type).toBe("text");
    const parsed = JSON.parse(data.result.content[0].text);
    expect(parsed.keyRequirements.length).toBeGreaterThan(0);
    expect(parsed.recommendedKeywords.length).toBeGreaterThan(0);
  });

  it("executes scrape_github_profile tool call successfully with mocked response", async () => {
    const originalFetch = global.fetch;
    const mockUser = {
      name: "Test Developer",
      bio: "Open Source AI Engineer",
      public_repos: 12,
      followers: 40,
    };
    const mockRepos = [
      {
        name: "ros2-nav",
        description: "Autonomous navigation stack",
        language: "C++",
        stargazers_count: 25,
        fork: false,
        html_url: "https://github.com/testdev/ros2-nav",
      },
    ];

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/repos")) {
        return Promise.resolve(new Response(JSON.stringify(mockRepos), { status: 200 }));
      }
      return Promise.resolve(new Response(JSON.stringify(mockUser), { status: 200 }));
    }) as any;

    try {
      const req = createPostRequest({
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: {
          name: "scrape_github_profile",
          arguments: { username: "testdev" },
        },
      });
      const res = await POST(req);
      const data = await res.json();
      expect(data.result.content[0].type).toBe("text");
      const parsed = JSON.parse(data.result.content[0].text);
      expect(parsed.username).toBe("testdev");
      expect(parsed.name).toBe("Test Developer");
      expect(parsed.topLanguages).toContain("C++");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("returns method not found error for unknown JSON-RPC methods", async () => {
    const req = createPostRequest({
      jsonrpc: "2.0",
      id: 9,
      method: "unknown/method",
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.error.code).toBe(-32601);
    expect(data.error.message).toContain("Method not found");
  });
});
