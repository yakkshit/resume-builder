import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function getPackageManager(): 'npm' | 'yarn' | 'pnpm' | 'bun' {
    const userAgent = process.env.npm_config_user_agent;
    if (userAgent) {
        if (userAgent.startsWith('yarn')) return 'yarn';
        if (userAgent.startsWith('pnpm')) return 'pnpm';
        if (userAgent.startsWith('bun')) return 'bun';
        if (userAgent.startsWith('npm')) return 'npm';
    }
    // Fallback checks
    if (fs.existsSync('yarn.lock')) return 'yarn';
    if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
    if (fs.existsSync('bun.lockb')) return 'bun';
    return 'npm';
}

function getRunCommand(): string {
    const pm = getPackageManager();
    if (pm === 'npm') return 'npm run';
    if (pm === 'yarn') return 'yarn';
    if (pm === 'pnpm') return 'pnpm';
    if (pm === 'bun') return 'bun run';
    return 'npm run';
}

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            if (answer.toLowerCase() === 'q') {
                console.log("\n👋 Exiting workflow. See you later!");
                process.exit(0);
            }
            resolve(answer);
        });
    });
};

async function runCommand(command: string, name: string): Promise<boolean> {
    console.log(`\n--- Running ${name} ---`);
    try {
        execSync(command, { stdio: "inherit" });
        return true;
    } catch (error) {
        console.error(`\n❌ ${name} failed.`);
        return false;
    }
}

function getNextVersion(current: string, type: 'major' | 'minor' | 'patch'): string {
    const parts = current.split(".").map(Number);
    if (type === 'major') parts[0]++;
    if (type === 'minor') parts[1]++;
    if (type === 'patch') parts[2]++;

    if (type === 'major') { parts[1] = 0; parts[2] = 0; }
    if (type === 'minor') { parts[2] = 0; }

    return parts.join(".");
}

