export const maxDuration = 120;
export const runtime = "nodejs";

type Body = { oidcToken?: string };

export async function POST(req: Request) {
  let body: Body = {};
  try {
    body = (await req.json()) as Body;
  } catch {
    /* ignore */
  }

  const token =
    String(body.oidcToken || "").trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    process.env.VERCEL_TOKEN?.trim() ||
    "";
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID?.trim() || "";
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || "";

  if (!token) {
    return Response.json(
      {
        ok: false,
        hint: "Paste a Vercel OIDC token or PAT from Integrations, or run `vercel env pull` so VERCEL_OIDC_TOKEN is set.",
      },
      { status: 400 },
    );
  }

  if (!projectId || !teamId) {
    return Response.json(
      {
        ok: false,
        hint: "Run `vercel link` in this project so VERCEL_PROJECT_ID and VERCEL_TEAM_ID are available to the server.",
      },
      { status: 400 },
    );
  }

  try {
    const { Sandbox } = await import("@vercel/sandbox");
    const sandbox = await Sandbox.create({
      token,
      projectId,
      teamId,
      timeout: 120_000,
      resources: { vcpus: 1 },
    });
    const finished = await sandbox.runCommand({ cmd: "echo", args: ["sandbox-ok"] });
    await sandbox.stop({ blocking: true });
    return Response.json({
      ok: true,
      exitCode: finished.exitCode,
    });
  } catch (e) {
    console.error("interview-lab sandbox:", e);
    return Response.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Sandbox failed",
        hint: "See https://vercel.com/docs/vercel-sandbox — ensure the token is valid and the project is linked.",
      },
      { status: 502 },
    );
  }
}
