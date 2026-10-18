export type NodeType =
  | "User"
  | "Skill"
  | "Experience"
  | "Role"
  | "Company"
  | "Project"
  | "Education"
  | "Achievement"
  | "TargetRole"
  | "MemoryFact";

export type EdgeType =
  | "HAS_EXPERIENCE"
  | "AT_COMPANY"
  | "HELD_ROLE"
  | "DEMONSTRATES_SKILL"
  | "HAS_SKILL"
  | "BUILT_PROJECT"
  | "UTILIZED_SKILL"
  | "EARNED_DEGREE"
  | "TARGETS_ROLE"
  | "COMPLEMENTS_SKILL"
  | "PROVES_CAPABILITY_FOR"
  | "RELATES_TO_SKILL"
  | "RELATES_TO_PROJECT"
  | "ACCOMPLISHED";

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  properties: Record<string, unknown>;
  color?: string;
  size?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  properties?: Record<string, unknown>;
  weight?: number;
}

export interface MultiHopPath {
  id: string;
  description: string;
  explanation?: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  relevanceScore: number;
  confidence?: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    userName: string;
    nodeCount: number;
    edgeCount: number;
    lastSyncedAt: string;
    source: "neo4j" | "local-vault";
  };
}

export interface Neo4jConfig {
  uri?: string;
  username?: string;
  user?: string;
  password?: string;
  database?: string;
}

export interface GraphRagQueryResult {
  query: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  paths: MultiHopPath[];
  summary: string;
  cypherQuery?: string;
  engineUsed: "neo4j-live" | "graph-store-fallback";
  insights: string[];
  retrievedNodes?: GraphNode[];
  retrievedEdges?: GraphEdge[];
  contextString?: string;
  mode?: "neo4j-live" | "graph-store-fallback" | "local-engine";
}