async function startWorkflow() {
    console.log("\n" + "=".repeat(70));
    console.log("🚀 STARTING AUTOMATED RELEASE WORKFLOW");
    console.log("Tip: At any prompt, type 'q' to quit.");
    console.log("=".repeat(70));

    const runCmd = getRunCommand();

    // 1. Run Tests (Generates audit part of summary/report.md)
    const testsPassed = await runCommand(`${runCmd} test`, "Package Status Audit & UI Tests");
    if (!testsPassed) {
        console.log("\n⚠️ Tests failed. Check /issues/issues.md for details.");
        process.exit(1);
    }

    // 2. Drizzle Database Schema Sync & Generation
    console.log("\n--- Syncing Drizzle Database Schema ---");
    const dbPassed = await runCommand(`${runCmd} db:push`, "Drizzle Database Schema Sync (db:push)");
    if (!dbPassed) {
        console.log("\n⚠️ Drizzle Database sync encountered a warning or DATABASE_URL not reachable. Continuing build...");
    }

    // 3. Build
    const buildPassed = await runCommand(`${runCmd} build`, "Production Build");
    if (!buildPassed) {
        console.log("\n⚠️ Build failed. Stopping workflow.");
        process.exit(1);
    }

    // 3. Interactive Git Flow
    console.log("\n" + "=".repeat(70));
    console.log("📊 INTERACTIVE RELEASE CONFIGURATION");
    console.log("=".repeat(70));

    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf-8"));
    const currentVersion = packageJson.version;
    console.log(`Current Project Version: ${currentVersion}`);

    console.log("\nSelect release type:");
    console.log(" (v) Version Release  -> Increments minor (e.g., 2.0.0 → 2.1.0)");
    console.log(" (b) Bug Fix          -> Prefixes 'b' & increments patch (e.g., 2.0.0 → b2.0.1)");
    console.log(" (f) Feature Update   -> Prefixes 'f' & increments minor (e.g., 2.0.0 → f2.1.0)");
    console.log(" (o) Other            -> Custom branch and message");

    const typeSelection = await question("\nChoice (v/b/f/o/q): ");
    const typeChoice = typeSelection.toLowerCase();

    let branchName = "";
    let commitMessageSubject = "";
    let updateTypeName = "";
    let newVersion = currentVersion;

    switch (typeChoice) {
        case 'v':
            newVersion = getNextVersion(currentVersion, 'minor');
            branchName = `v${newVersion}`;
            commitMessageSubject = `release: version ${newVersion}`;
            updateTypeName = "Version Update";
            break;
        case 'b':
            newVersion = getNextVersion(currentVersion, 'patch');
            branchName = `b${newVersion}`;
            commitMessageSubject = `fix: bugfix update to ${newVersion}`;
            updateTypeName = "Bug Fix";
            break;
        case 'f':
            newVersion = getNextVersion(currentVersion, 'minor');
            branchName = `f${newVersion}`;
            commitMessageSubject = `feat: new feature update ${newVersion}`;
            updateTypeName = "Feature Update";
            break;
        case 'o':
            branchName = await question("Enter custom branch name: ");
            commitMessageSubject = await question("Enter custom commit message: ");
            updateTypeName = "Custom Update";
            break;
        default:
            console.log("Invalid selection. Cancelling.");
            process.exit(1);
    }

    // Duplicate branch check
    try {
        const existingBranches = execSync("git branch --list", { encoding: "utf-8" });
        if (existingBranches.includes(branchName)) {
            console.log(`\n⚠️ Branch '${branchName}' already exists.`);
            branchName = await question("Enter a unique branch name (or 'q' to quit): ");
        }
    } catch (e) {
        // Git not initialized or other error
    }

    console.log(`\n` + "-".repeat(40));
    console.log(`🚀 READY TO PUSH:`);
    console.log(`- Branch: ${branchName}`);
    console.log(`- Commit Subject: ${commitMessageSubject}`);
    if (newVersion !== currentVersion) {
        console.log(`- Version Bump: ${currentVersion} → ${newVersion}`);
    }
    console.log("-".repeat(40));

    const confirm = await question("\nProceed with commit and push? (y/n/q): ");
    if (confirm.toLowerCase() !== 'y') {
        console.log("Workflow cancelled.");
        process.exit(0);
    }

    // Git operations
    try {
        // 1. Update package.json version if changed
        if (newVersion !== currentVersion) {
            packageJson.version = newVersion;
            fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));
            console.log(`✅ Updated package.json to ${newVersion}`);
        }

        // 2. Fetch modified files for report (now includes package.json)
        const modifiedFiles = execSync("git status --porcelain", { encoding: "utf-8" })
            .split("\n")
            .filter(line => line.trim())
            .map(line => `- ${line.trim()}`)
            .join("\n");

        // 3. Read audit report and construct final enhanced report
        const reportPath = path.join(process.cwd(), "summary", "report.md");
        let auditInfo = fs.existsSync(reportPath) ? fs.readFileSync(reportPath, "utf-8") : "No audit data.";

        const enhancedReport = `## Update Overview\n- **Type**: ${updateTypeName}\n- **Version**: ${newVersion}\n\n## Modified Files\n${modifiedFiles}\n\n## Audit Results\n${auditInfo}`;

        // Write the enhanced report back
        fs.writeFileSync(reportPath, enhancedReport);

        // 4. Create and switch to branch BEFORE staging/committing
        console.log(`\n--- Switching to branch ${branchName} ---`);
        try {
            execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
        } catch (e) {
            execSync(`git checkout ${branchName}`, { stdio: "inherit" });
        }

        // 5. Git add (stages everything: package.json, report.md, and previous changes)
        execSync("git add .", { stdio: "inherit" });

        // 6. Construct final commit message
        let finalCommitMessage = "";
        if (typeChoice === 'o') {
            finalCommitMessage = commitMessageSubject;
        } else {
            finalCommitMessage = `${commitMessageSubject}\n\n${enhancedReport}`;
        }

        // 7. Git commit (using file for multi-line support)
        const tmpCommitMsgFile = path.join(process.cwd(), "summary", "commit_msg.tmp");
        fs.writeFileSync(tmpCommitMsgFile, finalCommitMessage);
        execSync(`git commit -F ${tmpCommitMsgFile}`, { stdio: "inherit" });
        fs.unlinkSync(tmpCommitMsgFile);

        // 8. Push
        execSync(`git push -u origin ${branchName}`, { stdio: "inherit" });

        console.log("\n" + "=".repeat(70));
        console.log("🎉 SUCCESS! Workflow complete.");
        console.log(`Current branch: ${branchName}`);
        console.log("=".repeat(70));
    } catch (error) {
        console.error("\n❌ Git operation failed.");
        console.error(error);
    } finally {
        rl.close();
    }
}

startWorkflow();
