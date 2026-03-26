import { describe, it, expect } from "vitest";
import { normalizeAttachedFile } from "@/lib/normalize-attached-file";

describe("normalizeAttachedFile", () => {
  it("returns pdf-error for invalid PDF bytes", async () => {
    const result = await normalizeAttachedFile({
      name: "bad.pdf",
      type: "application/pdf",
      data: Buffer.from("not a pdf").toString("base64"),
    });
    expect(result.contentType).toBe("pdf-error");
    expect(result.content).toMatch(/Could not read PDF/i);
  });

  it("decodes plain text attachments as utf-8", async () => {
    const text = "Hello resume";
    const result = await normalizeAttachedFile({
      name: "note.txt",
      type: "text/plain",
      data: Buffer.from(text, "utf-8").toString("base64"),
    });
    expect(result.contentType).toBe("text");
    expect(result.content).toBe("Hello resume");
  });
});
