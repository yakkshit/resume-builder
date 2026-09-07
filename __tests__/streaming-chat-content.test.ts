import { describe, it, expect } from "vitest";
import { isLikelyJsonEnvelope, stripIncompleteJsonTail, parseChainOfThought } from "@/lib/streaming-chat-content";

describe("isLikelyJsonEnvelope", () => {
  it("matches component and resumeData envelopes", () => {
    expect(isLikelyJsonEnvelope('{"component":"cv"}')).toBe(true);
    expect(isLikelyJsonEnvelope('{\n  "resumeData": {')).toBe(true);
    expect(isLikelyJsonEnvelope('{"componentType":"mockInterview"}')).toBe(true);
  });

  it("does not match arbitrary braces", () => {
    expect(isLikelyJsonEnvelope('{"foo":"bar"}')).toBe(false);
    expect(isLikelyJsonEnvelope("{ not json")).toBe(false);
  });
});

describe("stripIncompleteJsonTail", () => {
  it("returns text unchanged when not streaming", () => {
    expect(stripIncompleteJsonTail('{"resumeData":', false)).toBe('{"resumeData":');
  });

  it("hides incomplete JSON from first brace when streaming", () => {
    expect(stripIncompleteJsonTail('{"resumeData": {"basicInfo":', true)).toBe("");
  });

  it("keeps prose before incomplete JSON", () => {
    expect(stripIncompleteJsonTail('Here is your CV.\n\n{"resumeData":', true)).toBe("Here is your CV.");
  });

  it("returns full text when JSON parses", () => {
    const full = '{"resumeData":{"basicInfo":{"name":"A"}}}';
    expect(stripIncompleteJsonTail(full, true)).toBe(full);
  });

  it("does not strip non-envelope JSON", () => {
    expect(stripIncompleteJsonTail('{"foo":1}', true)).toBe('{"foo":1}');
  });
});

describe("parseChainOfThought", () => {
  it("extracts completed <think> block and separates cleaned response", () => {
    const raw = "<think>1. Analyze user profile\n2. Highlight ROS2 skills</think>\nHere is your tailored resume summary.";
    const result = parseChainOfThought(raw, false);
    expect(result.thinkingText).toContain("1. Analyze user profile");
    expect(result.thinkingText).toContain("2. Highlight ROS2 skills");
    expect(result.isThinkingActive).toBe(false);
    expect(result.cleanedContent).toBe("Here is your tailored resume summary.");
  });

  it("handles streaming in-flight unclosed <think> tag", () => {
    const raw = "<think>Currently reasoning about the target position and searching jobs";
    const result = parseChainOfThought(raw, true);
    expect(result.thinkingText).toBe("Currently reasoning about the target position and searching jobs");
    expect(result.isThinkingActive).toBe(true);
    expect(result.cleanedContent).toBe("");
  });

  it("extracts fenced tool calls and parameters", () => {
    const raw = "```tool:search_jobs\n{\n  \"query\": \"Robotics Engineer\",\n  \"location\": \"Remote\"\n}\n```\nFound 3 jobs matching your criteria.";
    const result = parseChainOfThought(raw, false);
    expect(result.tools.length).toBe(1);
    expect(result.tools[0].name).toBe("search_jobs");
    expect(result.tools[0].args?.query).toBe("Robotics Engineer");
    expect(result.cleanedContent).toBe("Found 3 jobs matching your criteria.");
  });

  it("detects inline tool executions inside thinking text", () => {
    const raw = "<think>I am going to use tool: search_jobs to find current AI positions</think>Jobs found.";
    const result = parseChainOfThought(raw, false);
    expect(result.tools.some((t) => t.name === "search_jobs")).toBe(true);
    expect(result.cleanedContent).toBe("Jobs found.");
  });

  it("extracts XML <tool_call> tags", () => {
    const raw = "<tool_call>{\"name\": \"scrape_github_profile\", \"arguments\": {\"username\": \"octocat\"}}</tool_call>\nProfile scraped.";
    const result = parseChainOfThought(raw, false);
    expect(result.tools.length).toBe(1);
    expect(result.tools[0].name).toBe("scrape_github_profile");
    expect(result.tools[0].args?.username).toBe("octocat");
    expect(result.cleanedContent).toBe("Profile scraped.");
  });
});
