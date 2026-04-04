/** LinkedIn connection / job DM notes are capped (Easy Apply / recruiter inbox). */
export const LINKEDIN_DM_MAX_CHARS = 200;

export function clampLinkedInDm(text: string, max = LINKEDIN_DM_MAX_CHARS): string {
  const t = (text ?? "").replace(/\r\n/g, "\n").trim();
  if (t.length <= max) return t;
  return t.slice(0, max).trimEnd();
}

export function linkedInDmCharCount(text: string): number {
  return (text ?? "").length;
}
