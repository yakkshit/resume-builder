import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ canEmbed: false, reason: "No URL provided" });
  }

  try {
    const response = await fetch(targetUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });

    const xFrameOptions = response.headers.get("x-frame-options") || "";
    const csp = response.headers.get("content-security-policy") || "";

    // Check X-Frame-Options
    const xfoBlocked =
      xFrameOptions.toUpperCase() === "DENY" ||
      xFrameOptions.toUpperCase() === "SAMEORIGIN";

    // Check CSP frame-ancestors (e.g. "frame-ancestors 'none'" or "frame-ancestors 'self'")
    const cspBlocked =
      /frame-ancestors\s+'none'/i.test(csp) ||
      /frame-ancestors\s+'self'/i.test(csp);

    const canEmbed = !xfoBlocked && !cspBlocked;

    let reason = "";
    if (xfoBlocked) {
      reason = `X-Frame-Options: ${xFrameOptions.toUpperCase()}`;
    } else if (cspBlocked) {
      const match = csp.match(/frame-ancestors[^;]*/i);
      reason = match ? match[0] : "CSP frame-ancestors restriction";
    }

    return NextResponse.json(
      { canEmbed, reason },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=120",
        },
      }
    );
  } catch {
    // Network error / CORS preflight fail – assume it might work (optimistic)
    return NextResponse.json(
      { canEmbed: true, reason: "" },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
