import type { NextRequest } from "next/server";
import { generateCoverLetterPDFBuffer } from "@/lib/cover-letter-pdf-generator";
import type { CoverLetterData, CoverLetterTemplate } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { coverLetterData: CoverLetterData; template: CoverLetterTemplate }
    | null;

  if (!body?.coverLetterData) {
    return Response.json({ error: "Missing coverLetterData" }, { status: 400 });
  }

  const template = (typeof body.template === "string" ? body.template : "standard") as CoverLetterTemplate;

  const buffer = await generateCoverLetterPDFBuffer(body.coverLetterData, template);

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Cover_Letter_${Date.now()}.pdf"`,
    },
  });
}

