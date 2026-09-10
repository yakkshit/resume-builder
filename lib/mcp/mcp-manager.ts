"use client";

import { tryLocalStorageGet, tryLocalStorageSet } from "@/lib/safe-local-storage";

export interface MCPToolSchema {
  name: string;
  description?: string;
  inputSchema?: Record<string, any>;
  serverName: string;
  serverId: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: "http" | "sse" | "builtin";
  enabled: boolean;
  headers?: Record<string, string>;
  apiKey?: string;
  tools?: MCPToolSchema[];
  enabledTools?: string[];
  status?: "connected" | "error" | "connecting" | "idle";
  error?: string;
}

export interface AgentHarnessConfig {
  id: string;
  name: string;
  description?: string;
  slug: string;
  authToken: string;
  systemPrompt?: string;
  selectedTools: string[];
  customInstructions?: string;
  isPublic?: boolean;
  shareableUrl?: string;
  createdAt?: string;
}

const MCP_SERVERS_STORAGE_ID = "chat_mcp_servers_config";
const AGENT_HARNESSES_STORAGE_ID = "chat_agent_harnesses_config";

export const BUILTIN_MCP_SERVERS: MCPServerConfig[] = [
  {
    id: "builtin-career-agent",
    name: "Career Agent MCP",
    url: "/api/mcp",
    type: "builtin",
    enabled: true,
    status: "connected",
    tools: [
      {
        name: "list_templates",
        description: "List all available PDF resume and cover letter templates.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["all", "resume", "coverletter"] },
          },
        },
      },
      {
        name: "search_web",
        description: "Search the web for up-to-date information, news, documentation, or facts.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
            maxResults: { type: "number", description: "Max results (default: 5)" },
          },
          required: ["query"],
        },
      },
      {
        name: "search_jobs",
        description: "Search for live jobs and openings based on keywords, role, company, or location.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Job title, keywords, or skills" },
            location: { type: "string", description: "Location or 'Remote'" },
            maxResults: { type: "number", description: "Max results" },
          },
          required: ["query"],
        },
      },
      {
        name: "scrape_job_posting",
        description: "Scrape and extract key requirements and qualifications from a job posting URL or text.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Job URL" },
            text: { type: "string", description: "Pasted text" },
          },
        },
      },
      {
        name: "scrape_github_profile",
        description: "Scrape public GitHub profile metadata, top repositories, primary coding languages, stars, and bio to ground AI resume generation.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            username: { type: "string", description: "GitHub username" },
            githubToken: { type: "string", description: "Optional GitHub token" },
          },
          required: ["username"],
        },
      },
      {
        name: "scrape_linkedin_profile",
        description: "Parse and extract structured career history, headline, skills, and work achievements from public LinkedIn profile text.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            profileText: { type: "string", description: "Pasted text from public LinkedIn profile" },
          },
          required: ["profileText"],
        },
      },
      {
        name: "generate_resume_pdf",
        description: "Generate a PDF document for a resume given JSON data and template name.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            resumeData: { type: "object", description: "Resume JSON" },
            template: { type: "string", description: "Template name" },
          },
          required: ["resumeData"],
        },
      },
      {
        name: "generate_cover_letter_pdf",
        description: "Generate a PDF document for a cover letter given head, body, and footer content.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            coverLetterData: { type: "object" },
            template: { type: "string" },
          },
          required: ["coverLetterData"],
        },
      },
      {
        name: "prepare_job_application_package",
        description: "Generate both resume and cover letter PDF binaries for a tailored job application package.",
        serverName: "Career Agent MCP",
        serverId: "builtin-career-agent",
        inputSchema: {
          type: "object",
          properties: {
            targetTitle: { type: "string" },
            companyName: { type: "string" },
            resumeData: { type: "object" },
            coverLetterData: { type: "object" },
          },
          required: ["targetTitle", "companyName", "resumeData", "coverLetterData"],
        },
      },
    ],
  },
  {
    id: "builtin-playwright-agent",
    name: "Playwright & Puppeteer Browser MCP",
    url: "/api/mcp",
    type: "builtin",
    enabled: true,
    status: "connected",
    tools: [
      {
        name: "playwright_navigate",
        description: "Navigate headless Chromium browser to any target URL, evaluate network state, and return rendered HTML content.",
        serverName: "Playwright & Puppeteer Browser MCP",
        serverId: "builtin-playwright-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target website URL (e.g. 'https://cedzlabs.com' or 'https://github.com')" },
            waitUntil: { type: "string", enum: ["load", "domcontentloaded", "networkidle"], description: "Wait condition (default: domcontentloaded)" },
          },
          required: ["url"],
        },
      },
      {
        name: "playwright_screenshot",
        description: "Capture a full-page or viewport screenshot of any website using headless browser rendering.",
        serverName: "Playwright & Puppeteer Browser MCP",
        serverId: "builtin-playwright-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target website URL" },
            fullPage: { type: "boolean", description: "Whether to take a full page screenshot" },
          },
          required: ["url"],
        },
      },
      {
        name: "playwright_extract_dom",
        description: "Extract clean semantic HTML structure, buttons, forms, headings, and text for AI reasoning and React component generation.",
        serverName: "Playwright & Puppeteer Browser MCP",
        serverId: "builtin-playwright-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target page URL" },
            selector: { type: "string", description: "Optional CSS selector to scope extraction" },
          },
          required: ["url"],
        },
      },
      {
        name: "playwright_fill_form",
        description: "Automatically fill and submit forms, inputs, textareas, and select elements on the page.",
        serverName: "Playwright & Puppeteer Browser MCP",
        serverId: "builtin-playwright-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target form page URL" },
            fields: { type: "object", description: "Key-value mapping of field name or selector to value" },
            submitSelector: { type: "string", description: "Optional submit button selector" },
          },
          required: ["url", "fields"],
        },
      },
      {
        name: "playwright_click_element",
        description: "Simulate click or hover interaction on interactive elements, tabs, links, and navigation items.",
        serverName: "Playwright & Puppeteer Browser MCP",
        serverId: "builtin-playwright-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target page URL" },
            selector: { type: "string", description: "Target CSS selector or element text to click" },
          },
          required: ["url", "selector"],
        },
      },
      {
        name: "playwright_evaluate",
        description: "Evaluate a custom JavaScript snippet in page context to extract dynamic data or compute element layout.",
        serverName: "Playwright & Puppeteer Browser MCP",
        serverId: "builtin-playwright-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Target page URL" },
            script: { type: "string", description: "JavaScript function or expression to execute" },
          },
          required: ["url", "script"],
        },
      },
      {
        name: "browser_handoff",
        description: "Hand over browser control to the human user for manual verification (CAPTCHA, 2FA, logins) and resume when ready.",
        serverName: "Playwright & Puppeteer Browser MCP",
        serverId: "builtin-playwright-agent",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Current page URL" },
            reason: { type: "string", description: "Reason for human handoff" },
          },
          required: ["url"],
        },
      },
    ],
  },
];

