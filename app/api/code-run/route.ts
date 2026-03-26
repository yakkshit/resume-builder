import { NextRequest } from "next/server";
import vm from "node:vm";

type CodeRunBody = {
  language: string;
  code: string;
};

type CodeRunResult = {
  passed: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  feedback?: {
    summary: string;
    strengths: string[];
    improvements: string[];
    suggestedNextStep: string;
  };
};

const TESTS = [
  { nums: [2, 7, 11, 15], target: 9, expected: [0, 1] },
  { nums: [3, 2, 4], target: 6, expected: [1, 2] },
  { nums: [3, 3], target: 6, expected: [0, 1] },
] as const;

function isValidTwoSumAnswer(nums: readonly number[], target: number, out: unknown) {
  if (!Array.isArray(out) || out.length !== 2) return false;
  const [a, b] = out;
  if (!Number.isInteger(a) || !Number.isInteger(b)) return false;
  if (a < 0 || b < 0 || a >= nums.length || b >= nums.length) return false;
  return nums[a] + nums[b] === target;
}

function runTwoSumLocallyJavaScript(source: string): CodeRunResult {
  // NOTE: This is a best-effort sandbox for JS-only fallback.
  // For untrusted code in production, prefer Judge0.
  const context: Record<string, unknown> = {};
  const sandbox = vm.createContext(context);

  try {
    vm.runInContext(source, sandbox, { timeout: 700 });

    const twoSum = (sandbox as any).twoSum;
    if (typeof twoSum !== "function") {
      return { passed: false, error: "Expected a function named `twoSum`." };
    }

    for (const t of TESTS) {
      const out = twoSum(t.nums.slice(), t.target);
      if (out == null) {
        return {
          passed: false,
          error:
            "Your `twoSum` function is not implemented yet. Return an array with two indices, e.g. [0, 1].",
        };
      }
      if (!isValidTwoSumAnswer(t.nums, t.target, out)) {
        return {
          passed: false,
          error: `Failed test for target=${t.target}. Expected indices whose values sum to ${t.target}, got: ${JSON.stringify(out)}`,
        };
      }
    }

    return { passed: true };
  } catch (e) {
    return { passed: false, error: e instanceof Error ? e.message : "Runtime error" };
  }
}

function transpileTypeScriptLite(source: string): string {
  return source
    // remove simple type annotations: : number, : string[], : Foo<Bar>
    .replace(/:\s*[A-Za-z_][A-Za-z0-9_<>\[\]\|\s,]*/g, "")
    // remove interface/type declarations quickly
    .replace(/\binterface\s+[A-Za-z_][A-Za-z0-9_]*\s*\{[\s\S]*?\}\s*/g, "")
    .replace(/\btype\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*[\s\S]*?;\s*/g, "")
    .replace(/\bas\s+[A-Za-z_][A-Za-z0-9_<>\[\]\|]*/g, "");
}

function buildNonRuntimeFeedback(language: string, code: string): CodeRunResult {
  const text = code || "";
  const hasFunction = /(function|def|fn|public\s+static|class|=>)/i.test(text);
  const hasHashMapIdea = /(map|hash|dict|object|unordered_map|hashtable)/i.test(text);
  const hasLoop = /(for|while|forEach)/i.test(text);
  const hasEdgeCases = /(if\s*\(|null|undefined|len\(|length)/i.test(text);
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (hasFunction) strengths.push("You provided a concrete function-based solution.");
  if (hasHashMapIdea) strengths.push("You appear to be using a hash map/dictionary approach (good for Two Sum).");
  if (hasLoop) strengths.push("Control flow is present and the logic is implementable.");
  if (!hasFunction) improvements.push("Define a function with clear inputs/outputs for the target problem.");
  if (!hasHashMapIdea) improvements.push("Consider an O(n) hash map approach instead of nested loops.");
  if (!hasEdgeCases) improvements.push("Add basic edge-case handling (empty list, invalid indices, duplicates).");

  return {
    passed: false,
    error: `Runtime sandbox not configured for ${language}. Returned structured interview feedback instead.`,
    feedback: {
      summary: `Static review completed for ${language}.`,
      strengths: strengths.length ? strengths : ["Solution intent is visible but incomplete."],
      improvements: improvements.length ? improvements : ["Add comments for complexity and trade-offs."],
      suggestedNextStep:
        "Refine your solution with explicit time/space complexity and submit again.",
    },
  };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as CodeRunBody | null;
  if (!body?.code || !body?.language) {
    return Response.json({ passed: false, error: "Missing language/code" }, { status: 400 });
  }

  const language = String(body.language).toLowerCase();

  // Local-first runtime for JS/TS (Runno-style local execution path).
  if (language === "javascript" || language === "js") {
    return Response.json(runTwoSumLocallyJavaScript(body.code));
  }

  if (language === "typescript" || language === "ts") {
    const js = transpileTypeScriptLite(body.code);
    return Response.json(runTwoSumLocallyJavaScript(js));
  }

  // Any other language: provide structured technical interview feedback.
  return Response.json(buildNonRuntimeFeedback(language, body.code));
}

// Note: Previous Judge0 integration removed in favor of local-first execution
// plus structured feedback for unsupported runtime languages.

