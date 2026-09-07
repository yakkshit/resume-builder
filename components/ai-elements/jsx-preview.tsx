"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ComponentProps,
  type ReactNode,
  type ComponentType,
} from "react";
import JsxParser, { type TProps as JsxParserProps } from "react-jsx-parser";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface JSXPreviewContextValue {
  jsx: string;
  isStreaming: boolean;
  components: Record<string, ComponentType<any>>;
  bindings: Record<string, unknown>;
  error: Error | null;
  setError: (error: Error | null) => void;
}

const JSXPreviewContext = createContext<JSXPreviewContextValue | null>(null);

export const useJSXPreview = () => {
  const context = useContext(JSXPreviewContext);
  if (!context) {
    throw new Error("JSXPreview subcomponents must be used within a JSXPreview");
  }
  return context;
};

/**
 * Autocomplete unclosed HTML/JSX tags during streaming to prevent syntax errors.
 */
function completeIncompleteJsx(jsx: string): string {
  if (!jsx || typeof jsx !== "string") return "";
  let clean = jsx.trim();

  // Strip code block fences if present
  if (clean.startsWith("```jsx") || clean.startsWith("```tsx") || clean.startsWith("```html")) {
    clean = clean.replace(/^```[a-zA-Z]*\n?/, "");
  }
  if (clean.endsWith("```")) {
    clean = clean.replace(/```$/, "");
  }

  // Find unclosed opening tags
  const tagRegex = /<\/?([a-zA-Z0-9_-]+)(?:\s+[^>]*?)?(\/?)>/g;
  const openTags: string[] = [];
  const selfClosing = new Set([
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
  ]);

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(clean)) !== null) {
    const [fullTag, tagName, isExplicitSelfClosing] = match;
    const isClosing = fullTag.startsWith("</");
    const lowerName = tagName.toLowerCase();

    if (isClosing) {
      const lastIndex = openTags.lastIndexOf(tagName);
      if (lastIndex !== -1) {
        openTags.splice(lastIndex, 1);
      }
    } else if (!isExplicitSelfClosing && !selfClosing.has(lowerName)) {
      openTags.push(tagName);
    }
  }

  // Append closing tags in reverse order
  let completed = clean;
  // If the string ends with an incomplete tag like `<Button`, close it cleanly
  if (/<[a-zA-Z0-9_-]+(?:\s+[^>]*)?$/.test(completed)) {
    const unclosedStart = completed.lastIndexOf("<");
    completed = completed.substring(0, unclosedStart);
  }

  for (let i = openTags.length - 1; i >= 0; i--) {
    completed += `</${openTags[i]}>`;
  }

  return completed;
}

export type JSXPreviewProps = Omit<ComponentProps<"div">, "onError"> & {
  jsx: string;
  isStreaming?: boolean;
  components?: Record<string, ComponentType<any>>;
  bindings?: Record<string, unknown>;
  onError?: (error: Error) => void;
};

export function JSXPreview({
  jsx,
  isStreaming = false,
  components = {},
  bindings = {},
  onError,
  className,
  children,
  ...props
}: JSXPreviewProps) {
  const [error, setError] = useState<Error | null>(null);

  const processedJsx = useMemo(() => {
    if (isStreaming) {
      return completeIncompleteJsx(jsx);
    }
    return jsx;
  }, [jsx, isStreaming]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const value = useMemo(
    () => ({
      jsx: processedJsx,
      isStreaming,
      components,
      bindings,
      error,
      setError,
    }),
    [processedJsx, isStreaming, components, bindings, error]
  );

  return (
    <JSXPreviewContext.Provider value={value}>
      <div
        className={cn(
          "w-full rounded-xl border border-white/10 bg-black/20 p-4 shadow-sm backdrop-blur-sm",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <JSXPreviewContent />
            <JSXPreviewError />
          </>
        )}
      </div>
    </JSXPreviewContext.Provider>
  );
}

export interface JSXPreviewContentProps extends ComponentProps<"div"> {
  renderError?: JsxParserProps["renderError"];
}

export function JSXPreviewContent({
  className,
  renderError,
  ...props
}: JSXPreviewContentProps) {
  const { jsx, components, bindings, setError } = useJSXPreview();

  return (
    <div className={cn("jsx-preview-content relative w-full", className)} {...props}>
      <JsxParser
        jsx={jsx}
        components={components as any}
        bindings={bindings}
        renderInWrapper={false}
        onError={(err: Error) => {
          setError(err);
        }}
        renderError={
          renderError ??
          (({ error }: { error: string }) => (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Failed to render UI: {error}</span>
            </div>
          ))
        }
      />
    </div>
  );
}

export type JSXPreviewErrorProps = Omit<ComponentProps<"div">, "children"> & {
  children?: ReactNode | ((error: Error) => ReactNode);
};

export function JSXPreviewError({
  className,
  children,
  ...props
}: JSXPreviewErrorProps) {
  const { error } = useJSXPreview();

  if (!error) return null;

  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200",
        className
      )}
      {...props}
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
      <div className="flex-1">
        {typeof children === "function"
          ? children(error)
          : children ?? <span>{error.message || "An error occurred during JSX rendering"}</span>}
      </div>
    </div>
  );
}
