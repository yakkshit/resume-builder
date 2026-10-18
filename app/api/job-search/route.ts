import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const query = body?.query?.trim() || "Software Engineer";
  const location = body?.location?.trim() || "Remote";

  return Response.json({
    jobs: [
      {
        id: `job-mock-1`,
        title: `Senior ${query}`,
        company: "TechScale Innovations",
        location,
        salary: "$140,000 - $180,000",
        link: "https://www.linkedin.com/jobs",
        description: `Opportunity for ${query} with strong background in modern applications.`,
      },
    ],
    source: "static",
  });
}
