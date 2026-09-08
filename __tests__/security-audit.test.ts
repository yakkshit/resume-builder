import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * SECURITY AUDIT TEST
 * 
 * This test scans the codebase for potential hardcoded API keys, secrets, and credentials.
 * It ignores .env files, node_modules, build artifacts, and lock files.
 */

const IGNORED_DIRS = [
    "node_modules",
    ".next",
    ".git",
    ".gemini",
    "dist",
    "build",
    "public"
];

const IGNORED_FILES = [
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    "pnpm-lock.yaml",
    "package-lock.json",
    "security-audit.test.ts", // Ignore itself
    "API_KEYS_SETUP.md",      // Documentation about keys
];

/** Benign strings that are not secrets (localStorage keys, feature flags, etc.) */
const FALSE_POSITIVE_VALUES = [
    "cookie-consent-accepted",
    "mcp-carrier-harness-token",
    "mcp-carrier-harness-id",
    "mcp-carrier-live-auth",
    "mcp-career-live-auth",
    "mcp_agent_harnesses_v1",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Methods",
    "Content-Security-Policy",
    "X-Frame-Options",
];

const SECRET_PATTERNS = [
    // Generic high-entropy strings assigned to key-like variables
    {
        name: "Generic Secret/Key",
        regex: /(?:key|secret|password|token|auth|credential|api)[_-\w]*\s*[=:]\s*['"`]([a-zA-Z0-9-_.]{16,})['"`]/gi
    },
    // Stripe API Keys
    {
        name: "Stripe API Key",
        regex: /(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24}/g
    },
    // AWS Access Key ID
    {
        name: "AWS Access Key ID",
        regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g
    },
    // Google API Key
    {
        name: "Google API Key",
        regex: /AIza[0-9A-Za-z-_]{35}/g
    },
    // GitHub Personal Access Token
    {
        name: "GitHub Token",
        regex: /gh[pous]_[a-zA-Z0-9]{36,255}/g
    },
    // Private Key
    {
        name: "Private Key",
        regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g
    }
];

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        const relativePath = path.relative(process.cwd(), fullPath);

        if (fs.statSync(fullPath).isDirectory()) {
            if (!IGNORED_DIRS.some(ignored => relativePath.includes(ignored))) {
                getAllFiles(fullPath, arrayOfFiles);
            }
        } else {
            if (!IGNORED_FILES.some(ignored => relativePath.endsWith(ignored))) {
                arrayOfFiles.push(fullPath);
            }
        }
    });

    return arrayOfFiles;
}

describe("Security Audit: Secret Leak Detection", () => {
    const allFiles = getAllFiles(process.cwd());

    it("should not find hardcoded secrets in the codebase", () => {
        const leaks: { file: string; line: number; type: string; snippet: string }[] = [];

        allFiles.forEach((file) => {
            const content = fs.readFileSync(file, "utf-8");
            const lines = content.split("\n");

            lines.forEach((line, index) => {
                // Skip comments
                if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*")) {
                    return;
                }

                SECRET_PATTERNS.forEach((pattern) => {
                    const matches = line.matchAll(pattern.regex);
                    for (const match of matches) {
                        // Exclude some common false positives (e.g., long class names in Tailwind or UI library)
                        if (line.includes("className") || line.includes("class=")) {
                            continue;
                        }
                        // Exclude benign constants (localStorage keys, feature flags, etc.)
                        const matchedValue = match[1] ?? match[0];
                        if (FALSE_POSITIVE_VALUES.some((safe) => String(matchedValue).includes(safe))) {
                            continue;
                        }

                        leaks.push({
                            file: path.relative(process.cwd(), file),
                            line: index + 1,
                            type: pattern.name,
                            snippet: line.trim()
                        });
                    }
                });
            });
        });

        if (leaks.length > 0) {
            const report = leaks
                .map(l => `❌ [${l.type}] in ${l.file}:${l.line}\n   Snippet: ${l.snippet}`)
                .join("\n\n");

            throw new Error(`Potential security leaks detected!\n\n${report}\n\nTotal leaks: ${leaks.length}`);
        }

        expect(leaks.length).toBe(0);
    });
});
