import { PDFParse } from "pdf-parse";

export type NormalizedAttachedFile = {
  name: string;
  content: string;
  contentType: string;
  pages?: number;
};

function rawBase64(data: string): string {
  if (!data) return "";
  const idx = data.indexOf("base64,");
  if (idx !== -1) return data.slice(idx + 7);
  return data;
}

function detectContentType(mime: string, name: string): string {
  const n = name.toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (n.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (n.endsWith(".json") || mime === "application/json") return "json";
  if (n.endsWith(".csv") || mime === "text/csv") return "csv";
  if (n.endsWith(".txt") || n.endsWith(".md") || mime === "text/plain") return "text";
  if (
    n.endsWith(".docx") ||
    mime.includes("wordprocessingml") ||
    mime === "application/msword"
  ) {
    return "document";
  }
  return "document";
}

/**
 * Turn client `AttachedFile` (base64) into text the career assistant can inject into the system prompt.
 * PDFs are parsed with pdf-parse (not UTF-8 decoded — that was the bug).
 */
export async function normalizeAttachedFile(f: {
  name: string;
  type: string;
  data: string;
  isImage?: boolean;
}): Promise<NormalizedAttachedFile> {
  const name = f.name || "attachment";
  const mime = f.type || "";
  const b64 = rawBase64(f.data);

  if (mime.startsWith("image/") || f.isImage) {
    return {
      name,
      content:
        "[User attached an image file. Use vision-capable models if available; otherwise ask them to paste key text.]",
      contentType: "image",
      pages: 0,
    };
  }

  if (name.toLowerCase().endsWith(".pdf") || mime === "application/pdf") {
    try {
      const buffer = Buffer.from(b64, "base64");
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      await parser.destroy();
      const text = result.text.trim();
      return {
        name,
        content:
          text ||
          "(No extractable text in this PDF — it may be scanned. Ask the user to paste text or use OCR.)",
        contentType: "pdf",
        pages: result.total,
      };
    } catch (e) {
      return {
        name,
        content: `Could not read PDF: ${e instanceof Error ? e.message : "unknown error"}`,
        contentType: "pdf-error",
        pages: 0,
      };
    }
  }

  if (
    name.toLowerCase().endsWith(".docx") ||
    mime.includes("wordprocessingml") ||
    mime === "application/msword"
  ) {
    try {
      const mammoth = (await import("mammoth")).default;
      const buffer = Buffer.from(b64, "base64");
      const { value } = await mammoth.extractRawText({ buffer });
      return {
        name,
        content: value || "(Empty document)",
        contentType: "document",
        pages: 0,
      };
    } catch (e) {
      return {
        name,
        content: `Could not read document: ${e instanceof Error ? e.message : "unknown error"}`,
        contentType: "document",
        pages: 0,
      };
    }
  }

  try {
    const text = Buffer.from(b64, "base64").toString("utf-8");
    return {
      name,
      content: text,
      contentType: detectContentType(mime, name),
      pages: 0,
    };
  } catch {
    return {
      name,
      content: b64,
      contentType: "document",
      pages: 0,
    };
  }
}
