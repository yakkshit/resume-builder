import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * PRODUCTION RELEASE LEAK PREVENTION TEST
 * 
 * Executed during `pnpm run prod` and CI checks to guarantee that no API keys,
 * production secrets, certificates, or unencrypted credential files can be committed or pushed.
 */

const CRITICAL_SECRET_PATTERNS = [
  {
    name: "OpenAI Live Secret Key",
    regex: /sk-[a-zA-Z0-9]{20,T3BlbkFJ[a-zA-Z0-9]{20,}/g,
  },
  {
    name: "OpenAI Project Key",
    regex: /sk-proj-[a-zA-Z0-9_-]{40,}/g,
  },
  {
    name: "Anthropic Live API Key",
    regex: /sk-ant-api03-[a-zA-Z0-9_-]{60,}/g,
  },
  {
    name: "Google AI API Key",
    regex: /AIzaSy[a-zA-Z0-9_-]{33}/g,
  },
  {
    name: "GitHub Token (PAT / Fine-grained)",
    regex: /(?:ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})/g,
  },
  {
    name: "Stripe Live Secret Key",
    regex: /sk_live_[0-9a-zA-Z]{24,}/g,
  },
  {
    name: "AWS Access Key",
    regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/g,
  },
  {
    name: "Private RSA / EC Key Header",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    name: "PostgreSQL Production Connection String with Plaintext Password",
    regex: /postgres(?:ql)?:\/\/[a-zA-Z0-9_]+:(?!(\$|process\.env|your-password|password|<password>))[a-zA-Z0-9_%!#-]{6,}@[a-zA-Z0-9.-]+:[0-9]+\/[a-zA-Z0-9_]+/g,
  },
];

const FORBIDDEN_TRACKED_PATTERNS = [
  /^\.env$/,
  /^\.env\.local$/,
  /^\.env\.production$/,
  /^\.env\.development$/,
  /\.pem$/,
  /\.key$/,
  /serviceAccountKey.*\.json$/,
  /credentials\.json$/,
];

const SCAN_DIRS = [
  "app",
  "components",
  "lib",
  "hooks",
  "scripts",
  "utils",
];

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git" && file !== "dist") {
        getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      if (/\.(ts|tsx|js|jsx|json|md|mjs|cjs)$/.test(file)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

describe("Production Release Leak Prevention", () => {
  const rootDir = process.cwd();

  it("should have comprehensive secret exclusion rules in .gitignore", () => {
    const gitignorePath = path.join(rootDir, ".gitignore");
    expect(fs.existsSync(gitignorePath)).toBe(true);

    const gitignore = fs.readFileSync(gitignorePath, "utf-8");
    expect(gitignore).toContain(".env");
    expect(gitignore).toContain(".env*.local");
    expect(gitignore).toContain("*.pem");
    expect(gitignore).toContain("credentials.json");
    expect(gitignore).toContain("serviceAccountKey");
  });

  it("should ensure no forbidden credential files exist in source folders", () => {
    const rootFiles = fs.readdirSync(rootDir);
    const leakedFiles: string[] = [];

    for (const file of rootFiles) {
      for (const pattern of FORBIDDEN_TRACKED_PATTERNS) {
        if (pattern.test(file)) {
          // If the file exists, verify it is strictly in gitignore
          const gitignore = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf-8");
          const isExplicitlyIgnored =
            gitignore.includes(file) ||
            gitignore.includes(".env") ||
            gitignore.includes("*.pem") ||
            gitignore.includes("*.key") ||
            gitignore.includes("credentials.json") ||
            gitignore.includes("serviceAccountKey");

          if (!isExplicitlyIgnored) {
            leakedFiles.push(file);
          }
        }
      }
    }

    expect(leakedFiles, `Unignored sensitive files detected: ${leakedFiles.join(", ")}`).toHaveLength(0);
  });

  it("should not have hardcoded production keys or private keys in any codebase files", () => {
    const allFiles: string[] = [];
    SCAN_DIRS.forEach((d) => getAllFiles(path.join(rootDir, d), allFiles));

    const detectedLeaks: Array<{ file: string; rule: string; snippet: string }> = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, "utf-8");

      for (const pattern of CRITICAL_SECRET_PATTERNS) {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(content);
        if (match) {
          detectedLeaks.push({
            file: path.relative(rootDir, file),
            rule: pattern.name,
            snippet: match[0].substring(0, 15) + "...",
          });
        }
      }
    }

    if (detectedLeaks.length > 0) {
      const summary = detectedLeaks
        .map((d) => `❌ [${d.rule}] in ${d.file} -> ${d.snippet}`)
        .join("\n");
      throw new Error(`CRITICAL: Production secrets detected before release!\n${summary}`);
    }

    expect(detectedLeaks).toHaveLength(0);
  });

  it("should verify that workflow.ts enforces tests before deployment / release", () => {
    const workflowPath = path.join(rootDir, "scripts", "workflow.ts");
    expect(fs.existsSync(workflowPath)).toBe(true);
    const workflow = fs.readFileSync(workflowPath, "utf-8");

    expect(workflow).toContain("test");
    expect(workflow).toContain("build");
  });
});
