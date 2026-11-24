/**
 * CareerAgent Official MCP Agent Playbook & Skills Grounding Content
 * 
 * Inviolable constraints for external AI agents (Claude Code, Gemini, Cursor, Qwen).
 * Byte length strictly capped at <= 2048 bytes for instant token-efficient loading.
 */

export const CAREER_AGENT_PLAYBOOK_MD = `# 🎯 CareerAgent Playbook for External AI Agents (AGENTS.md)

You are an expert Career Architect executing on CareerAgent MCP. Obey these 6 inviolable rules:

### RULE 1: PHOTO INLINING & VERIFICATION
Always call \`get_user_profile\` first. Check \`photoEmbedded\` and \`isPlaceholder\`. If \`isPlaceholder: true\` on photo-required templates (e.g. German CV), STOP and ask user to upload headshot. Never embed galaxy/default placeholders. Emitted PDF must be < 2 MB.

### RULE 2: ZERO HIDDEN-TEXT INJECTION
Hidden text (white font, font-size 0, invisible layers) is strictly banned. ATS modern parsers flag this as fraud. Place keywords ONLY in visible, black \`Skills\` blocks and authentic experience bullets.

### RULE 3: LANGUAGE & GEO-CONVENTIONS
Prose language MUST match the Job Description. If German, use German headers (KONTAKT, PROFIL, BERUFSERFAHRUNG, AUSBILDUNG, KENNTNISSE). All tech acronyms (CI/CD, Kubernetes, Python, ROS2, PyTorch, Docker) REMAIN in English.

### RULE 4: GRAPH-CENTRALITY SECTION ORDERING
Order work highlights by JD keyword overlap: place the most relevant achievements first in each position. Use \`get_skill_inventory\` and \`search_memory_vault\` instead of dumping full vault.

### RULE 5: SINGLE GROUNDED TRUTH (CAS)
Never invent metrics. If vault lacks specific numbers for a requirement, use \`[X]%\` or \`[X] ms\` placeholders. All vault writes require optimistic CAS version check.

### RULE 6: FAIL-LOUD BUDGET LIMITS
If user has an uploaded photo and resolution yields a placeholder, tool throws \`PhotoResolutionError\`. If document exceeds page budget, invoke \`auto_fit_resume_to_budget\`.

### CORE TOOLS:
- Vault: \`get_memory_vault\`, \`search_memory_vault\`, \`get_skill_inventory\`
- Documents: \`get_user_profile\`, \`get_user_resume\`, \`generate_resume_pdf\`, \`auto_fit_resume_to_budget\`
`;

export const VERIFIED_SKILLS_MD = `# 🛠️ Verified Career Skills & Grounded Capabilities

*Candidate: Alex Morgan (Berlin, Germany)*
*Source: CareerAgent Sample Dossier*

### Confirmed Core Competencies
1. **Full-Stack & Cloud Systems** - React, Next.js, TypeScript, Python, AWS, Docker, Kubernetes, MySQL, and GitHub Actions CI/CD.
2. **Backend & Microservices** - Scalable REST & GraphQL APIs, distributed database architectures, automated unit & integration testing.
3. **DevOps & Infrastructure** - Linux/Bash, Docker Compose, networking, Terraform, Ansible, Prometheus, Grafana.
4. **Autonomous Agent Tooling** - Model Context Protocol (MCP) server development, workflow automation, Claude Code, Cursor.

### Languages & Verification Standards
- **Languages**: English (Fluent / C1+), German (Professional / B2).
- **Integrity**: Grounded strictly in candidate records. Zero unverified metrics or hidden text.
`;

export const STRUCTURED_SKILL_INVENTORY = {
  candidate: "Alex Morgan",
  location: "Berlin, Germany",
  languages: ["English (Fluent / C1+)", "German (Professional / B2)"],
  skills: [
    {
      name: "React, Next.js & TypeScript",
      level: "Expert",
      category: "Full Stack",
      evidence: ["Production web microservices, scalable dashboards, and SaaS applications"],
      jdCentrality: 0.98,
    },
    {
      name: "Python & Backend Systems",
      level: "Expert",
      category: "Backend & Systems",
      evidence: ["Scalable REST APIs, automated data pipelines, and distributed services"],
      jdCentrality: 0.96,
    },
    {
      name: "DevOps, Cloud & Infrastructure",
      level: "Advanced",
      category: "DevOps & Cloud",
      evidence: ["AWS, Docker, Docker Compose, Kubernetes, CI/CD GitHub Actions, Linux/Bash, Terraform, Ansible, Prometheus, Grafana"],
      jdCentrality: 0.95,
    },
    {
      name: "Relational Databases (MySQL & PostgreSQL)",
      level: "Advanced",
      category: "Backend & Systems",
      evidence: ["Relational schema design, query optimization, and high-availability replication"],
      jdCentrality: 0.93,
    },
    {
      name: "Model Context Protocol & Agent Tooling",
      level: "Advanced",
      category: "AI & Tooling",
      evidence: ["Autonomous agent harnesses, MCP server suites, and developer workflows"],
      jdCentrality: 0.92,
    },
    {
      name: "Software Architecture & System Design",
      level: "Advanced",
      category: "Architecture",
      evidence: ["Decoupled microservice architectures and event-driven architectures"],
      jdCentrality: 0.90,
    },
    {
      name: "Linux & Bash Scripting",
      level: "Advanced",
      category: "Systems",
      evidence: ["Production server administration, shell automation, and container orchestration"],
      jdCentrality: 0.88,
    },
    {
      name: "Automated Testing & CI/CD",
      level: "Expert",
      category: "Quality Engineering",
      evidence: ["Comprehensive test automation across unit, integration, and end-to-end suites"],
      jdCentrality: 0.87,
    },
  ],
  metrics: [
    {
      claim: "Production microservices availability",
      value: "99.9%+ uptime across deployed cloud platforms",
      source: "CloudScale Technologies",
      verified: true,
    },
    {
      claim: "Automated CI/CD deployment frequency",
      value: "Zero-downtime automated deployments via GitHub Actions",
      source: "CloudScale Technologies",
      verified: true,
    },
  ],
};
