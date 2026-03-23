"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { renderChatComponent, type ComponentType, type CvComponentContext } from "./chat-component-registry";

/**
 * Parses content for component blocks: ```component:name\n{json}\n```
 * Also supports: ``` component:name or ```component: name (with spaces)
 */
function parseContentWithComponents(raw: string): Array<
  | { type: "markdown"; content: string }
  | { type: "component"; componentType: ComponentType; props: unknown; rawBlock: string }
> {
  const result: Array<
    | { type: "markdown"; content: string }
    | { type: "component"; componentType: ComponentType; props: unknown; rawBlock: string }
  > = [];
  // Match fenced blocks:
  // ```component:name\n{...}\n```
  // ``` component : name\n{...}\n```
  const componentRegex = /```\s*component\s*:\s*([A-Za-z][\w-]*)\s*\r?\n([\s\S]*?)```/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = componentRegex.exec(raw)) !== null) {
    const before = raw.slice(lastIndex, match.index).trim();
    if (before) {
      result.push({ type: "markdown", content: before });
    }
    const componentType = (match[1] || "") as ComponentType;
    let props: unknown;
    try {
      const jsonStr = match[2].trim() || "{}";
      props = JSON.parse(jsonStr);
    } catch {
      props = {};
    }
    result.push({ type: "component", componentType, props, rawBlock: match[0] });
    lastIndex = match.index + match[0].length;
  }

  // Also support non-fenced inline format:
  // component:name
  // { ...json... }
  // This helps when models omit backticks.
  if (result.length === 0) {
    const inlineRegex = /(?:^|\n)\s*component\s*:\s*([A-Za-z][\w-]*)\s*\r?\n(\{[\s\S]*?\})/gi;
    lastIndex = 0;
    while ((match = inlineRegex.exec(raw)) !== null) {
      const before = raw.slice(lastIndex, match.index).trim();
      if (before) result.push({ type: "markdown", content: before });
      const componentType = (match[1] || "") as ComponentType;
      let props: unknown = {};
      try {
        props = JSON.parse((match[2] || "{}").trim());
      } catch {
        props = {};
      }
      result.push({ type: "component", componentType, props, rawBlock: match[0] });
      lastIndex = match.index + match[0].length;
    }
    const afterInline = raw.slice(lastIndex).trim();
    if (afterInline) result.push({ type: "markdown", content: afterInline });
  }

  const after = raw.slice(lastIndex).trim();
  if (after) {
    result.push({ type: "markdown", content: after });
  }

  if (result.length === 0 && raw.trim()) {
    result.push({ type: "markdown", content: raw });
  }

  return result;
}

function extractComponentFromJsonEnvelope(jsonText: string):
  | { componentType: ComponentType; props: unknown }
  | null {
  try {
    const parsed = JSON.parse((jsonText || "").trim()) as Record<string, unknown>;
    if (!parsed || typeof parsed !== "object") return null;

    const typeCandidate =
      (parsed.component as string | undefined) ??
      (parsed.componentType as string | undefined) ??
      (parsed.type as string | undefined);

    if (!typeCandidate) return null;
    const normalized = normalizeComponentType(typeCandidate);
    if (!normalized) return null;

    // Common envelopes:
    // { component: "cv", props: {...} }
    // { componentType: "coverLetter", data: {...} }
    // { component: "cv", resumeData: {...}, template: "modern" }
    const explicitProps =
      (parsed.props as unknown) ??
      (parsed.data as unknown) ??
      (parsed.payload as unknown);

    if (explicitProps && typeof explicitProps === "object") {
      return { componentType: normalized, props: explicitProps };
    }

    const { component, componentType, type, ...rest } = parsed;
    return { componentType: normalized, props: rest };
  } catch {
    return null;
  }
}

const validComponentTypes: ComponentType[] = [
  "cv",
  "coverLetter",
  "jobLinks",
  "cvScorer",
  "course",
  "mockInterview",
  "hrNote",
  "jobApplySimulator",
];

