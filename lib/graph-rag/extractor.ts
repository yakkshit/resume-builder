import { GraphNode, GraphEdge, KnowledgeGraph, NodeType } from "./types";

interface ResumeBasicInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  website?: string;
  github?: string;
  linkedin?: string;
}

interface ResumeExperience {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
  highlights?: string[];
  skills?: string[];
}

interface ResumeProject {
  name?: string;
  description?: string;
  technologies?: string[];
  highlights?: string[];
  url?: string;
}

interface ResumeEducation {
  institution?: string;
  degree?: string;
  field?: string;
  startDate?: string;
  endDate?: string;
}

interface ResumeData {
  basicInfo?: ResumeBasicInfo;
  skills?: Array<string | { name: string; category?: string; level?: string }>;
  experience?: ResumeExperience[];
  projects?: ResumeProject[];
  education?: ResumeEducation[];
  targetRoles?: string[];
}

const SKILL_CATEGORY_MAP: Record<string, string> = {
  // AI / ML
  python: "AI / ML",
  pytorch: "AI / ML",
  tensorflow: "AI / ML",
  llm: "AI / ML",
  llms: "AI / ML",
  rag: "AI / ML",
  langchain: "AI / ML",
  huggingface: "AI / ML",
  openai: "AI / ML",
  gemini: "AI / ML",
  "graph rag": "AI / ML",
  "machine learning": "AI / ML",
  "deep learning": "AI / ML",
  nlp: "AI / ML",
  computer_vision: "AI / ML",
  // Frontend
  react: "Frontend",
  "next.js": "Frontend",
  nextjs: "Frontend",
  typescript: "Frontend",
  javascript: "Frontend",
  vue: "Frontend",
  svelte: "Frontend",
  tailwind: "Frontend",
  css: "Frontend",
  html: "Frontend",
  // Backend & Architecture
  "node.js": "Backend",
  nodejs: "Backend",
  go: "Backend",
  golang: "Backend",
  rust: "Backend",
  java: "Backend",
  "c++": "Backend",
  csharp: "Backend",
  "distributed systems": "Backend & Architecture",
  microservices: "Backend & Architecture",
  graphql: "Backend",
  "rest api": "Backend",
  grpc: "Backend",
  // Database & Graph
  neo4j: "Graph & Database",
  cypher: "Graph & Database",
  postgresql: "Database",
  postgres: "Database",
  mongodb: "Database",
  redis: "Database",
  mysql: "Database",
  vector_db: "Database",
  pinecone: "Database",
  // Cloud & DevOps
  aws: "Cloud & DevOps",
  gcp: "Cloud & DevOps",
  azure: "Cloud & DevOps",
  docker: "Cloud & DevOps",
  kubernetes: "Cloud & DevOps",
  k8s: "Cloud & DevOps",
  ci_cd: "Cloud & DevOps",
  linux: "Cloud & DevOps",
  terraform: "Cloud & DevOps",
};

const COLOR_MAP: Record<NodeType, string> = {
  User: "#aff33e", // Neon lime
  Skill: "#10b981", // Emerald
  Experience: "#f59e0b", // Amber
  Role: "#6366f1", // Indigo
  Company: "#ec4899", // Pink
  Project: "#06b6d4", // Cyan
  Education: "#8b5cf6", // Purple
  Achievement: "#eab308", // Yellow
  TargetRole: "#3b82f6", // Blue
  MemoryFact: "#a855f7", // Violet
};

