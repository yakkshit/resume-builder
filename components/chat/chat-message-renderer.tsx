"use client";

import React, { Children, isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { stripIncompleteJsonTail } from "@/lib/streaming-chat-content";
import { Skeleton } from "@/components/ui/skeleton";
import { renderChatComponent, type ComponentType, type CvComponentContext } from "./chat-component-registry";

/** HAST / React can pass className as string or string[] — normalize for language checks */
function classNameToString(c: unknown): string {
  if (c == null) return "";
  if (typeof c === "string") return c;
  if (Array.isArray(c)) return c.filter(Boolean).map(String).join(" ");
  return String(c);
}

/** Normalize exotic whitespace / quotes so fence + JSON parse reliably */
function normalizeComponentMarkdown(raw: string): string {
  return raw
    .replace(/\uFEFF/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\u2028|\u2029/g, "\n")
    .replace(/\u00A0/g, " ");
}

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
  // Allow optional whitespace/newline between `component:name` and JSON (models often put `{` on the same line).
  const componentRegex = /```\s*component\s*:\s*([A-Za-z][\w-]*)\s*([\s\S]*?)```/gi;
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
  } else {
    const after = raw.slice(lastIndex).trim();
    if (after) {
      result.push({ type: "markdown", content: after });
    }
  }

  if (result.length === 0 && raw.trim()) {
    result.push({ type: "markdown", content: raw });
  }

  return result;
}

function codeChildrenToString(node: React.ReactNode): string {
  if (node == null) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(codeChildrenToString).join("");
  if (isValidElement(node) && node.props && typeof node.props === "object" && node.props !== null) {
    const ch = (node.props as { children?: React.ReactNode }).children;
    if (ch !== undefined) return codeChildrenToString(ch);
  }
  return "";
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

    // Models often emit only resume JSON without a component field.
    if (!typeCandidate) {
      if (parsed.resumeData && typeof parsed.resumeData === "object") {
        return { componentType: "cv" as const, props: parsed };
      }
      return null;
    }
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

interface ChatMessageRendererProps {
  content: string;
  className?: string;
  isStreaming?: boolean;
  cvContext?: CvComponentContext;
  /** @deprecated Prefer theme via `class` on document; kept for compatibility */
  dark?: boolean;
}

function StreamingStructuredPlaceholder() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-4 dark:bg-muted/20" role="status" aria-live="polite">
      <p className="text-sm font-medium text-muted-foreground">Building structured preview…</p>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[72%] rounded-md" />
        <Skeleton className="h-4 w-full rounded-md" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ChatMessageRenderer({
  content,
  className,
  isStreaming = false,
  cvContext,
  dark: _dark = false,
}: ChatMessageRendererProps) {
  const raw = content ?? "";
  const normalizedContent = normalizeComponentMarkdown(stripIncompleteJsonTail(raw, isStreaming));
  if (!normalizedContent.trim()) {
    if (isStreaming && raw.trim()) {
      return <StreamingStructuredPlaceholder />;
    }
    return null;
  }
  const parts = parseContentWithComponents(normalizedContent);
  const hasParsedComponent = parts.some((p) => p.type === "component");

  // Fallback parser for JSON envelope blocks, e.g.
  // ```json
  // {"component":"cv","props":{...}}
  // ```
  const envelopeComponents: Array<{ componentType: ComponentType; props: unknown; rawBlock: string }> = [];
  if (!hasParsedComponent) {
    // Allow ` ```json{` on the same line; optional language tag.
    const fencedRegex = /```(?:json|javascript|js|ts|typescript)?\s*\r?\n?([\s\S]*?)```/gi;
    let m: RegExpExecArray | null;
    while ((m = fencedRegex.exec(normalizedContent)) !== null) {
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
                "prose prose-sm max-w-none dark:prose-invert",
                "prose-p:text-foreground/90 prose-li:text-foreground/90",
                "prose-p:my-1.5 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2",
                "prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
              )}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="not-prose my-2 list-inside list-disc space-y-2 pl-0 text-foreground/90 marker:text-muted-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="not-prose my-2 list-inside list-decimal space-y-2 pl-0 text-foreground/90 marker:text-muted-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed [&>p]:mb-1 [&>p]:mt-0 [&>p]:last:mb-0">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  pre: ({ children }) => {
                    const arr = Children.toArray(children);
                    const codeEl = arr.find(
                      (c): c is React.ReactElement<{ className?: string; children?: React.ReactNode }> =>
                        isValidElement(c) && c.type === "code"
                    );
                    const cls = classNameToString(codeEl?.props?.className);
                    if (cls.includes("component:") || cls.includes("language-component")) {
                      const rawLang = cls.replace(/^language-/, "");
                      const typePart = rawLang.replace(/^component:/i, "").trim();
                      const normalized = normalizeComponentType(typePart);
                      const text = codeEl ? codeChildrenToString(codeEl.props.children) : "";
                      let parsedProps: unknown = {};
                      try {
                        parsedProps = JSON.parse((text || "").trim() || "{}");
                      } catch {
                        parsedProps = {};
                      }
                      if (normalized) {
                        const el = renderChatComponent(normalized, parsedProps, { cv: cvContext });
                        if (el) {
                          return (
                            <div className="my-4 w-full max-w-2xl rounded-2xl border border-border bg-card/90 p-3 shadow-sm dark:border-white/10 dark:bg-[#131317]/70 dark:shadow-[0_12px_40px_-26px_rgba(77,165,252,0.45)]">
                              {el}
                            </div>
                          );
                        }
                      }
                    }
                    return (
                      <pre
                        className={cn(
                          "not-prose rounded-lg border border-border p-3 my-2 overflow-x-auto text-sm bg-muted text-foreground dark:border-white/10 dark:bg-[#1a1a1e] dark:text-[#e0e0e5]"
                        )}
                      >
                        {children}
                      </pre>
                    );
                  },
                  code: ({ className, children, ...props }) => {
                    const cls = classNameToString(className);
                    const isBlock = cls.includes("language-");
                    if (isBlock) {
                      return (
                        <code className={cls || undefined} {...props}>
                          {children}
                        </code>
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

        if (part.type === "component") {
          const normalized = normalizeComponentType(String(part.componentType));
          if (!normalized) return null;
          const el = renderChatComponent(
            normalized,
            part.props,
            { cv: cvContext }
          );
          if (el) {
            return (
              <div
                key={i}
                className="my-4 w-full max-w-2xl rounded-2xl border border-border bg-card/90 p-3 shadow-sm dark:border-white/10 dark:bg-[#131317]/70 dark:shadow-[0_12px_40px_-26px_rgba(77,165,252,0.45)]"
              >
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
