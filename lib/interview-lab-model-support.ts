/** Interview Lab streams via @ai-sdk/google (Gemini) and reuses the chat Google API key. */
export function isInterviewLabCompatibleModel(modelId: string): boolean {
  const id = modelId.trim();
  if (!id) return false;
  return /gemini/i.test(id);
}

export function getDefaultInterviewLabModelId(): string {
  // Keep stable + widely available; matches existing ChatSettings default.
  return "gemini-2.5-flash";
}
