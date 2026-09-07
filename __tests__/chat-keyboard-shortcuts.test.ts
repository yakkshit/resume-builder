import { describe, it, expect, vi } from "vitest";

describe("Chat Composer Keyboard Dispatch Logic", () => {
  it("triggers submission on Cmd+Enter (Mac) and Ctrl+Enter (Win/Linux)", () => {
    const handleSubmit = vi.fn();
    const handleEvent = (event: { key: string; metaKey: boolean; ctrlKey: boolean; preventDefault: () => void; value: string; isLoading: boolean }) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        if (!event.isLoading && event.value.trim()) {
          handleSubmit();
        }
      }
    };

    const preventDefaultMock = vi.fn();

    // 1. Plain Enter -> should NOT submit
    handleEvent({
      key: "Enter",
      metaKey: false,
      ctrlKey: false,
      preventDefault: preventDefaultMock,
      value: "Hello assistant",
      isLoading: false,
    });
    expect(handleSubmit).not.toHaveBeenCalled();

    // 2. Cmd + Enter (Mac) -> Should submit
    handleEvent({
      key: "Enter",
      metaKey: true,
      ctrlKey: false,
      preventDefault: preventDefaultMock,
      value: "Generate tailored resume",
      isLoading: false,
    });
    expect(handleSubmit).toHaveBeenCalledTimes(1);

    // 3. Ctrl + Enter (Win/Linux) -> Should submit
    handleEvent({
      key: "Enter",
      metaKey: false,
      ctrlKey: true,
      preventDefault: preventDefaultMock,
      value: "Review my cover letter",
      isLoading: false,
    });
    expect(handleSubmit).toHaveBeenCalledTimes(2);

    // 4. Cmd + Enter when loading -> should NOT trigger duplicate submission
    handleEvent({
      key: "Enter",
      metaKey: true,
      ctrlKey: false,
      preventDefault: preventDefaultMock,
      value: "Another prompt",
      isLoading: true,
    });
    expect(handleSubmit).toHaveBeenCalledTimes(2);
  });
});