function normalizeComponentType(s: string): ComponentType | null {
  const key = (s || "").trim().toLowerCase();
  const map: Record<string, ComponentType> = {
    cv: "cv",
    coverletter: "coverLetter",
    joblinks: "jobLinks",
    cvscorer: "cvScorer",
    course: "course",
    mockinterview: "mockInterview",
    hrnote: "hrNote",
    jobapplysimulator: "jobApplySimulator",
  };
  return map[key] ?? null;
}

function isComponentType(s: string): s is ComponentType {
  const normalized = normalizeComponentType(s);
  return !!normalized && validComponentTypes.includes(normalized);
}

interface ChatMessageRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
  cvContext?: CvComponentContext;
  dark?: boolean;
}

export function ChatMessageRenderer({
  content,
  className,
  isStreaming = false,
  cvContext,
  dark = false,
}: ChatMessageRendererProps) {
  if (!content?.trim()) return null;

  const parts = parseContentWithComponents(content);
  const hasParsedComponent = parts.some((p) => p.type === "component");

  // Fallback parser for JSON envelope blocks, e.g.
  // ```json
  // {"component":"cv","props":{...}}
  // ```
  const envelopeComponents: Array<{ componentType: ComponentType; props: unknown; rawBlock: string }> = [];
  if (!hasParsedComponent) {
    const fencedRegex = /```(?:json|javascript|js|ts|typescript)?\s*\r?\n([\s\S]*?)```/gi;
    let m: RegExpExecArray | null;
    while ((m = fencedRegex.exec(content)) !== null) {
      const payload = m[1] ?? "";
      const extracted = extractComponentFromJsonEnvelope(payload);
      if (extracted) {
        envelopeComponents.push({
          componentType: extracted.componentType,
          props: extracted.props,
          rawBlock: m[0],
        });
      }
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {parts.map((part, i) => {
        if (part.type === "markdown") {
          return (
            <div
              key={i}
              className={cn(
                "prose prose-sm max-w-none",
                dark ? "prose-invert prose-p:text-gray-200 prose-li:text-gray-200" : "dark:prose-invert",
                "prose-p:my-1.5 prose-ul:my-2 prose-ol:my-2 prose-li:my-0",
                "prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2"
              )}
            >
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 space-y-0.5 my-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 space-y-0.5 my-2">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <pre
                          className="bg-muted rounded-lg p-3 overflow-x-auto my-2 text-sm"
                          {...props}
                        >
                          <code>{children}</code>
                        </pre>
                      );
                    }
                    return (
                      <code
                        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {part.content}
              </ReactMarkdown>
              {isStreaming && i === parts.length - 1 && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-primary animate-pulse align-middle" />
              )}
            </div>
          );
        }

        if (part.type === "component" && isComponentType(part.componentType)) {
          const normalized = normalizeComponentType(part.componentType as string);
          if (!normalized) return null;
          const el = renderChatComponent(
            normalized,
            part.props,
            { cv: cvContext }
          );
          if (el) {
            return (
              <div key={i} className="my-4 w-full max-w-2xl">
                {el}
              </div>
            );
          }
          // If component parsing succeeds but rendering fails, keep raw block visible
          // so JSON/instructions do not "disappear".
          return (
            <pre key={i} className="bg-muted rounded-lg p-3 overflow-x-auto my-2 text-xs text-[#9aa0a6]">
              <code>{part.rawBlock}</code>
            </pre>
          );
        }

        return null;
      })}
      {envelopeComponents.map((part, i) => {
        const el = renderChatComponent(part.componentType, part.props, { cv: cvContext });
        if (el) {
          return (
            <div key={`env-${i}`} className="my-4 w-full max-w-2xl">
              {el}
            </div>
          );
        }
        return (
          <pre key={`env-raw-${i}`} className="bg-muted rounded-lg p-3 overflow-x-auto my-2 text-xs text-[#9aa0a6]">
            <code>{part.rawBlock}</code>
          </pre>
        );
      })}
    </div>
  );
}
