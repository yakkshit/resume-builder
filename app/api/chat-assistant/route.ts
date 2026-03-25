import type { NextRequest } from "next/server";
import { normalizeAttachedFile } from "@/lib/normalize-attached-file";

/**
 * Chat Assistant API - proxies to /api/chat with mode: "career-assistant".
 * Uses the main chat API's full model support with career-assistant system prompt.
 */
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], model, apiKey, resumeData, id, contextText, attachedData } = body;

    const attachedFiles: Array<{
      name: string;
      content: string;
      contentType: string;
      pages?: number;
    }> = [];

    if (Array.isArray(attachedData)) {
      for (const f of attachedData) {
        if (!f || typeof f !== "object") continue;
        const file = f as { name: string; type: string; data: string; isImage?: boolean };
        const normalized = await normalizeAttachedFile(file);
        attachedFiles.push(normalized);
      }
    }

    const baseUrl = req.nextUrl.origin;
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model,
        apiKey,
        resumeData: resumeData || {},
        aiMode: true,
        mode: "career-assistant",
        id,
        contextText: contextText || "",
        attachedFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ error: errText || "Chat request failed" }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    return res;
  } catch (e) {
    console.error("Chat assistant error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Internal error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
