import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CareerAgent — Autonomous Career OS & AI Resume Builder";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#000000",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(255, 255, 255, 0.05) 2%, transparent 0%)",
          backgroundSize: "40px 40px",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              backgroundColor: "#aff33e",
            }}
          />
          <span
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-0.03em",
            }}
          >
            CareerAgent
          </span>
          <span
            style={{
              fontSize: "14px",
              color: "#a1a1aa",
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              fontFamily: "monospace",
            }}
          >
            v2.0
          </span>
        </div>

        {/* Center Headline & Subtitle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "960px",
          }}
        >
          <div
            style={{
              fontSize: "62px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1.08,
            }}
          >
            Autonomous Career OS &amp; ATS Resume Builder
          </div>
          <div
            style={{
              fontSize: "24px",
              color: "#a1a1aa",
              lineHeight: 1.4,
            }}
          >
            Land tech roles 10x faster. ATS-engineered resumes, personal Dynamic MCP Server, and grounded AI interview coaching.
          </div>
        </div>

        {/* Footer Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            paddingTop: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: "16px",
              color: "#71717a",
            }}
          >
            <span>• 100 Free Daily MCP Requests</span>
            <span>• Zero-Knowledge AES-256</span>
            <span>• Vector PDF &amp; LaTeX</span>
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            resume.cedzlabs.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

