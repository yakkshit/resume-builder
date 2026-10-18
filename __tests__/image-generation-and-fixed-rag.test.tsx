import { describe, it, expect } from "vitest";
import React from "react";
import { ImageGeneration } from "@/components/ai-elements/image-generation";
import { COMPONENT_TITLES, generateAIResponse } from "@/components/chat/component-renderer";
import {
  AVAILABLE_CAREER_TOOLS,
  parseUserMessageContent,
  isDatabaseTool,
  isFixedTool,
} from "@/components/chat/ai-chat";

describe("ImageGeneration Component & User Message Tool Parsing", () => {
  it("renders ImageGeneration with default parameters", () => {
    const el = React.createElement(ImageGeneration);
    expect(el).toBeDefined();
    expect(el.type).toBe(ImageGeneration);
  });

  it("renders ImageGeneration with custom prompt and resolution", () => {
    const el = React.createElement(ImageGeneration, {
      prompt: "cyberpunk skyline with neon rain",
      resolution: "1920 × 1080",
    });
    expect(el.props.prompt).toBe("cyberpunk skyline with neon rain");
    expect(el.props.resolution).toBe("1920 × 1080");
  });

  it("registers image-generation in COMPONENT_TITLES", () => {
    expect(COMPONENT_TITLES["image-generation"]).toBe("AI Image Generation");
  });

  it("generateAIResponse triggers image-generation for visual queries", () => {
    const resp = generateAIResponse("can you generate an image of a calm mountain lake at dawn", "", "");
    expect(resp.componentType).toBe("image-generation");
    expect(resp.componentData?.resolution).toBe("1024 × 1024");
    expect(resp.componentData?.prompt).toBe("a calm mountain lake at dawn");
  });

  it("database-related tools are invisible to user in frontend tools list", () => {
    const toolIds = AVAILABLE_CAREER_TOOLS.map((t) => t.id);
    expect(toolIds).not.toContain("neo4j-graph-rag");
    expect(toolIds).not.toContain("langchain-vector-rag");
    expect(toolIds).toContain("image-generation");
    expect(toolIds).toContain("web-search");

    expect(isDatabaseTool("Neo4j Graphical RAG & Memory Vault")).toBe(true);
    expect(isDatabaseTool("LangChain Personal Vector RAG")).toBe(true);
    expect(isDatabaseTool("neo4j")).toBe(true);
    expect(isDatabaseTool("AI Image & Asset Synthesis")).toBe(false);
    expect(isDatabaseTool("web-search")).toBe(false);
  });

  it("parseUserMessageContent strips database tools from text and keeps prompt clean", () => {
    const raw = "[Active Tools: Neo4j Graphical RAG & Memory Vault, LangChain Personal Vector RAG]\n\nGenerate an image of a calm mountain lake at dawn";
    const result = parseUserMessageContent(raw);
    expect(result.cleanPrompt).toBe("Generate an image of a calm mountain lake at dawn");
    expect(result.activeToolIds).toEqual([]);
  });

  it("parseUserMessageContent extracts user-facing tool logos for bottom-right corner", () => {
    const raw = "[Active Tools: AI Image & Asset Synthesis]\n\nGenerate an image of a calm mountain lake at dawn\n\n[Attached files: sample.png]";
    const result = parseUserMessageContent(raw);
    expect(result.cleanPrompt).toBe("Generate an image of a calm mountain lake at dawn");
    expect(result.activeToolIds).toContain("image-generation");
    expect(result.attachedFiles).toEqual(["sample.png"]);
  });
});

