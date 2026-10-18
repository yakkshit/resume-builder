/** Max height for the career chat composer (px), capping at the expanded squircle height before scrolling. */
export const CHAT_TEXTAREA_MAX_HEIGHT_PX = 88;

/** Single-line content height for compact composer mode (px). */
export const CHAT_TEXTAREA_MIN_HEIGHT_PX = 26;

/**
 * Height to apply after measuring scrollHeight. When input is empty, reset to min line height.
 */
export function chatTextareaHeightPx(scrollHeight: number, value: string): number {
  if (!(value ?? "").trim()) return CHAT_TEXTAREA_MIN_HEIGHT_PX;
  const h = Math.max(scrollHeight, CHAT_TEXTAREA_MIN_HEIGHT_PX);
  return Math.min(h, CHAT_TEXTAREA_MAX_HEIGHT_PX);
}