function normalizeId(type: string, name: string): string {
  return `${type.toLowerCase()}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

function classifySkill(name: string): string {
  const clean = name.toLowerCase().trim();
  if (SKILL_CATEGORY_MAP[clean]) return SKILL_CATEGORY_MAP[clean];
  for (const [key, cat] of Object.entries(SKILL_CATEGORY_MAP)) {
    if (clean.includes(key) || key.includes(clean)) return cat;
  }
  return "General Technical";
}

/**
 * Extracts a multi-layered Knowledge Graph from Resume Data, User Profile, and Memory Vault text.
 */
export function extractKnowledgeGraph(
  resumeData?: ResumeData | null,
  profile?: Record<string, unknown> | null,
  memoryVaultMarkdown?: string | null
): KnowledgeGraph {
  const nodesMap = new Map<string, GraphNode>();
  const edgesMap = new Map<string, GraphEdge>();

  const userName =
    (profile?.name as string) ||
    resumeData?.basicInfo?.name ||
    "Professional Candidate";

  // 1. User Node (Root candidate node)
  const userNodeId = "user_root";
  nodesMap.set(userNodeId, {
    id: userNodeId,
    label: userName,
    type: "User",
    properties: {
      name: userName,
      title: (profile?.targetRoles as string) || resumeData?.basicInfo?.title || "Engineer",
      location: (profile?.location as string) || resumeData?.basicInfo?.location || "",
      summary: (profile?.careerNotes as string) || resumeData?.basicInfo?.summary || "",
      email: (profile?.email as string) || resumeData?.basicInfo?.email || "",
      github: (profile?.github as string) || resumeData?.basicInfo?.github || "",
      linkedin: (profile?.linkedin as string) || resumeData?.basicInfo?.linkedin || "",
    },
    color: COLOR_MAP.User,
    size: 24,
  });

  // Helper to add nodes & edges safely
  const addNode = (node: GraphNode) => {
    if (!nodesMap.has(node.id)) {
      nodesMap.set(node.id, {
        ...node,
        color: COLOR_MAP[node.type] || "#94a3b8",
        size: node.size || (node.type === "Skill" ? 14 : 16),
      });
    }
  };

  const addEdge = (edge: GraphEdge) => {
    const key = `${edge.source}__${edge.type}__${edge.target}`;
    if (!edgesMap.has(key)) {
      edgesMap.set(key, { ...edge, id: key });
    }
  };

  // 2. Extract Skills
  const rawSkills: string[] = [];
  if (resumeData?.skills && Array.isArray(resumeData.skills)) {
    for (const s of resumeData.skills) {
      if (typeof s === "string" && s.trim()) rawSkills.push(s.trim());
      else if (s && typeof s === "object" && s.name) rawSkills.push(s.name.trim());
    }
  }
  if (profile?.masterSkills && typeof profile.masterSkills === "string") {
    profile.masterSkills
      .split(/[,;\n•]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => rawSkills.push(s));
  }

  const uniqueSkills = Array.from(new Set(rawSkills));
  for (const skillName of uniqueSkills) {
    if (skillName.length < 2) continue;
    const skillId = normalizeId("skill", skillName);
    const category = classifySkill(skillName);
    addNode({
      id: skillId,
      label: skillName,
      type: "Skill",
      properties: { name: skillName, category },
    });

    addEdge({
      id: `${userNodeId}__HAS_SKILL__${skillId}`,
      source: userNodeId,
      target: skillId,
      type: "HAS_SKILL",
      weight: 1.0,
      properties: { category },
    });
  }

  // 3. Extract Target Roles
  const targetRolesRaw: string[] = [];
  if (profile?.targetRoles && typeof profile.targetRoles === "string") {
    targetRolesRaw.push(
      ...profile.targetRoles
        .split(/[,;\n]+/)
        .map((r) => r.trim())
        .filter(Boolean)
    );
  }
  if (resumeData?.targetRoles && Array.isArray(resumeData.targetRoles)) {
    targetRolesRaw.push(...resumeData.targetRoles);
  }

  const uniqueTargetRoles = Array.from(new Set(targetRolesRaw));
  for (const roleTitle of uniqueTargetRoles) {
    const roleId = normalizeId("target_role", roleTitle);
    addNode({
      id: roleId,
      label: roleTitle,
      type: "TargetRole",
      properties: { title: roleTitle, priority: "High" },
      size: 18,
    });

    addEdge({
      id: `${userNodeId}__TARGETS_ROLE__${roleId}`,
      source: userNodeId,
      target: roleId,
      type: "TARGETS_ROLE",
      weight: 1.5,
    });
  }

  // 4. Extract Experiences & Companies
  if (resumeData?.experience && Array.isArray(resumeData.experience)) {
    resumeData.experience.forEach((exp, idx) => {
      const companyName = exp.company?.trim() || `Company ${idx + 1}`;
      const position = exp.position?.trim() || "Engineer";
      const expId = normalizeId("exp", `${companyName}_${position}_${idx}`);
      const companyId = normalizeId("company", companyName);
      const roleId = normalizeId("role", position);

      addNode({
        id: companyId,
        label: companyName,
        type: "Company",
        properties: { name: companyName },
        size: 18,
      });

      addNode({
        id: roleId,
        label: position,
        type: "Role",
        properties: { title: position },
        size: 16,
      });

      addNode({
        id: expId,
        label: `${position} @ ${companyName}`,
        type: "Experience",
        properties: {
          company: companyName,
          position,
          period: `${exp.startDate || ""} - ${exp.endDate || ""}`.trim(),
          description: exp.description || "",
        },
        size: 16,
      });

      addEdge({
        id: `${userNodeId}__HAS_EXPERIENCE__${expId}`,
        source: userNodeId,
        target: expId,
        type: "HAS_EXPERIENCE",
      });

      addEdge({
        id: `${expId}__AT_COMPANY__${companyId}`,
        source: expId,
        target: companyId,
        type: "AT_COMPANY",
      });

      addEdge({
        id: `${expId}__HELD_ROLE__${roleId}`,
        source: expId,
        target: roleId,
        type: "HELD_ROLE",
      });

      // Match skills demonstrated in this role
      const fullExpText = `${exp.description || ""} ${(exp.highlights || []).join(" ")} ${(exp.skills || []).join(" ")}`.toLowerCase();
      uniqueSkills.forEach((s) => {
        if (fullExpText.includes(s.toLowerCase())) {
          const skillId = normalizeId("skill", s);
          addEdge({
            id: `${roleId}__DEMONSTRATES_SKILL__${skillId}`,
            source: roleId,
            target: skillId,
            type: "DEMONSTRATES_SKILL",
          });
        }
      });
    });
  }

  // 5. Extract Projects
  if (resumeData?.projects && Array.isArray(resumeData.projects)) {
    resumeData.projects.forEach((proj, idx) => {
      const projName = proj.name?.trim() || `Project ${idx + 1}`;
      const projId = normalizeId("project", projName);

      addNode({
        id: projId,
        label: projName,
        type: "Project",
        properties: {
          name: projName,
          description: proj.description || "",
          url: proj.url || "",
          technologies: proj.technologies || [],
        },
        size: 18,
      });

      addEdge({
        id: `${userNodeId}__BUILT_PROJECT__${projId}`,
        source: userNodeId,
        target: projId,
        type: "BUILT_PROJECT",
      });

      // Link technologies/skills
      const techs = proj.technologies || [];
      const projDesc = `${proj.description || ""} ${(proj.highlights || []).join(" ")}`.toLowerCase();

      techs.forEach((t) => {
        const skillId = normalizeId("skill", t);
        addNode({
          id: skillId,
          label: t,
          type: "Skill",
          properties: { name: t, category: classifySkill(t) },
        });
        addEdge({
          id: `${projId}__UTILIZED_SKILL__${skillId}`,
          source: projId,
          target: skillId,
          type: "UTILIZED_SKILL",
        });
      });

      uniqueSkills.forEach((s) => {
        if (projDesc.includes(s.toLowerCase())) {
          const skillId = normalizeId("skill", s);
          addEdge({
            id: `${projId}__UTILIZED_SKILL__${skillId}`,
            source: projId,
            target: skillId,
            type: "UTILIZED_SKILL",
          });
        }
      });

      // Connect project capability to Target Roles
      uniqueTargetRoles.forEach((targetRole) => {
        const roleId = normalizeId("target_role", targetRole);
        addEdge({
          id: `${projId}__PROVES_CAPABILITY_FOR__${roleId}`,
          source: projId,
          target: roleId,
          type: "PROVES_CAPABILITY_FOR",
        });
      });
    });
  }

  // 6. Extract Education
  if (resumeData?.education && Array.isArray(resumeData.education)) {
    resumeData.education.forEach((edu, idx) => {
      const inst = edu.institution?.trim() || `Institution ${idx + 1}`;
      const degree = edu.degree?.trim() || "Degree";
      const eduId = normalizeId("edu", `${inst}_${degree}`);

      addNode({
        id: eduId,
        label: `${degree} - ${inst}`,
        type: "Education",
        properties: {
          institution: inst,
          degree,
          field: edu.field || "",
          period: `${edu.startDate || ""} - ${edu.endDate || ""}`.trim(),
        },
        size: 16,
      });

      addEdge({
        id: `${userNodeId}__EARNED_DEGREE__${eduId}`,
        source: userNodeId,
        target: eduId,
        type: "EARNED_DEGREE",
      });
    });
  }

  // 7. Extract Memory Vault Document Facts
  const vaultText = memoryVaultMarkdown || (profile?.ragKnowledgeBase as string) || "";
  if (vaultText.trim()) {
    const sections = vaultText.split(/(?=\n##\s+)/g);
    sections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return;
      const lines = trimmed.split("\n");
      const titleMatch = lines[0].match(/##\s+(.+)/);
      const title = titleMatch ? titleMatch[1].trim() : `Memory Fact ${idx + 1}`;
      const content = lines.slice(1).join("\n").trim();

      if (content.length > 10) {
        const factId = normalizeId("fact", `${title}_${idx}`);
        addNode({
          id: factId,
          label: title,
          type: "MemoryFact",
          properties: {
            title,
            snippet: content.slice(0, 300),
            fullLength: content.length,
          },
          size: 15,
        });

        addEdge({
          id: `${userNodeId}__ACCOMPLISHED__${factId}`,
          source: userNodeId,
          target: factId,
          type: "ACCOMPLISHED",
        });

        // Correlate with skills
        const lowerContent = content.toLowerCase();
        uniqueSkills.slice(0, 15).forEach((s) => {
          if (lowerContent.includes(s.toLowerCase())) {
            const skillId = normalizeId("skill", s);
            addEdge({
              id: `${factId}__RELATES_TO_SKILL__${skillId}`,
              source: factId,
              target: skillId,
              type: "RELATES_TO_SKILL",
            });
          }
        });
      }
    });
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges: Array.from(edgesMap.values()),
    metadata: {
      userName,
      nodeCount: nodesMap.size,
      edgeCount: edgesMap.size,
      lastSyncedAt: new Date().toISOString(),
      source: "local-vault",
    },
  };
}
