import { NextResponse } from "next/server";
import { VERIFIED_SKILLS_MD } from "@/lib/mcp/playbook-content";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "text/markdown; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return new NextResponse(VERIFIED_SKILLS_MD, {
    status: 200,
    headers: corsHeaders,
  });
}
