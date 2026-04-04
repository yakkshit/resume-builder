import { describe, expect, it } from "vitest";
import {
  CHAT_TEXTAREA_MAX_HEIGHT_PX,
  CHAT_TEXTAREA_MIN_HEIGHT_PX,
  chatTextareaHeightPx,
} from "@/lib/chat-textarea";

describe("chat-textarea", () => {
  it("resets to min when empty", () => {
    expect(chatTextareaHeightPx(400, "")).toBe(CHAT_TEXTAREA_MIN_HEIGHT_PX);
    expect(chatTextareaHeightPx(400, "   ")).toBe(CHAT_TEXTAREA_MIN_HEIGHT_PX);
  });

  it("clamps between min and max for non-empty", () => {
    expect(chatTextareaHeightPx(30, "x")).toBe(CHAT_TEXTAREA_MIN_HEIGHT_PX);
    expect(chatTextareaHeightPx(500, "hello")).toBe(CHAT_TEXTAREA_MAX_HEIGHT_PX);
    expect(chatTextareaHeightPx(80, "hello")).toBe(80);
  });
});
