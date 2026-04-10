/**
 * Docs / reference URL for multi-provider model setup.
 * Prefer NEXT_PUBLIC_* so the link works in the browser; optional MULTI_MODEL_API_URL for server-only.
 */
export function getMultiModelDocsUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_MULTI_MODEL_DOCS_URL?.trim() ||
    process.env.NEXT_PUBLIC_MULTI_MODEL_API_URL?.trim() ||
    process.env.MULTI_MODEL_API_URL?.trim() ||
    "";
  return fromEnv || "https://ai-sdk.dev/docs/foundations/providers-and-models";
}
