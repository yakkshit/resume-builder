import { describe, it, expect, beforeEach } from "vitest";
import { ALL_MCP_TOOLS, executeMcpToolCall } from "@/lib/mcp/mcp-tools-catalog";
import { verifyMcpRequestAuth, saveUserMcpConfig } from "@/lib/firebase/mcp-storage";
import { POST as SlugRestPOST } from "@/app/api/mcp/rest/[slug]/route";
import { POST as SlugMcpPOST } from "@/app/api/mcp/[slug]/route";
import { NextRequest } from "next/server";

describe("MCP Tools Catalog - Resilient Parameter Handling & Unified Authentication Verification", () => {
  const testUserId = "user_mcp_verify_suite_101";
  const testSlug = "mcp-verify-slug-101";

  beforeEach(async () => {
    await saveUserMcpConfig({
      userId: testUserId,
      slug: testSlug,
      authType: "none",
      bearerToken: ["suite", "bearer", "sample", "777"].join("_"),
      isPublic: true,
      dailyLimit: 100,
    });
  });

  describe("update_memory_vault argument resilience (Fixes 'content string is required')", () => {
    it("accepts 'content' parameter", async () => {
      const result = await executeMcpToolCall(
        "update_memory_vault",
        { content: "# Updated Vault via content key" },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("accepts 'vaultMarkdown' parameter without throwing content string is required", async () => {
      const result = await executeMcpToolCall(
        "update_memory_vault",
        { vaultMarkdown: "# Updated Vault via vaultMarkdown key" },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("accepts 'markdown' parameter", async () => {
      const result = await executeMcpToolCall(
        "update_memory_vault",
        { markdown: "# Updated Vault via markdown key" },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("accepts 'text' parameter", async () => {
      const result = await executeMcpToolCall(
        "update_memory_vault",
        { text: "# Updated Vault via text key" },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("accepts nested object { content: { markdown: ... } }", async () => {
      const result = await executeMcpToolCall(
        "update_memory_vault",
        { content: { markdown: "# Updated Vault via nested object" } },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("accepts direct string as args", async () => {
      const result = await executeMcpToolCall(
        "update_memory_vault",
        "# Direct Markdown String",
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("throws helpful error when content is genuinely missing or whitespace", async () => {
      const result = await executeMcpToolCall(
        "update_memory_vault",
        { content: "   " },
        { userId: testUserId }
      );
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("content string is required");
    });
  });

  describe("append_memory_vault argument resilience", () => {
    it("accepts title and content", async () => {
      const result = await executeMcpToolCall(
        "append_memory_vault",
        { title: "Promotion", content: "Became Principal Engineer" },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("accepts heading and text aliases", async () => {
      const result = await executeMcpToolCall(
        "append_memory_vault",
        { heading: "Milestone", text: "Delivered ROS2 platform" },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });

    it("supplies default title if only content is provided", async () => {
      const result = await executeMcpToolCall(
        "append_memory_vault",
        { content: "Published research paper on agentic VLM benchmarks." },
        { userId: testUserId }
      );
      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.success).toBe(true);
    });
  });

  describe("Unified Authentication Principle", () => {
    it("allows both read and write tools when authType is none and no token is configured", async () => {
      await saveUserMcpConfig({
        userId: testUserId,
        slug: testSlug,
        authType: "none",
        bearerToken: "",
        isPublic: true,
      });

      // 1. Read tool
      const readReq = new NextRequest(`http://localhost:3000/api/mcp/${testSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_memory_vault", arguments: {} } }),
      });
      const readRes = await SlugMcpPOST(readReq, { params: Promise.resolve({ slug: testSlug }) });
      expect(readRes.status).toBe(200);

      // 2. Mutating write tool
      const writeReq = new NextRequest(`http://localhost:3000/api/mcp/${testSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/call",
          params: {
            name: "update_memory_vault",
            arguments: { content: "# Public Mode Updated Vault" },
          },
        }),
      });
      const writeRes = await SlugMcpPOST(writeReq, { params: Promise.resolve({ slug: testSlug }) });
      expect(writeRes.status).toBe(200);
      const writeData = await writeRes.json();
      expect(writeData.result.isError).toBeFalsy();
    });

    it("enforces Bearer token consistently across protected read and write tools when authType is bearer", async () => {
      const mockStrictToken = ["strict", "bearer", "sample", "123"].join("_");
      await saveUserMcpConfig({
        userId: testUserId,
        slug: testSlug,
        authType: "bearer",
        bearerToken: mockStrictToken,
        isPublic: false,
      });

      // 1. Safe discovery tool succeeds without token
      const discoReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "list_templates", args: {} }),
      });
      const discoRes = await SlugRestPOST(discoReq, { params: Promise.resolve({ slug: testSlug }) });
      expect(discoRes.status).toBe(200);

      // 2. Read tool fails without token
      const unauthReadReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "get_memory_vault", args: {} }),
      });
      const unauthReadRes = await SlugRestPOST(unauthReadReq, { params: Promise.resolve({ slug: testSlug }) });
      expect(unauthReadRes.status).toBe(401);

      // 3. Write tool fails without token
      const unauthWriteReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: "update_memory_vault", args: { content: "# Unauth" } }),
      });
      const unauthWriteRes = await SlugRestPOST(unauthWriteReq, { params: Promise.resolve({ slug: testSlug }) });
      expect(unauthWriteRes.status).toBe(401);

      // 4. Authenticated request with Bearer token succeeds for write tool
      const authWriteReq = new NextRequest(`http://localhost:3000/api/mcp/rest/${testSlug}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockStrictToken}`,
        },
        body: JSON.stringify({ tool: "update_memory_vault", args: { content: "# Authenticated Vault Update" } }),
      });
      const authWriteRes = await SlugRestPOST(authWriteReq, { params: Promise.resolve({ slug: testSlug }) });
      expect(authWriteRes.status).toBe(200);
      const authWriteData = await authWriteRes.json();
      expect(authWriteData.success).toBe(true);
    });
  });

  describe("Execution of Every Registered MCP Tool (All 42 Tools)", () => {
    it("executes every tool in ALL_MCP_TOOLS catalog without unhandled exceptions", async () => {
      // Map of sample arguments for each tool to ensure they run cleanly
      const toolSampleArgs: Record<string, any> = {
        get_memory_vault: {},
        search_memory_vault: { query: "engineering" },
        append_memory_vault: { title: "Test Note", content: "Test content" },
        update_memory_vault: { content: "# Test Vault Content" },
        get_skill_inventory: {},
        get_user_profile: {},
        update_user_profile: { title: "Software Engineer" },
        get_user_resume: {},
        create_resume: { title: "New Resume", template: "modern" },
        save_resume: { title: "Saved Resume", template: "modern" },
        update_resume_section: { section: "skills", data: ["TypeScript", "Python"] },
        tailor_resume_for_job: { jobTitle: "Robotics Engineer", companyName: "Bosch" },
        analyze_resume_ats_match: { jobDescription: "Looking for Python and ROS2 engineer." },
        list_templates: {},
        validate_template_page_budget: { template: "tech-modern" },
        auto_fit_resume_to_budget: { template: "tech-modern" },
        generate_resume_pdf: { template: "tech-modern" },
        generate_cover_letter: { companyName: "Google", targetTitle: "AI Engineer" },
        generate_cover_letter_pdf: { template: "standard" },
        prepare_job_application_package: { targetTitle: "AI Engineer", companyName: "Google" },
        search_web: { query: "Robotics Konstanz" },
        search_jobs: { query: "Software Engineer" },
        scrape_job_posting: { text: "Software Engineer role requiring React and Node.js." },
        scrape_company_intel: { companyName: "DeepMind" },
        scrape_github_profile: { username: "yakkshit" },
        scrape_linkedin_profile: { profileText: "Senior AI Engineer based in Germany" },
        browser_navigate: { url: "https://example.com" },
        browser_extract: { url: "https://example.com" },
        browser_click: { selector: "button" },
        browser_type: { selector: "input", value: "test" },
        browser_handoff: {},
        playwright_navigate: { url: "https://example.com" },
        playwright_screenshot: { url: "https://example.com" },
        playwright_extract_dom: { url: "https://example.com" },
        playwright_fill_form: { selector: "form" },
        playwright_click_element: { selector: "button" },
        playwright_evaluate: { script: "document.title" },
        ask_career_coach: { question: "How to position myself for Robotics roles?" },
        draft_outreach_email: { recipientName: "Recruiter", company: "Meta" },
        generate_interview_questions: { roleTitle: "Autonomous Navigation Engineer" },
        translate_career_document: { text: "Experienced Software Engineer", targetLanguage: "de" },
        get_mcp_quota_status: {},
      };

      for (const tool of ALL_MCP_TOOLS) {
        const sampleArg = toolSampleArgs[tool.name] || {};
        const result = await executeMcpToolCall(tool.name, sampleArg, { userId: testUserId });
        expect(result).toBeDefined();
        expect(result.content).toBeInstanceOf(Array);
        expect(result.content.length).toBeGreaterThan(0);
        expect(result.content[0].type).toBe("text");
        // Tool execution must NOT return isError true
        if (result.isError) {
          throw new Error(`Tool '${tool.name}' returned error: ${result.content[0].text}`);
        }
        expect(result.isError).toBeFalsy();
      }
    });
  });
});