export function isToolEnabled(server: MCPServerConfig, toolName: string): boolean {
  if (!server.enabled) return false;
  if (!server.enabledTools || server.enabledTools.length === 0) return true; // all active by default
  return server.enabledTools.includes(toolName);
}

export function toggleToolForServer(
  servers: MCPServerConfig[],
  serverId: string,
  toolName: string,
  enabled: boolean
): MCPServerConfig[] {
  return servers.map((server) => {
    if (server.id !== serverId) return server;
    const allTools = (server.tools || []).map((t) => t.name);
    const currentEnabled = server.enabledTools ? [...server.enabledTools] : allTools;
    let nextEnabled: string[];
    if (enabled) {
      nextEnabled = currentEnabled.includes(toolName) ? currentEnabled : [...currentEnabled, toolName];
    } else {
      nextEnabled = currentEnabled.filter((t) => t !== toolName);
    }
    return { ...server, enabledTools: nextEnabled };
  });
}

export function setAllToolsForServer(
  servers: MCPServerConfig[],
  serverId: string,
  enableAll: boolean
): MCPServerConfig[] {
  return servers.map((server) => {
    if (server.id !== serverId) return server;
    const allTools = (server.tools || []).map((t) => t.name);
    return { ...server, enabledTools: enableAll ? allTools : [] };
  });
}

export function getActiveMCPTools(servers: MCPServerConfig[]): MCPToolSchema[] {
  const activeTools: MCPToolSchema[] = [];
  for (const server of servers) {
    if (!server.enabled) continue;
    for (const tool of server.tools || []) {
      if (isToolEnabled(server, tool.name)) {
        activeTools.push(tool);
      }
    }
  }
  return activeTools;
}

