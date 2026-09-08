import { describe, it, expect } from "vitest";
import { parseChainOfThought } from "../lib/streaming-chat-content";
import { extractResumeJsonFromMessage } from "../lib/extract-resume-json";

describe("Chain of Thought & Tool Invocation Visibility", () => {
  it("extracts complete <think>...</think> block and tool calls", () => {
    const raw = `<think>
I need to find frontend jobs and generate a chart.
Using tool: web_scraper
Using tool: chart_generator
</think>
Here are the latest frontend opportunities:
\`\`\`component:job-scraper
{
  "query": "Frontend Developer",
  "location": "Remote",
  "jobs": []
}
\`\`\``;

    const result = parseChainOfThought(raw, false);
    expect(result.thinkingText).toContain("I need to find frontend jobs and generate a chart.");
    expect(result.isThinkingActive).toBe(false);
    expect(result.tools.length).toBeGreaterThanOrEqual(2);
    expect(result.tools.some((t) => t.name === "web_scraper")).toBe(true);
    expect(result.tools.some((t) => t.name === "chart_generator")).toBe(true);
    expect(result.cleanedContent).toContain("Here are the latest frontend opportunities:");
    expect(result.cleanedContent).not.toContain("<think>");
  });

  it("handles in-flight streaming <think> block without closing tag", () => {
    const streamingRaw = `<think>Analyzing the user's resume against the job description...
Using tool: calculate_ats_score`;

    const result = parseChainOfThought(streamingRaw, true);
    expect(result.thinkingText).toContain("Analyzing the user's resume");
    expect(result.isThinkingActive).toBe(true);
    expect(result.tools.some((t) => t.name === "calculate_ats_score")).toBe(true);
  });

  it("extracts fenced tool blocks \`\`\`tool:name {json}\`\`\`", () => {
    const raw = `\`\`\`tool:search_jobs
{
  "query": "Senior React Engineer",
  "location": "San Francisco"
}
\`\`\`
Jobs found successfully.`;

    const result = parseChainOfThought(raw, false);
    expect(result.tools.length).toBe(1);
    expect(result.tools[0].name).toBe("search_jobs");
    expect(result.tools[0].args?.query).toBe("Senior React Engineer");
    expect(result.cleanedContent).toBe("Jobs found successfully.");
  });

  it("recognizes interactive chart component in message payloads", () => {
    const message = `Here is your skill breakdown:
\`\`\`component:chart
{
  "type": "bar",
  "title": "Skills Analysis",
  "data": [{ "skill": "React", "score": 95 }]
}
\`\`\``;

    const regex = /```component:([a-zA-Z0-9-]+)\s*([\s\S]*?)(?:```|$)/g;
    const match = regex.exec(message);
    expect(match).not.toBeNull();
    expect(match![1]).toBe("chart");
    const parsed = JSON.parse(match![2].trim());
    expect(parsed.type).toBe("bar");
    expect(parsed.title).toBe("Skills Analysis");
  });
});
