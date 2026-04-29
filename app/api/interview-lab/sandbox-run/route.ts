import { NextRequest } from "next/server";

export const maxDuration = 120;
export const runtime = "nodejs";

type Body = {
  oidcToken?: string;
  language?: "typescript" | "python" | "javascript" | "js" | "ts";
  code?: string;
};

const TESTS = [
  { nums: [2, 7, 11, 15], target: 9 },
  { nums: [3, 2, 4], target: 6 },
  { nums: [3, 3], target: 6 },
] as const;

function isValidTwoSumAnswer(nums: readonly number[], target: number, out: unknown) {
  if (!Array.isArray(out) || out.length !== 2) return false;
  const [a, b] = out;
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a < 0 || b < 0 || a >= nums.length || b >= nums.length) return false;
  return nums[a] + nums[b] === target;
}

function transpileTypeScriptLite(source: string): string {
  return source
    .replace(/:\s*[A-Za-z_][A-Za-z0-9_<>\[\]\|\s,]*/g, "")
    .replace(/\binterface\s+[A-Za-z_][A-Za-z0-9_]*\s*\{[\s\S]*?\}\s*/g, "")
    .replace(/\btype\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*[\s\S]*?;\s*/g, "")
    .replace(/\bas\s+[A-Za-z_][A-Za-z0-9_<>\[\]\|]*/g, "");
}

function jsHarness(userJs: string): string {
  const tests = JSON.stringify(TESTS);
  return [
    `"use strict";`,
    userJs,
    `const TESTS = ${tests};`,
    `function isValid(nums,target,out){`,
    `  if(!Array.isArray(out)||out.length!==2) return false;`,
    `  const a=out[0], b=out[1];`,
    `  if(!Number.isInteger(a)||!Number.isInteger(b)) return false;`,
    `  if(a<0||b<0||a>=nums.length||b>=nums.length) return false;`,
    `  return nums[a]+nums[b]===target;`,
    `}`,
    `try {`,
    `  if (typeof twoSum !== "function") { console.log(JSON.stringify({passed:false,error:"Expected a function named twoSum."})); process.exit(0); }`,
    `  for (const t of TESTS) {`,
    `    const out = twoSum(t.nums.slice(), t.target);`,
    `    if (out == null) { console.log(JSON.stringify({passed:false,error:"twoSum returned null/undefined."})); process.exit(0); }`,
    `    if (!isValid(t.nums, t.target, out)) { console.log(JSON.stringify({passed:false,error:"Failed test for target="+t.target+", got: "+JSON.stringify(out)})); process.exit(0); }`,
    `  }`,
    `  console.log(JSON.stringify({passed:true}));`,
    `} catch (e) { console.log(JSON.stringify({passed:false,error:String(e && e.message || e)})); }`,
  ].join("\n");
}

function pyHarness(userPy: string): string {
  const tests = JSON.stringify(TESTS);
  return [
    userPy,
    ``,
    `import json`,
    `TESTS = json.loads(${JSON.stringify(tests)})`,
    `def is_valid(nums, target, out):`,
    `    if not isinstance(out, (list, tuple)) or len(out) != 2:`,
    `        return False`,
    `    a, b = out`,
    `    if not isinstance(a, int) or not isinstance(b, int):`,
    `        return False`,
    `    if a < 0 or b < 0 or a >= len(nums) or b >= len(nums):`,
    `        return False`,
    `    return nums[a] + nums[b] == target`,
    ``,
    `try:`,
    `    if "two_sum" not in globals() or not callable(globals()["two_sum"]):`,
    `        print(json.dumps({"passed": False, "error": "Expected a function named two_sum."}))`,
    `        raise SystemExit(0)`,
    `    for t in TESTS:`,
    `        out = two_sum(list(t["nums"]), int(t["target"]))`,
    `        if out is None:`,
    `            print(json.dumps({"passed": False, "error": "two_sum returned None."}))`,
    `            raise SystemExit(0)`,
    `        if not is_valid(t["nums"], int(t["target"]), out):`,
    `            print(json.dumps({"passed": False, "error": f"Failed test for target={t['target']}, got: {out}"}))`,
    `            raise SystemExit(0)`,
    `    print(json.dumps({"passed": True}))`,
    `except Exception as e:`,
    `    print(json.dumps({"passed": False, "error": str(e)}))`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const body = (await req.json().catch(() => null)) as Body | null;
  const code = body?.code || "";
  const lang = String(body?.language || "").toLowerCase();

  const token =
    String(body?.oidcToken || "").trim() ||
    process.env.VERCEL_OIDC_TOKEN?.trim() ||
    process.env.VERCEL_TOKEN?.trim() ||
    "";
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() || process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID?.trim() || "";
  const teamId = process.env.VERCEL_TEAM_ID?.trim() || "";

  if (!code.trim() || !lang) {
    return Response.json({ ok: false, error: "Missing language/code" }, { status: 400 });
  }

  if (!token) {
    return Response.json(
      { ok: false, error: "NO_OIDC_TOKEN", hint: "Configure Vercel Sandbox in the sidebar Integrations." },
      { status: 400 },
    );
  }

  if (!projectId || !teamId) {
    return Response.json(
      { ok: false, error: "MISSING_VERCEL_LINK", hint: "Run `vercel link` so VERCEL_PROJECT_ID/TEAM_ID are set." },
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
      runtime: "node24",
    });

    const runner =
      lang === "python"
        ? { filename: "main.py", content: pyHarness(code), cmd: "python3", args: ["main.py"] }
        : {
            filename: "main.js",
            content: jsHarness(lang === "typescript" || lang === "ts" ? transpileTypeScriptLite(code) : code),
            cmd: "node",
            args: ["main.js"],
          };

    await sandbox.writeFiles([{ path: `/${runner.filename}`, content: runner.content }]);
    const finished = await sandbox.runCommand({ cmd: runner.cmd, args: runner.args });
    const output = await finished.output("both").catch(() => "");
    await sandbox.stop({ blocking: true });

    let parsed: { passed?: boolean; error?: string } | null = null;
    try {
      const line = output.trim().split("\n").slice(-1)[0] || "";
      parsed = JSON.parse(line) as { passed?: boolean; error?: string };
    } catch {
      parsed = null;
    }

    const ms = Date.now() - start;
    return Response.json({
      ok: true,
      mode: "vercel-sandbox",
      ms,
      passed: Boolean(parsed?.passed),
      error: typeof parsed?.error === "string" ? parsed.error : undefined,
      output: output.trim(),
    });
  } catch (e) {
    console.error("interview-lab sandbox-run:", e);
    const ms = Date.now() - start;
    return Response.json(
      {
        ok: false,
        mode: "vercel-sandbox",
        ms,
        error: e instanceof Error ? e.message : "Sandbox execution failed",
      },
      { status: 502 },
    );
  }
}

