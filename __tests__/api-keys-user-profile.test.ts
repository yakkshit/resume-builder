import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as chatPOST } from "@/app/api/chat/route";
import { POST as coverLetterPOST } from "@/app/api/cover-letter-chat/route";
import { POST as emailDraftPOST } from "@/app/api/email-draft/route";

describe("User Profile & Provider API Keys Integration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear Google API key environment variables or set dummy placeholders
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("fails with required key error when no key is provided in UI or env", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        model: "gemini-2.5-flash",
      }),
    });

    const res = await chatPOST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to generate response");
    expect(data.message).toContain("Google Gemini API key is required");
  });

  it("ignores dummy placeholder keys in env", async () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "placeholder";

    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        model: "gemini-2.5-flash",
      }),
    });

    const res = await chatPOST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.message).toContain("Google Gemini API key is required");
  });

  it("accepts google key from providerKeys sent by the client", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        model: "gemini-2.5-flash",
        providerKeys: {
          google: "AIzaSyFakeKeyFromUserProfile_12345",
        },
      }),
    });

    const res = await chatPOST(req);
    // Since AIzaSyFakeKeyFromUserProfile_12345 is an invalid key for Google servers, Google throws an auth/fetch error, NOT "Google Gemini API key is required"
    const data = await res.json();
    expect(data.message).not.toContain("Google Gemini API key is required");
  });

  it("accepts google key from chatGlobalProfile.apiKeys", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        model: "gemini-2.5-flash",
        chatGlobalProfile: {
          name: "Test User",
          apiKeys: {
            google: "AIzaSyFakeKeyFromGlobalProfile_12345",
          },
        },
      }),
    });

    const res = await chatPOST(req);
    const data = await res.json();
    expect(data.message).not.toContain("Google Gemini API key is required");
  });

  it("cover-letter-chat accepts google key from providerKeys", async () => {
    const req = new NextRequest("http://localhost:3000/api/cover-letter-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        model: "gemini-2.5-flash",
        coverLetterData: {},
        providerKeys: {
          google: "AIzaSyFakeKeyFromCoverLetter_12345",
        },
      }),
    });

    const res = await coverLetterPOST(req);
    const data = await res.json();
    expect(data.message).not.toContain("Google Gemini API key is required");
  });

  it("email-draft accepts google key from providerKeys", async () => {
    const req = new NextRequest("http://localhost:3000/api/email-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hrEmail: "recruiter@example.com",
        company: "Tech Corp",
        jobTitle: "Software Engineer",
        providerKeys: {
          google: "AIzaSyFakeKeyFromEmailDraft_12345",
        },
      }),
    });

    const res = await emailDraftPOST(req);
    // It shouldn't return 400 "Google API key required"
    expect(res.status).not.toBe(400);
    const data = await res.json();
    expect(data.error).not.toContain("Google API key required");
  });

  it("chat accepts mistral key from providerKeys without throwing missing key error", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        model: "mistral-large-latest",
        providerKeys: {
          mistral: "test_mistral_token_valid_length_12345",
        },
      }),
    });

    const res = await chatPOST(req);
    const data = await res.json();
    expect(data.message).not.toContain("Mistral API key is required");
  });
});
