import { describe, it, expect, vi } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

// Mocking some parts if needed, but the requirement is to actually execute the check
// We will use child_process to run pnpm outdated

interface OutdatedPackage {
    current: string;
    latest: string;
    wanted: string;
    isDeprecated: boolean;
    dependencyType: string;
}

interface OutdatedOutput {
    [packageName: string]: OutdatedPackage;
}

describe("Package Status Audit", () => {
    it("executes package status audit and verifies dependencies", () => {
        console.log("\n" + "=".repeat(70));
        console.log("Package Status Audit Test");
        console.log("=".repeat(70) + "\n");

        const rootDir = process.cwd();
        const packageJsonPath = path.join(rootDir, "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };

        let outdatedData: OutdatedOutput = {};
        try {
            // pnpm outdated exits with code 1 if there are outdated packages
            const output = execSync("pnpm outdated --json", { encoding: "utf-8", stdio: "pipe" });
            outdatedData = JSON.parse(output);
        } catch (error: any) {
            if (error.stdout) {
                try {
                    outdatedData = JSON.parse(error.stdout.toString());
                } catch (e) {
                    console.error("Failed to parse pnpm outdated output");
                }
            }
        }

        const results: any[] = [];
        let hasDeprecated = false;

        Object.keys(allDeps).forEach((pkgName) => {
            const currentVersion = allDeps[pkgName].replace(/^[\^~]/, "");
            const outdatedInfo = outdatedData[pkgName];

            let status = "🟢 Up-to-date";
            let latestVersion = currentVersion;
            let statusKey = "up-to-date";

            if (outdatedInfo) {
                latestVersion = outdatedInfo.latest;
                if (outdatedInfo.isDeprecated) {
                    status = "⛔ Deprecated";
                    statusKey = "deprecated";
                    hasDeprecated = true;
                } else {
                    const currentParts = currentVersion.split(".").map(Number);
                    const latestParts = latestVersion.split(".").map(Number);

                    if (latestParts[0] > currentParts[0]) {
                        status = "⚠️ Major Update";
                        statusKey = "major-update";
                    } else if (latestParts[1] > currentParts[1] || latestParts[2] > currentParts[2]) {
                        status = "🍊 Minor Update";
                        statusKey = "minor-update";
                    }
                }
            }

            results.push({
                Package: pkgName,
                Status: status,
                "Current Version": currentVersion,
                Suggestion: latestVersion,
                statusKey
            });
        });

        // Generate Table for Logs
        console.table(results.map(({ statusKey, ...rest }) => rest));

        // UI Assertion Requirement
        // Verify that the UI component is correctly structured
        const componentPath = path.join(rootDir, "components", "package-manager-ui.tsx");
        expect(fs.existsSync(componentPath)).toBe(true);

        const componentContent = fs.readFileSync(componentPath, "utf-8");
        expect(componentContent).toContain("export const PackageManagerUI");
        expect(componentContent).toContain("<Table");

        console.log("\n" + "=".repeat(70));
        if (!hasDeprecated) {
            console.log("✅ - Successfull");
        } else {
            console.log("❌ - Failed (Deprecated packages found)");
        }
        console.log("=".repeat(70) + "\n");

        // Fail if any package is deprecated
        if (hasDeprecated) {
            const issuesDir = path.join(rootDir, "issues");
            if (!fs.existsSync(issuesDir)) {
                fs.mkdirSync(issuesDir, { recursive: true });
            }

            const issuesPath = path.join(issuesDir, "issues.md");
            const deprecatedPackages = results
                .filter(r => r.statusKey === "deprecated")
                .map(r => `- **${r.Package}**: Deprecated (Current: ${r["Current Version"]}, Latest: ${r.Suggestion})`)
                .join("\n");

            const issuesContent = `# Package Manager Issues Report\n\nGenerated on: ${new Date().toISOString()}\n\n## Deprecated Packages\n${deprecatedPackages}\n\n## UI Errors\n- None detected (Verification passed)\n`;
            fs.writeFileSync(issuesPath, issuesContent);
        }

        // Generate Summary Report for Git Commits
        const summaryDir = path.join(rootDir, "summary");
        if (!fs.existsSync(summaryDir)) {
            fs.mkdirSync(summaryDir, { recursive: true });
        }

        const reportPath = path.join(summaryDir, "report.md");
        const minorCount = results.filter(r => r.statusKey === "minor").length;
        const majorCount = results.filter(r => r.statusKey === "major").length;
        const upToDateCount = results.filter(r => r.statusKey === "uptodate").length;
        const depCount = results.filter(r => r.statusKey === "deprecated").length;

        const reportContent = `Dependency Audit: ${upToDateCount} up-to-date, ${minorCount} minor updates, ${majorCount} major updates, ${depCount} deprecated.\n\nAudit conducted on ${new Date().toISOString()}.\n- Total Packages: ${results.length}\n- Deprecated: ${depCount}\n- Major Updates: ${majorCount}\n- Minor Updates: ${minorCount}\n- Up-to-date: ${upToDateCount}\n`;
        fs.writeFileSync(reportPath, reportContent);

        expect(hasDeprecated, "The test must fail immediately if any package is flagged as Deprecated (⛔)").toBe(false);
    });
});
