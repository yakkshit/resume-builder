import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, headers: customHeaders, payload } = body;

    if (!url) {
      return NextResponse.json({ error: { message: "Missing target URL for MCP proxy" } }, { status: 400 });
    }

    // Construct headers for the external request
    const fetchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(customHeaders || {}),
    };

    // Forward the JSON-RPC payload to the external MCP server
    const response = await fetch(url, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errText = await response.text().catch(() => "");
      return NextResponse.json(
        { error: { message: `MCP server returned ${response.status}: ${errText}` } },
        { status: response.status }
      );
    }

    // Attempt to parse response as JSON
    const data = await response.json().catch(() => null);
    if (!data) {
      return NextResponse.json({ error: { message: "Invalid JSON response from MCP server" } }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("MCP Proxy error:", err);
    return NextResponse.json(
      { error: { message: err.message || "Failed to proxy request to MCP server" } },
      { status: 500 }
    );
  }
}
