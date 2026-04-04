import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { friendlyEmailDraftError } from "@/lib/email-draft-errors";

export const maxDuration = 60;

// Align with main chat default so one API key / quota pool matches user expectations.
const DEFAULT_MODEL = "gemini-2.5-flash";

/**
 * Multistep tool loop (AI SDK): gather role context, then emit a structured HR email draft.
 * See https://ai-sdk.dev/cookbook/next/call-tools-multiple-steps
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      apiKey?: string;
      model?: string;
      hrEmail?: string;
      company?: string;
      jobTitle?: string;
      contextText?: string;
      resumeSummary?: string;
      userNote?: string;
    };

    const apiKey = body.apiKey?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Google API key required for email drafting (add in chat settings or set GOOGLE_GENERATIVE_AI_API_KEY)." },
        { status: 400 },
      );
    }

    const google = createGoogleGenerativeAI({ apiKey });
    const modelId = (body.model || DEFAULT_MODEL).trim() || DEFAULT_MODEL;

    const gatherContext = tool({
      description:
        "Step 1: Summarize the outreach goal, recipient, and 2–4 concise bullets on why the candidate is a fit (no PII beyond what the user provided).",
      inputSchema: z.object({
        goal: z.string(),
        recipient: z.string(),
        fitBullets: z.array(z.string()).min(1).max(6),
      }),
      execute: async (input) => input,
    });

    const buildHrEmail = tool({
      description:
        "Step 2: Final HR/recruiter email. Professional, concise, plain text. Include a clear subject line.",
      inputSchema: z.object({
        subject: z.string(),
        body: z.string(),
      }),
      execute: async (input) => input,
    });

    const hrEmail = (body.hrEmail || "").trim();
    const company = (body.company || "").trim();
    const jobTitle = (body.jobTitle || "").trim();
    const contextText = (body.contextText || "").trim().slice(0, 8000);
    const resumeSummary = (body.resumeSummary || "").trim().slice(0, 6000);
    const userNote = (body.userNote || "").trim().slice(0, 4000);

    const prompt = [
      "You are helping a job seeker write a short email to HR or a recruiter.",
      hrEmail ? `Recipient email (if known): ${hrEmail}` : "Recipient email: unknown — use a neutral greeting.",
      company ? `Company: ${company}` : "",
      jobTitle ? `Role / job title: ${jobTitle}` : "",
      userNote ? `User instructions: ${userNote}` : "",
      contextText ? `Extra context:\n${contextText}` : "",
      resumeSummary ? `Resume / profile summary (may be partial):\n${resumeSummary}` : "",
      "",
      "Workflow:",
      "1) Call gatherContext once with goal, recipient (name or 'Hiring team'), and fitBullets.",
      "2) Then call buildHrEmail with subject and body (plain text, no markdown).",
      "Keep the email under ~180 words unless the user asked otherwise.",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await generateText({
      model: google(modelId),
      tools: { gatherContext, buildHrEmail },
      stopWhen: stepCountIs(8),
      maxRetries: 0,
      prompt,
    });

    let subject = "";
    let bodyText = "";
    for (const step of result.steps) {
      for (const tr of step.toolResults) {
        if (tr.toolName !== "buildHrEmail") continue;
        const out = tr.output as { subject?: string; body?: string };
        if (out && typeof out === "object") {
          if (typeof out.subject === "string") subject = out.subject;
          if (typeof out.body === "string") bodyText = out.body;
        }
      }
    }

    if (!subject && !bodyText && result.text) {
      bodyText = result.text;
    }

    if (!subject.trim() && !bodyText.trim()) {
      return Response.json({ error: "Model did not return an email draft. Try again or shorten context." }, { status: 422 });
    }

    return Response.json({ subject: subject.trim(), body: bodyText.trim() });
  } catch (e) {
    console.error("[email-draft]", e);
    const { message, status, code } = friendlyEmailDraftError(e);
    return Response.json({ error: message, code }, { status });
  }
}
