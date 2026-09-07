import { NextRequest, NextResponse } from "next/server";
import { normalizeAttachedFile } from "@/lib/normalize-attached-file";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
      }

      const name = (file as any).name || "document.pdf";
      const mime = file.type || "application/pdf";
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      const normalized = await normalizeAttachedFile({
        name,
        type: mime,
        data: `data:${mime};base64,${base64}`,
      });

      return NextResponse.json({
        success: true,
        name: normalized.name,
        text: normalized.content,
        pages: normalized.pages ?? 0,
        contentType: normalized.contentType,
      });
    }

    if (contentType.includes("application/json")) {
      const body = await req.json();
      const { name = "document.pdf", type = "application/pdf", data } = body;

      if (!data) {
        return NextResponse.json({ success: false, error: "No file data provided" }, { status: 400 });
      }

      const normalized = await normalizeAttachedFile({
        name,
        type,
        data,
      });

      return NextResponse.json({
        success: true,
        name: normalized.name,
        text: normalized.content,
        pages: normalized.pages ?? 0,
        contentType: normalized.contentType,
      });
    }

    return NextResponse.json({ success: false, error: "Unsupported content type" }, { status: 400 });
  } catch (err) {
    console.error("Memory vault parse error:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to parse document" },
      { status: 500 }
    );
  }
}
