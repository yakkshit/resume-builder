import type { NextRequest } from "next/server";

/**
 * Chat Assistant API - proxies to /api/chat with mode: "career-assistant".
 * Uses the main chat API's full model support with career-assistant system prompt.
 */
export const maxDuration = 60;

function toContentType(type: string, name: string): string {
  if (type.startsWith("image/")) return "image";
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".json")) return "json";
  if ([".txt", ".md", ".csv"].some((e) => name.endsWith(e))) return "text";
  return "document";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], model, apiKey, resumeData, id, contextText, attachedData } = body;

    const attachedFiles = Array.isArray(attachedData) ? attachedData.map((f: { name: string; type: string; data: string; isImage?: boolean }) => {
      let content = f.data;
      try {
        if (!f.isImage && typeof f.data === "string") {
          content = Buffer.from(f.data, "base64").toString("utf-8");
        }
      } catch {
        content = f.data;
      }
      return {
        name: f.name,
        content: typeof content === "string" ? content : String(content),
        contentType: toContentType(f.type || "", f.name),
      };
    }) : [];

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
