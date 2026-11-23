import { describe, it, expect } from "vitest";
import {
  CAREER_AGENT_PLAYBOOK_MD,
  VERIFIED_SKILLS_MD,
  STRUCTURED_SKILL_INVENTORY,
} from "@/lib/mcp/playbook-content";
import { ALL_MCP_TOOLS, executeMcpToolCall } from "@/lib/mcp/mcp-tools-catalog";
import { GET as WellKnownAgentsGET } from "@/app/.well-known/agents.md/route";
import { GET as WellKnownSkillsGET } from "@/app/.well-known/skills.md/route";
import { POST as McpRootPOST } from "@/app/api/mcp/route";
import { POST as McpSlugPOST } from "@/app/api/mcp/[slug]/route";
import { NextRequest } from "next/server";
import { saveUserMcpConfig } from "@/lib/firebase/mcp-storage";

describe("Agent Playbook (AGENTS.md), Skills Grounding & MCP Resources Contract", () => {
  const testUserId = "user_playbook_test_88";
  const testSlug = "playbook-tester-88";

  it("enforces CAREER_AGENT_PLAYBOOK_MD byte budget ≤ 2048 bytes (2 KB)", () => {
    const byteLength = Buffer.byteLength(CAREER_AGENT_PLAYBOOK_MD, "utf-8");
    expect(byteLength).toBeLessThanOrEqual(2048);
    expect(byteLength).toBeGreaterThan(500);
  });

  it("enforces VERIFIED_SKILLS_MD byte budget ≤ 2048 bytes (2 KB)", () => {
    const byteLength = Buffer.byteLength(VERIFIED_SKILLS_MD, "utf-8");
    expect(byteLength).toBeLessThanOrEqual(2048);
    expect(byteLength).toBeGreaterThan(400);
  });

  it("encodes all 6 inviolable rules in CAREER_AGENT_PLAYBOOK_MD", () => {
    expect(CAREER_AGENT_PLAYBOOK_MD).toContain("RULE 1: PHOTO INLINING & VERIFICATION");
    expect(CAREER_AGENT_PLAYBOOK_MD).toContain("RULE 2: ZERO HIDDEN-TEXT INJECTION");
    expect(CAREER_AGENT_PLAYBOOK_MD).toContain("RULE 3: LANGUAGE & GEO-CONVENTIONS");
    expect(CAREER_AGENT_PLAYBOOK_MD).toContain("RULE 4: GRAPH-CENTRALITY SECTION ORDERING");
    expect(CAREER_AGENT_PLAYBOOK_MD).toContain("RULE 5: SINGLE GROUNDED TRUTH (CAS)");
    expect(CAREER_AGENT_PLAYBOOK_MD).toContain("RULE 6: FAIL-LOUD BUDGET LIMITS");
  });

  it("contains graph-ordered verified skills with authentic metrics in STRUCTURED_SKILL_INVENTORY", () => {
    expect(STRUCTURED_SKILL_INVENTORY.skills.length).toBeGreaterThanOrEqual(8);
    const ros2Skill = STRUCTURED_SKILL_INVENTORY.skills.find((s) => s.name.includes("ROS2"));
    expect(ros2Skill).toBeDefined();

    const metricItem = STRUCTURED_SKILL_INVENTORY.metrics.find((m) => m.claim.includes("ROS2") || m.value.includes("<30ms"));
    expect(metricItem).toBeDefined();

    const ciCdMetric = STRUCTURED_SKILL_INVENTORY.metrics.find((m) => m.value.includes("99.8%"));
    expect(ciCdMetric).toBeDefined();
  });

  it("registers get_skill_inventory tool in ALL_MCP_TOOLS catalog", () => {
    const tool = ALL_MCP_TOOLS.find((t) => t.name === "get_skill_inventory");
    expect(tool).toBeDefined();
    expect(tool?.description).toContain("skills");
  });

  it("executes get_skill_inventory returning formatted markdown and structured list within 2 KB", async () => {
    const result = await executeMcpToolCall("get_skill_inventory", {}, { userId: testUserId });
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.skills).toBeInstanceOf(Array);
    expect(parsed.totalVerifiedSkills).toBeGreaterThanOrEqual(8);
    expect(parsed.resourceUri).toBe("careeragent://skills.md");
    const jsonBytes = Buffer.byteLength(JSON.stringify(parsed), "utf-8");
    expect(jsonBytes).toBeLessThanOrEqual(2048);
  });

  it("serves careeragent:// resources via root /api/mcp resources/list and resources/read", async () => {
    // 1. List
    const listReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "resources/list" }),
    });
    const listRes = await McpRootPOST(listReq);
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    const uris = listData.result.resources.map((r: any) => r.uri);
    expect(uris).toContain("careeragent://agent-playbook.md");
    expect(uris).toContain("careeragent://skills.md");

    // 2. Read
    const readReq = new NextRequest("http://localhost:3000/api/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "resources/read",
        params: { uri: "careeragent://agent-playbook.md" },
      }),
    });
    const readRes = await McpRootPOST(readReq);
    expect(readRes.status).toBe(200);
    const readData = await readRes.json();
    expect(readData.result.contents[0].text).toBe(CAREER_AGENT_PLAYBOOK_MD);
  });

  it("serves careeragent:// resources via slug /api/mcp/[slug] resources/list and resources/read", async () => {
    await saveUserMcpConfig({
      userId: testUserId,
      slug: testSlug,
      authType: "none",
      dailyLimit: 100,
      isPublic: true,
    });

    // 1. List
    const listReq = new NextRequest(`http://localhost:3000/api/mcp/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 10, method: "resources/list" }),
    });
    const listRes = await McpSlugPOST(listReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    const uris = listData.result.resources.map((r: any) => r.uri);
    expect(uris).toContain("careeragent://agent-playbook.md");
    expect(uris).toContain("careeragent://skills.md");

    // 2. Read
    const readReq = new NextRequest(`http://localhost:3000/api/mcp/${testSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 11,
        method: "resources/read",
        params: { uri: "careeragent://skills.md" },
      }),
    });
    const readRes = await McpSlugPOST(readReq, { params: Promise.resolve({ slug: testSlug }) });
    expect(readRes.status).toBe(200);
    const readData = await readRes.json();
    expect(readData.result.contents[0].text).toBe(VERIFIED_SKILLS_MD);
  });

  it("serves /.well-known/agents.md with text/markdown and CORS", async () => {
    const res = await WellKnownAgentsGET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const text = await res.text();
    expect(text).toBe(CAREER_AGENT_PLAYBOOK_MD);
  });

  it("serves /.well-known/skills.md with text/markdown and CORS", async () => {
    const res = await WellKnownSkillsGET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/markdown");
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const text = await res.text();
    expect(text).toBe(VERIFIED_SKILLS_MD);
  });
});
