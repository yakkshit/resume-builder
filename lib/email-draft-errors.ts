export function friendlyEmailDraftError(e: unknown): { message: string; status: number; code?: string } {
  const raw = e instanceof Error ? e.message : String(e);
  const lower = raw.toLowerCase();
  if (lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("429")) {
    return {
      message:
        "Google Gemini quota exceeded for this key. Wait a minute, try another model in chat settings, or check billing at ai.google.dev.",
      status: 429,
      code: "QUOTA_EXCEEDED",
    };
  }
  if (lower.includes("api key") || (lower.includes("invalid") && lower.includes("key"))) {
    return { message: "Invalid or missing Google API key.", status: 401, code: "BAD_KEY" };
  }
  return { message: raw.slice(0, 280) || "Email draft failed.", status: 500, code: "UNKNOWN" };
}
