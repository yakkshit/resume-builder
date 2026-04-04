import { describe, expect, it } from "vitest";
import { friendlyEmailDraftError } from "@/lib/email-draft-errors";

describe("friendlyEmailDraftError", () => {
  it("maps quota errors to 429", () => {
    const r = friendlyEmailDraftError(new Error("RESOURCE_EXHAUSTED quota exceeded 429"));
    expect(r.status).toBe(429);
    expect(r.code).toBe("QUOTA_EXCEEDED");
    expect(r.message).toMatch(/quota/i);
  });

  it("maps bad key", () => {
    const r = friendlyEmailDraftError(new Error("invalid api key"));
    expect(r.status).toBe(401);
    expect(r.code).toBe("BAD_KEY");
  });

  it("defaults unknown", () => {
    const r = friendlyEmailDraftError(new Error("something else"));
    expect(r.status).toBe(500);
    expect(r.code).toBe("UNKNOWN");
  });
});
