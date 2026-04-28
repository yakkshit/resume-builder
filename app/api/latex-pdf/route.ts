import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

/** Public, no API key — see https://github.com/aslushnikov/latex-online (latexonline.cc). */
const LATEXONLINE_COMPILE = "https://latexonline.cc/compile";
/** URL length limits vary; encoded TeX expands a lot (e.g. `\` → `%5C`). */
const MAX_ENCODED_QUERY_CHARS = 7500;

/**
 * POST JSON `{ "latex": string }` → PDF via LaTeXOnline.cc `?text=` (open service).
 * Very large sources may exceed URL limits — use “Print → Save as PDF” in the UI instead.
 */
export async function POST(req: NextRequest) {
  let latex = "";
  try {
    const body = (await req.json()) as { latex?: unknown };
    latex = typeof body.latex === "string" ? body.latex : "";
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_JSON" }, { status: 400 });
  }

  if (!latex.trim()) {
    return NextResponse.json({ ok: false, code: "EMPTY_LATEX" }, { status: 400 });
  }

  const encoded = encodeURIComponent(latex);
  if (encoded.length > MAX_ENCODED_QUERY_CHARS) {
    console.warn("[latex-pdf] TeX too long for URL compile", { rawLen: latex.length, encodedLen: encoded.length });
    return NextResponse.json(
      {
        ok: false,
        code: "LATEX_TOO_LARGE",
        message:
          "This document is too large for the free URL-based compiler. Use Print → Save as PDF, or shorten the file and try again.",
        encodedLength: encoded.length,
        maxEncodedLength: MAX_ENCODED_QUERY_CHARS,
      },
      { status: 413 },
    );
  }

  const url = `${LATEXONLINE_COMPILE}?text=${encoded}`;

  try {
    const upstream = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "cv-main-latex-pdf/1",
        Accept: "application/pdf,*/*",
      },
    });

    const buf = new Uint8Array(await upstream.arrayBuffer());
    const ct = upstream.headers.get("content-type") || "";

    if (!upstream.ok) {
      const preview = new TextDecoder().decode(buf.slice(0, 800));
      console.error("[latex-pdf] latexonline error", upstream.status, preview);
      return NextResponse.json(
        { ok: false, code: "COMPILE_HTTP_ERROR", status: upstream.status, detail: preview },
        { status: 502 },
      );
    }

    if (ct.includes("application/pdf") || (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46)) {
      return new NextResponse(buf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="document.pdf"',
          "Cache-Control": "no-store",
        },
      });
    }

    const text = new TextDecoder().decode(buf);
    console.error("[latex-pdf] unexpected response", { status: upstream.status, contentType: ct, head: text.slice(0, 500) });
    return NextResponse.json(
      { ok: false, code: "NOT_PDF", detail: text.slice(0, 400) },
      { status: 502 },
    );
  } catch (e) {
    console.error("[latex-pdf] fetch error", e);
    return NextResponse.json({ ok: false, code: "FETCH_ERROR", message: String(e) }, { status: 500 });
  }
}
