import { GraphNode, GraphEdge, KnowledgeGraph, MultiHopPath, GraphRagQueryResult } from "./types";

export class LocalGraphStore {
  private graph: KnowledgeGraph;

  constructor(initialGraph?: KnowledgeGraph) {
    this.graph = initialGraph || {
      nodes: [],
      edges: [],
      metadata: {
        userName: "Candidate",
        nodeCount: 0,
        edgeCount: 0,
        lastSyncedAt: new Date().toISOString(),
        source: "local-vault",
      },
    };
  }

  public setGraph(graph: KnowledgeGraph) {
    this.graph = graph;
  }

  public getGraph(): KnowledgeGraph {
    return this.graph;
  }

  /**
   * Find multi-hop paths and related nodes based on search keywords or intent.
   */
  public queryGraph(query: string, maxHops: number = 3): GraphRagQueryResult {
    const rawTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !["and", "the", "for", "with", "show", "what", "how", "give"].includes(t));

    // Find direct matching seed nodes
    const seedNodes: GraphNode[] = [];
    const matchedNodeScores = new Map<string, number>();

    for (const node of this.graph.nodes) {
      let score = 0;
      const labelLower = node.label.toLowerCase();
      const typeLower = node.type.toLowerCase();
      const propsStr = JSON.stringify(node.properties || {}).toLowerCase();

      for (const token of rawTokens) {
        if (labelLower === token) score += 10;
        else if (labelLower.includes(token)) score += 5;
        if (propsStr.includes(token)) score += 2;
        if (typeLower.includes(token)) score += 1;
      }

      if (score > 0) {
        seedNodes.push(node);
        matchedNodeScores.set(node.id, score);
      }
    }

    // If no specific seed nodes match, default to Target Roles and Top Skills
    if (seedNodes.length === 0) {
      for (const node of this.graph.nodes) {
        if (node.type === "TargetRole" || node.type === "Skill" || node.type === "Project") {
          seedNodes.push(node);
          matchedNodeScores.set(node.id, 1);
        }
      }
    }

    // Traverse relationships from seed nodes (BFS up to maxHops)
    const visitedNodes = new Set<string>();
    const includedEdges = new Set<string>();
    const multiHopPaths: MultiHopPath[] = [];

    // Build adjacency list
    const adjacency = new Map<string, Array<{ edge: GraphEdge; neighborId: string }>>();
    for (const edge of this.graph.edges) {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
      adjacency.get(edge.source)!.push({ edge, neighborId: edge.target });
      adjacency.get(edge.target)!.push({ edge, neighborId: edge.source });
    }

    // Node lookup
    const nodeMap = new Map<string, GraphNode>(this.graph.nodes.map((n) => [n.id, n]));

    // Find paths of interest
    for (const seed of seedNodes.slice(0, 6)) {
      visitedNodes.add(seed.id);
      const queue: Array<{ currentId: string; pathNodes: GraphNode[]; pathEdges: GraphEdge[]; depth: number }> = [
        { currentId: seed.id, pathNodes: [seed], pathEdges: [], depth: 0 },
      ];

      while (queue.length > 0) {
        const { currentId, pathNodes, pathEdges, depth } = queue.shift()!;
        if (depth >= maxHops) continue;

        const neighbors = adjacency.get(currentId) || [];
        for (const { edge, neighborId } of neighbors) {
          if (pathNodes.some((n) => n.id === neighborId)) continue; // avoid cycles

          const neighborNode = nodeMap.get(neighborId);
          if (!neighborNode) continue;

          visitedNodes.add(neighborId);
          includedEdges.add(edge.id);

          const nextNodes = [...pathNodes, neighborNode];
          const nextEdges = [...pathEdges, edge];

          // Save meaningful multi-hop paths (depth >= 2)
          if (nextNodes.length >= 3) {
            const pathDesc = nextNodes
              .map((n, idx) => {
                const edgeInBetween = nextEdges[idx];
                const relStr = edgeInBetween ? ` -[:${edgeInBetween.type}]-> ` : "";
                return `(${n.type}: "${n.label}")${relStr}`;
              })
              .join("");

            multiHopPaths.push({
              id: `path_${multiHopPaths.length + 1}`,
              description: pathDesc,
              nodes: nextNodes,
              edges: nextEdges,
              relevanceScore: (matchedNodeScores.get(seed.id) || 1) * (1 / (depth + 1)),
            });
          }

          if (depth + 1 < maxHops) {
            queue.push({
              currentId: neighborId,
              pathNodes: nextNodes,
              pathEdges: nextEdges,
              depth: depth + 1,
            });
          }
        }
      }
    }

    const resultNodes = Array.from(visitedNodes)
      .map((id) => nodeMap.get(id))
      .filter((n): n is GraphNode => Boolean(n));

    const resultEdges = this.graph.edges.filter((e) => includedEdges.has(e.id));

    // Sort multi-hop paths by relevance
    const topPaths = multiHopPaths.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 8);

    // Generate Cypher query representation
    const queryKeywords = rawTokens.slice(0, 3).join("|");
    const generatedCypher = queryKeywords
      ? `MATCH p = (u:User)-[r1]->(intermediate)-[r2]->(entity)
WHERE entity.name =~ '(?i).*(${queryKeywords}).*'
   OR intermediate.name =~ '(?i).*(${queryKeywords}).*'
RETURN p, u, intermediate, entity
LIMIT 25;`
      : `MATCH p = (u:User)-[r:HAS_SKILL|BUILT_PROJECT|TARGETS_ROLE*1..3]->(target)
RETURN p
LIMIT 25;`;

    // Construct structured text summary for LLM injection
    const skillsFound = resultNodes.filter((n) => n.type === "Skill").map((n) => n.label);
    const projectsFound = resultNodes.filter((n) => n.type === "Project").map((n) => n.label);
    const rolesFound = resultNodes.filter((n) => n.type === "Role" || n.type === "TargetRole").map((n) => n.label);
    const companiesFound = resultNodes.filter((n) => n.type === "Company").map((n) => n.label);

    const insights: string[] = [];
    if (topPaths.length > 0) {
      insights.push(`Discovered ${topPaths.length} multi-hop evidence chains linking candidate skills to target positions.`);
    }
    if (skillsFound.length > 0) {
      insights.push(`Identified ${skillsFound.length} connected technical competencies (${skillsFound.slice(0, 5).join(", ")}).`);
    }
    if (projectsFound.length > 0) {
      insights.push(`Found ${projectsFound.length} implementation projects providing concrete capability proof.`);
    }

    const summary = `Knowledge Graph Subgraph:
- Connected Skills: ${skillsFound.slice(0, 8).join(", ") || "None"}
- Proof Projects: ${projectsFound.slice(0, 5).join(", ") || "None"}
- Target Roles & Positions: ${rolesFound.slice(0, 5).join(", ") || "None"}
- Companies: ${companiesFound.slice(0, 5).join(", ") || "None"}

Key Multi-Hop Graph Traversal Paths:
${topPaths.map((p, i) => `${i + 1}. ${p.description}`).join("\n") || "Direct candidate profile nodes linked."}`;

    return {
      query,
      nodes: resultNodes.length > 0 ? resultNodes : this.graph.nodes.slice(0, 20),
      edges: resultEdges.length > 0 ? resultEdges : this.graph.edges.slice(0, 25),
      paths: topPaths,
      summary,
      cypherQuery: generatedCypher,
      engineUsed: "graph-store-fallback",
      insights,
    };
  }
}