export function loadMCPServers(): MCPServerConfig[] {
  if (typeof window === "undefined") return BUILTIN_MCP_SERVERS;
  try {
    const raw = tryLocalStorageGet(MCP_SERVERS_STORAGE_ID);
    if (!raw) return BUILTIN_MCP_SERVERS;
    const custom = JSON.parse(raw) as MCPServerConfig[];
    
    // Merge builtins with custom servers
    const builtins = BUILTIN_MCP_SERVERS.map((b) => {
      const existing = custom.find((c) => c.id === b.id);
      return existing
        ? {
            ...b,
            enabled: existing.enabled,
            enabledTools: existing.enabledTools || b.tools?.map((t) => t.name),
          }
        : b;
    });

    const userDefined = custom.filter((c) => !BUILTIN_MCP_SERVERS.some((b) => b.id === c.id));
    return [...builtins, ...userDefined];
  } catch (e) {
    console.error("Failed to load MCP servers:", e);
    return BUILTIN_MCP_SERVERS;
  }
}

export function saveMCPServers(servers: MCPServerConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    tryLocalStorageSet(MCP_SERVERS_STORAGE_ID, JSON.stringify(servers));
  } catch (e) {
    console.error("Failed to save MCP servers:", e);
  }
}

/**
 * Fetch and discover tools from an MCP server using JSON-RPC 2.0 tools/list.
 */
export async function discoverMCPTools(server: MCPServerConfig): Promise<MCPToolSchema[]> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(server.headers || {}),
    };
    if (server.apiKey) {
      headers["Authorization"] = `Bearer ${server.apiKey}`;
      headers["x-api-key"] = server.apiKey;
    }

    const payload = {
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/list",
      params: {},
    };

    let res: Response;
    const isBuiltin = server.type === "builtin" || server.url.startsWith("/");

    if (isBuiltin) {
      res = await fetch(server.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
    } else {
      // Use proxy for external servers to bypass CORS
      res = await fetch("/api/mcp/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: server.url,
          headers,
          payload,
        }),
      });
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    const tools = json?.result?.tools || [];

    return tools.map((t: any) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema || t.parameters,
      serverName: server.name,
      serverId: server.id,
    }));
  } catch (err: any) {
    console.error(`Failed to discover tools on ${server.name}:`, err);
    throw err;
  }
}

/**
 * Execute an MCP tool on its corresponding server via JSON-RPC 2.0 tools/call.
 */
export async function executeMCPTool(
  server: MCPServerConfig,
  toolName: string,
  toolArguments: Record<string, any>
): Promise<any> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(server.headers || {}),
  };
  if (server.apiKey) {
    headers["Authorization"] = `Bearer ${server.apiKey}`;
    headers["x-api-key"] = server.apiKey;
  }

  const payload = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: toolArguments,
    },
  };

  let res: Response;
  const isBuiltin = server.type === "builtin" || server.url.startsWith("/");

  if (isBuiltin) {
    res = await fetch(server.url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  } else {
    // Use proxy for external servers to bypass CORS
    res = await fetch("/api/mcp/proxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: server.url,
        headers,
        payload,
      }),
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`MCP tool execution failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || "MCP tool error");
  }

  return data.result;
}

/**
 * Load saved Agent Harnesses from local storage
 */
export function loadAgentHarnesses(): AgentHarnessConfig[] {
  if (typeof window === "undefined") return [];
  const raw = tryLocalStorageGet(AGENT_HARNESSES_STORAGE_ID);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save Agent Harnesses to local storage
 */
export function saveAgentHarnesses(harnesses: AgentHarnessConfig[]): void {
  if (typeof window === "undefined") return;
  tryLocalStorageSet(AGENT_HARNESSES_STORAGE_ID, JSON.stringify(harnesses));
}

/**
 * Delete an Agent Harness locally
 */
export function deleteAgentHarnessLocal(id: string): AgentHarnessConfig[] {
  const current = loadAgentHarnesses();
  const updated = current.filter((h) => h.id !== id && h.slug !== id);
  saveAgentHarnesses(updated);
  return updated;
}

