import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type ModelMessage } from "ai";
import { isInterviewLabCompatibleModel } from "@/lib/interview-lab-model-support";
import { getMultiModelDocsUrl } from "@/lib/multi-model-docs";

export const maxDuration = 120;

const DEFAULT_MODEL = "gemini-2.5-flash";

const SYSTEM_BY_MODE: Record<string, string> = {
  conversation: `You are a professional technical interviewer. Conduct a realistic multi-round interview: ask one focused question at a time, wait for the candidate's answer (the user), then give brief constructive feedback and ask the next question. Keep tone supportive and specific. Avoid markdown code fences unless showing a tiny snippet.`,
  live: `You are a senior engineer observing a mock "live" interview session. You receive:
- A running transcript (may include speech-to-text from the user)
- Optional notes about what is on the user's shared screen (they may describe it in text)

Give concise coaching: what to improve next, one concrete action, and optionally what to say aloud. Do not invent screen content that wasn't described.`,
};

function toModelMessages(raw: unknown): ModelMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ModelMessage[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if (role !== "user" && role !== "assistant") continue;
    const text = typeof content === "string" ? content.trim() : "";
    if (!text) continue;
    out.push({ role, content: text });
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      apiKey?: string;
      model?: string;
      mode?: string;
      messages?: unknown;
      systemExtra?: string;
    };

    const apiKey = body.apiKey?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return Response.json(
        {
          error:
            "Add your Google (Gemini) API key in chat settings, or set GOOGLE_GENERATIVE_AI_API_KEY for Interview Lab.",
        },
        { status: 400 },
      );
    }

    const modelId = (body.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL;
    if (!isInterviewLabCompatibleModel(modelId)) {
      return Response.json(
        {
          error: "INCOMPATIBLE_MODEL",
          message:
            "Interview Lab uses Google Gemini only. Switch your chat model to a Gemini option (sidebar → Profile, or Integrations).",
          docsUrl: getMultiModelDocsUrl(),
        },
        { status: 422 },
      );
    }

    const mode = typeof body.mode === "string" ? body.mode : "conversation";
    const baseSystem = SYSTEM_BY_MODE[mode] ?? SYSTEM_BY_MODE.conversation;
    const system = [baseSystem, body.systemExtra?.trim()].filter(Boolean).join("\n\n");

    const messages = toModelMessages(body.messages);
    if (messages.length === 0) {
      return Response.json({ error: "Send at least one user message." }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    const result = streamText({
      model: google(modelId),
      system,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (e) {
    console.error("interview-lab:", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Interview Lab request failed" },
      { status: 500 },
    );
  }
}
