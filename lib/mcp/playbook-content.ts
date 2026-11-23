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

export const VERIFIED_SKILLS_MD = `# 🛠️ Verified Career Skills & Grounded Metrics

*Candidate: Venkata Sai Yakkshit Reddy Asodi (Konstanz, Germany)*
*Source: CareerAgent Memory Vault & Academic Research Dossier*

### Core Competencies & Graph Centrality
1. **Spatial AI & Multi-Modal Perception** (0.98 centrality) - Video tracking and VLM analysis agents.
2. **Autonomous Systems & Robotics** (0.95 centrality) - ROS2 real-time path planning, LiDAR/IMU sensor fusion (<30ms).
3. **Deep Learning & Agent Engineering** (0.94 centrality) - PyTorch, Computer Vision, SLAM, Formal Verification.
4. **Cloud Microservices & MLOps** (0.91 centrality) - Docker, Kubernetes, CI/CD Actions (99.8%+ uptime).
5. **Full-Stack Systems** (0.89 centrality) - TypeScript, React, Next.js, PostgreSQL.

### Grounded Empirical Metrics
- **<30ms sensor telemetry**: real-time LiDAR + IMU fusion latency in ROS2.
- **100+ fps throughput**: real-time multi-agent video tracking with GPU acceleration.
- **99.8% uptime**: maintained across microservices at CircleUp AG.
- **42% latency reduction**: distributed pipeline caching optimization.
`;

export const STRUCTURED_SKILL_INVENTORY = {
  candidate: "Venkata Sai Yakkshit Reddy Asodi",
  location: "Konstanz, Germany",
  skills: [
    {
      name: "Spatial AI & Perception",
      level: "Expert",
      category: "AI & Robotics",
      evidence: ["Universität Konstanz Neurobiology multi-agent honeybee tracking with VLMs"],
      jdCentrality: 0.98,
    },
    {
      name: "Python & PyTorch",
      level: "Expert",
      category: "Machine Learning",
      evidence: ["Deep learning pipelines, video tracking algorithms, VLM benchmarks"],
      jdCentrality: 0.96,
    },
    {
      name: "ROS2 & Autonomous Navigation",
      level: "Advanced",
      category: "Robotics",
      evidence: ["Path planning, LiDAR/IMU sensor fusion for racing hardware (<30ms telemetry)"],
      jdCentrality: 0.94,
    },
    {
      name: "C++ & Real-Time Systems",
      level: "Advanced",
      category: "Systems Engineering",
      evidence: ["Low-latency multi-threading and autonomous telemetry pipelines"],
      jdCentrality: 0.93,
    },
    {
      name: "Computer Vision & SLAM",
      level: "Advanced",
      category: "AI & Robotics",
      evidence: ["Multi-camera calibration, feature matching, spatial depth mapping"],
      jdCentrality: 0.92,
    },
    {
      name: "CI/CD & MLOps Infrastructure",
      level: "Advanced",
      category: "Backend & Systems",
      evidence: ["Docker, Kubernetes, zero-downtime CI/CD deployment at CircleUp AG (99.8%+ uptime)"],
      jdCentrality: 0.91,
    },
    {
      name: "TypeScript & React / Next.js",
      level: "Expert",
      category: "Full Stack",
      evidence: ["High-performance interactive web dashboards and production SaaS apps"],
      jdCentrality: 0.90,
    },
    {
      name: "Agentic AI & Formal Verification",
      level: "Advanced",
      category: "AI Research",
      evidence: ["Rigorous verification and benchmark evaluation for autonomous LLM/VLM agents"],
      jdCentrality: 0.89,
    },
  ],
  metrics: [
    {
      claim: "Sensor telemetry latency in ROS2",
      value: "<30ms latency across LiDAR, camera, and IMU streams",
      source: "Bodensee Racing Team",
      verified: true,
    },
    {
      claim: "Multi-agent video tracking agent throughput",
      value: "100+ fps real-time processing",
      source: "Universität Konstanz Neurobiology Lab",
      verified: true,
    },
    {
      claim: "Production microservices availability",
      value: "99.8%+ uptime",
      source: "CircleUp AG",
      verified: true,
    },
    {
      claim: "Data pipeline latency optimization",
      value: "42% latency reduction",
      source: "Career AI Studio / NDE Project",
      verified: true,
    },
  ],
};
