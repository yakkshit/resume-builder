export interface ParsedToolCall {
  name: string;
  args?: Record<string, any>;
  status: "active" | "complete" | "error";
  output?: string;
  rawBlock?: string;
}

/**
 * Detect JSON blobs that look like chat component envelopes (CV, etc.).
 * Avoids treating arbitrary `{` in prose as JSON.
 */
export function isLikelyJsonEnvelope(s: string): boolean {
  const t = s.trim();
  return /^\{[\s\n]*"(?:component|componentType|resumeData|type)"/.test(t);
}

/**
 * While streaming, hide incomplete JSON tails so raw `{"resumeData":...` does not flash on screen.
 * When the JSON completes, `JSON.parse` succeeds and the full text is returned for normal parsing.
 */
export function stripIncompleteJsonTail(text: string, isStreaming: boolean): string {
  if (!isStreaming || !text) return text;
  const idx = text.indexOf("{");
  if (idx < 0) return text;
  const candidate = text.slice(idx).trim();
  if (!isLikelyJsonEnvelope(candidate)) return text;
  try {
    JSON.parse(candidate);
    return text;
  } catch {
    return text.slice(0, idx).trimEnd();
  }
}

export interface ParsedChainOfThoughtResult {
  thinkingText: string;
  isThinkingActive: boolean;
  tools: ParsedToolCall[];
  cleanedContent: string;
}

/**
 * Extracts Chain of Thought (<think>...</think>, ```thought, and tool executions)
 * from message text, correctly handling both streaming and completed states.
 */
export function parseChainOfThought(
  text: string,
  isStreaming: boolean = false
): ParsedChainOfThoughtResult {
  if (!text) {
    return {
      thinkingText: "",
      isThinkingActive: false,
      tools: [],
      cleanedContent: "",
    };
  }

  let raw = text;
  let thinkingText = "";
  let isThinkingActive = false;
  const tools: ParsedToolCall[] = [];

  // 1. Handle complete <think>...</think> blocks
  const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
  let match: RegExpExecArray | null;
  while ((match = thinkRegex.exec(raw)) !== null) {
    const thoughtChunk = match[1].trim();
    if (thoughtChunk) {
      thinkingText = thinkingText ? `${thinkingText}\n\n${thoughtChunk}` : thoughtChunk;
    }
  }
  raw = raw.replace(thinkRegex, "");

  // 2. Handle in-flight unclosed <think> during streaming
  const unclosedThinkIndex = raw.indexOf("<think>");
  if (unclosedThinkIndex !== -1) {
    const inFlightThought = raw.slice(unclosedThinkIndex + 7).trim();
    thinkingText = thinkingText ? `${thinkingText}\n\n${inFlightThought}` : inFlightThought;
    isThinkingActive = isStreaming;
    raw = raw.slice(0, unclosedThinkIndex).trim();
  }

  // 3. Handle ```thought ... ``` fences
  const thoughtFenceRegex = /```(?:thought|thinking)\s*([\s\S]*?)```/gi;
  while ((match = thoughtFenceRegex.exec(raw)) !== null) {
    const thoughtChunk = match[1].trim();
    if (thoughtChunk) {
      thinkingText = thinkingText ? `${thinkingText}\n\n${thoughtChunk}` : thoughtChunk;
    }
  }
  raw = raw.replace(thoughtFenceRegex, "");

  // 4. Handle tool calls: ```tool:name\n{json}\n``` or <tool_call>
  const toolFenceRegex = /```\s*tool\s*:\s*([A-Za-z0-9_-]+)\s*([\s\S]*?)```/gi;
  while ((match = toolFenceRegex.exec(raw)) !== null) {
    const toolName = match[1].trim();
    let args: Record<string, any> = {};
    try {
      args = JSON.parse(match[2].trim() || "{}");
    } catch {
      args = { raw: match[2].trim() };
    }
    tools.push({
      name: toolName,
      args,
      status: "complete",
      rawBlock: match[0],
    });
  }
  raw = raw.replace(toolFenceRegex, "");

  const xmlToolRegex = /<tool_call>([\s\S]*?)<\/tool_call>/gi;
  while ((match = xmlToolRegex.exec(raw)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      tools.push({
        name: parsed.name || "mcp_tool",
        args: parsed.arguments || parsed.args || parsed.parameters,
        status: "complete",
        rawBlock: match[0],
      });
    } catch {
      // ignore malformed tool json
    }
  }
  raw = raw.replace(xmlToolRegex, "");

  // Also check if thinking contains tool markers like [Tool: search_jobs] or `tool:search_jobs` or Using tool: XYZ
  if (thinkingText) {
    const inlineToolRegex = /(?:using tool|calling tool|tool:|invoking tool|executing tool:?)\s*`?([a-zA-Z0-9_-]+)`?/gi;
    let inlineMatch: RegExpExecArray | null;
    const knownTools = [
      "search_jobs",
      "scrape_job_posting",
      "scrape_github_profile",
      "scrape_linkedin_profile",
      "web_scraper",
      "job_scraper",
      "chart_generator",
      "generate_chart",
      "generate_resume_pdf",
      "generate_cover_letter_pdf",
      "list_templates",
      "calculate_ats_score",
      "cv_scorer",
      "prepare_job_application_package",
      "auto_apply",
      "neo4j_career_graph",
      "github_encrypted_sync",
      "gitlab_encrypted_sync",
      "memory_vault_ingest",
      "compile_latex",
      "mcp_tool",
    ];
    while ((inlineMatch = inlineToolRegex.exec(thinkingText)) !== null) {
      const toolName = inlineMatch[1].toLowerCase();
      const matched = knownTools.find((kt) => kt.toLowerCase() === toolName) || toolName;
      if (!tools.some((t) => t.name.toLowerCase() === matched.toLowerCase())) {
        tools.push({
          name: matched,
          status: isThinkingActive ? "active" : "complete",
        });
      }
    }
  }

  return {
    thinkingText: thinkingText.trim(),
    isThinkingActive,
    tools,
    cleanedContent: raw.trim(),
  };
}
