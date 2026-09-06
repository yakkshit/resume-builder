/**
 * MCP (Model Context Protocol) Client Helper
 * Interacts with the hosted MCP JSON-RPC 2.0 endpoint at /api/mcp
 */

import type { ResumeData, CoverLetterData, Template, CoverLetterTemplate } from "@/lib/types";

export interface McpToolCallResult {
  content: Array<{
    type: "text" | "blob" | "resource";
    text?: string;
    data?: string; // base64
    mimeType?: string;
  }>;
  isError?: boolean;
}

export async function callMcpTool(name: string, args: Record<string, unknown> = {}): Promise<McpToolCallResult> {
  const response = await fetch("/api/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `mcp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MCP request failed with status ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(`MCP Tool Error (${json.error.code}): ${json.error.message}`);
  }

  return json.result as McpToolCallResult;
}

/**
 * List all PDF templates available on the MCP server
 */
export async function mcpListTemplates(category: "all" | "resume" | "coverletter" = "all"): Promise<{
  resumeTemplates?: string[];
  coverLetterTemplates?: string[];
}> {
  const result = await callMcpTool("list_templates", { category });
  const textItem = result.content.find((c) => c.type === "text");
  if (!textItem?.text) return {};
  try {
    return JSON.parse(textItem.text);
  } catch {
    return {};
  }
}

/**
 * Generate Resume PDF via MCP server
 * Returns a Blob ready for download or preview
 */
export async function mcpGenerateResumePdf(resumeData: ResumeData, template: Template = "modern"): Promise<Blob> {
  const result = await callMcpTool("generate_resume_pdf", { resumeData, template });
  const blobItem = result.content.find((c) => c.type === "blob");
  if (!blobItem?.data) {
    throw new Error("MCP did not return a binary PDF blob");
  }

  const byteCharacters = atob(blobItem.data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: blobItem.mimeType || "application/pdf" });
}

/**
 * Generate Cover Letter PDF via MCP server
 * Returns a Blob ready for download or preview
 */
export async function mcpGenerateCoverLetterPdf(
  coverLetterData: CoverLetterData,
  template: CoverLetterTemplate = "standard"
): Promise<Blob> {
  const result = await callMcpTool("generate_cover_letter_pdf", { coverLetterData, template });
  const blobItem = result.content.find((c) => c.type === "blob");
  if (!blobItem?.data) {
    throw new Error("MCP did not return a binary PDF blob");
  }

  const byteCharacters = atob(blobItem.data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: blobItem.mimeType || "application/pdf" });
}
