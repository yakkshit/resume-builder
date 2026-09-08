import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * LOCKFILE SYNCHRONIZATION TEST
 * 
 * Verifies that pnpm-lock.yaml is always synchronized with package.json to prevent
 * ERR_PNPM_OUTDATED_LOCKFILE errors during Vercel CI/CD frozen-lockfile builds.
 */
describe("Lockfile & Vercel Build Synchronization", () => {
  const rootDir = process.cwd();
  const pkgPath = path.join(rootDir, "package.json");
  const lockPath = path.join(rootDir, "pnpm-lock.yaml");

  it("should have both package.json and pnpm-lock.yaml present", () => {
    expect(fs.existsSync(pkgPath), "package.json must exist").toBe(true);
    expect(fs.existsSync(lockPath), "pnpm-lock.yaml must exist").toBe(true);

    const lockStats = fs.statSync(lockPath);
    expect(lockStats.size).toBeGreaterThan(1000);
  });

  it("should define a valid packageManager in package.json for Vercel", () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    expect(pkg.packageManager).toBeDefined();
    expect(pkg.packageManager).toMatch(/^pnpm@\d+\.\d+\.\d+/);
  });

  it("should contain all dependencies from package.json inside pnpm-lock.yaml", () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    const lockContent = fs.readFileSync(lockPath, "utf-8");

    const missingDependencies: string[] = [];

    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    for (const [depName] of Object.entries(allDeps)) {
      // In pnpm-lock.yaml v9, dependencies are keyed in importers / snapshots / packages
      const depRegex = new RegExp(`['"]?${depName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}['"]?:`, "m");
      const isPresent = depRegex.test(lockContent) || lockContent.includes(`/${depName}@`) || lockContent.includes(`${depName}:`);

      if (!isPresent) {
        missingDependencies.push(depName);
      }
    }

    if (missingDependencies.length > 0) {
      throw new Error(
        `pnpm-lock.yaml is outdated! Missing specifiers for: ${missingDependencies.join(", ")}.\n` +
        `Fix this before pushing by running:\n  pnpm install --lockfile-only`
      );
    }

    expect(missingDependencies).toHaveLength(0);
  });

  it("should specifically contain neo4j-driver and critical dependencies in pnpm-lock.yaml", () => {
    const lockContent = fs.readFileSync(lockPath, "utf-8");
    expect(lockContent).toContain("neo4j-driver");
    expect(lockContent).toContain("drizzle-orm");
    expect(lockContent).toContain("@clerk/nextjs");
  });
});
