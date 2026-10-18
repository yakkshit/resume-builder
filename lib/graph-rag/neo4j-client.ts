import neo4j, { Driver, Session } from "neo4j-driver";
import { Neo4jConfig, KnowledgeGraph, GraphRagQueryResult, GraphNode, GraphEdge, MultiHopPath } from "./types";
import { LocalGraphStore } from "./local-graph-store";

let driverCache: { uri: string; driver: Driver } | null = null;

export function resolveNeo4jConfig(overrideConfig?: Neo4jConfig): Neo4jConfig {
  return {
    uri: overrideConfig?.uri || process.env.NEO4J_URI || process.env.NEXT_PUBLIC_NEO4J_URI || "",
    username: overrideConfig?.username || overrideConfig?.user || process.env.NEO4J_USERNAME || process.env.NEXT_PUBLIC_NEO4J_USERNAME || "neo4j",
    password: overrideConfig?.password || process.env.NEO4J_PASSWORD || process.env.NEXT_PUBLIC_NEO4J_PASSWORD || "",
    database: overrideConfig?.database || process.env.NEO4J_DATABASE || "neo4j",
  };
}

export function getNeo4jDriver(config: Neo4jConfig): Driver | null {
  if (!config.uri || !config.password) {
    return null;
  }

  if (driverCache && driverCache.uri === config.uri) {
    return driverCache.driver;
  }

  try {
    const driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username || "neo4j", config.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 5000,
      }
    );
    driverCache = { uri: config.uri, driver };
    return driver;
  } catch (err) {
    console.warn("[neo4j-client] Failed to create Neo4j driver:", err);
    return null;
  }
}

/**
 * Verify connectivity to the Neo4j instance.
 */
export async function testNeo4jConnection(configInput?: Neo4jConfig): Promise<{
  success: boolean;
  message: string;
  serverInfo?: string;
  nodeCount?: number;
}> {
  const config = resolveNeo4jConfig(configInput);
  if (!config.uri || !config.password) {
    return {
      success: false,
      message: "Missing Neo4j URI or password. Please configure connection details.",
    };
  }

  const driver = getNeo4jDriver(config);
  if (!driver) {
    return {
      success: false,
      message: `Could not initialize driver for URI: ${config.uri}`,
    };
  }

  let session: Session | null = null;
  try {
    session = driver.session({ database: config.database || "neo4j" });
    const result = await session.run("MATCH (n) RETURN count(n) as totalCount");
    const countRecord = result.records[0];
    const nodeCount = countRecord ? countRecord.get("totalCount").toNumber() : 0;

    return {
      success: true,
      message: `Successfully connected to Neo4j graph database (${nodeCount} nodes found).`,
      serverInfo: config.uri,
      nodeCount,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Neo4j Connection Failed: ${err.message || String(err)}`,
    };
  } finally {
    if (session) await session.close();
  }
}

/**
 * Sync the local knowledge graph to the Neo4j Graph Database.
 */
export async function syncKnowledgeGraphToNeo4j(
  graph: KnowledgeGraph,
  configInput?: Neo4jConfig
): Promise<{ success: boolean; nodesSynced: number; edgesSynced: number; message: string }> {
  const config = resolveNeo4jConfig(configInput);
  const driver = getNeo4jDriver(config);

  if (!driver) {
    return {
      success: false,
      nodesSynced: 0,
      edgesSynced: 0,
      message: "Neo4j connection not configured. Graph is stored in local Graph RAG engine.",
    };
  }

  let session: Session | null = null;
  try {
    session = driver.session({ database: config.database || "neo4j" });

    // 1. Create constraints for uniqueness
    const constraintQueries = [
      "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
      "CREATE CONSTRAINT skill_id_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.id IS UNIQUE",
      "CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE",
      "CREATE CONSTRAINT role_id_unique IF NOT EXISTS FOR (r:Role) REQUIRE r.id IS UNIQUE",
      "CREATE CONSTRAINT project_id_unique IF NOT EXISTS FOR (p:Project) REQUIRE p.id IS UNIQUE",
      "CREATE CONSTRAINT exp_id_unique IF NOT EXISTS FOR (e:Experience) REQUIRE e.id IS UNIQUE",
    ];

    for (const cQuery of constraintQueries) {
      try {
        await session.run(cQuery);
      } catch {
        // Ignore constraint creation failures if user lacks schema permissions
      }
    }

    // 2. Batch merge nodes
    const nodeBatch = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      props: JSON.stringify(n.properties || {}),
    }));

    await session.run(
      `
      UNWIND $batch AS item
      MERGE (n:Entity {id: item.id})
      SET n.label = item.label,
          n.type = item.type,
          n.properties = item.props,
          n.updatedAt = datetime()
      WITH n, item
      CALL apoc.create.addLabels(n, [item.type]) YIELD node
      RETURN count(node)
      `,
      { batch: nodeBatch }
    ).catch(async () => {
      // Fallback if APOC is not installed
      await session!.run(
        `
        UNWIND $batch AS item
        MERGE (n:Entity {id: item.id})
        SET n.label = item.label,
            n.type = item.type,
            n.properties = item.props,
            n.updatedAt = datetime()
        `,
        { batch: nodeBatch }
      );
    });

    // 3. Batch merge edges
    const edgeBatch = graph.edges.map((e) => ({
      source: e.source,
      target: e.target,
      type: e.type,
    }));

    await session.run(
      `
      UNWIND $batch AS edge
      MATCH (a:Entity {id: edge.source})
      MATCH (b:Entity {id: edge.target})
      MERGE (a)-[r:RELATION {type: edge.type}]->(b)
      SET r.updatedAt = datetime()
      `,
      { batch: edgeBatch }
    );

    return {
      success: true,
      nodesSynced: graph.nodes.length,
      edgesSynced: graph.edges.length,
      message: `Synchronized ${graph.nodes.length} nodes and ${graph.edges.length} relationships directly to Neo4j.`,
    };
  } catch (err: any) {
    console.warn("[neo4j-client] Sync to Neo4j encountered error:", err);
    return {
      success: false,
      nodesSynced: 0,
      edgesSynced: 0,
      message: `Sync failed: ${err.message || String(err)}. Falling back to local Graph RAG engine.`,
    };
  } finally {
    if (session) await session.close();
  }
}

/**
 * Execute a Graph RAG query.
 * Queries live Neo4j if configured; otherwise uses the fast LocalGraphStore engine.
 */
export async function executeNeo4jGraphRag(
  query: string,
  localGraph: KnowledgeGraph,
  configInput?: Neo4jConfig
): Promise<GraphRagQueryResult> {
  const config = resolveNeo4jConfig(configInput);
  const driver = getNeo4jDriver(config);

  if (driver) {
    let session: Session | null = null;
    try {
      session = driver.session({ database: config.database || "neo4j" });

      const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
      const tokens = cleanQuery.split(/\s+/).filter((t) => t.length > 2);
      const searchTerms = tokens.slice(0, 4).join("|") || "engineer";

      const cypherQuery = `
        MATCH p = (u:Entity)-[r:RELATION*1..3]-(target:Entity)
        WHERE u.id = 'user_root'
          AND (toLower(target.label) =~ '(?i).*(${searchTerms}).*' OR toLower(target.type) =~ '(?i).*(${searchTerms}).*')
        RETURN p, nodes(p) as pathNodes, relationships(p) as pathRels
        LIMIT 25;
      `;

      const result = await session.run(cypherQuery);
      if (result.records.length > 0) {
        const nodesFound = new Map<string, GraphNode>();
        const edgesFound = new Map<string, GraphEdge>();
        const pathsFound: MultiHopPath[] = [];

        result.records.forEach((record, idx) => {
          const pathNodes = record.get("pathNodes") as any[];
          const pathRels = record.get("pathRels") as any[];

          const mappedNodes: GraphNode[] = [];
          const mappedEdges: GraphEdge[] = [];

          pathNodes.forEach((n) => {
            const id = n.properties.id || String(n.identity);
            const nodeObj: GraphNode = {
              id,
              label: n.properties.label || "Entity",
              type: n.properties.type || "Skill",
              properties: n.properties,
            };
            nodesFound.set(id, nodeObj);
            mappedNodes.push(nodeObj);
          });

          pathRels.forEach((r) => {
            const edgeObj: GraphEdge = {
              id: `rel_${r.identity}`,
              source: String(r.startNodeElementId || r.start),
              target: String(r.endNodeElementId || r.end),
              type: r.properties.type || "RELATED_TO",
            };
            edgesFound.set(edgeObj.id, edgeObj);
            mappedEdges.push(edgeObj);
          });

          const pathDesc = mappedNodes
            .map((n, i) => {
              const e = mappedEdges[i];
              return `(${n.type}: "${n.label}")${e ? ` -[:${e.type}]-> ` : ""}`;
            })
            .join("");

          pathsFound.push({
            id: `neo4j_path_${idx + 1}`,
            description: pathDesc,
            nodes: mappedNodes,
            edges: mappedEdges,
            relevanceScore: 1.0,
          });
        });

        const skills = Array.from(nodesFound.values()).filter((n) => n.type === "Skill").map((n) => n.label);
        const projects = Array.from(nodesFound.values()).filter((n) => n.type === "Project").map((n) => n.label);
        const roles = Array.from(nodesFound.values()).filter((n) => n.type === "Role" || n.type === "TargetRole").map((n) => n.label);

        const summary = `Live Neo4j Graph RAG Grounding:
- Matched Competencies in Neo4j: ${skills.join(", ") || "None"}
- Proof Projects in Neo4j: ${projects.join(", ") || "None"}
- Connected Roles: ${roles.join(", ") || "None"}

Verified Cypher Traversal Paths:
${pathsFound.map((p, i) => `${i + 1}. ${p.description}`).join("\n")}`;

        const resultNodes = Array.from(nodesFound.values());
        const resultEdges = Array.from(edgesFound.values());
        return {
          query,
          nodes: resultNodes,
          edges: resultEdges,
          paths: pathsFound,
          summary,
          cypherQuery,
          engineUsed: "neo4j-live",
          mode: "neo4j-live",
          retrievedNodes: resultNodes,
          retrievedEdges: resultEdges,
          contextString: summary,
          insights: [
            `Queried live enterprise Neo4j database (${config.uri}).`,
            `Discovered ${pathsFound.length} multi-hop structural proof paths.`,
          ],
        };
      }
    } catch (err) {
      console.warn("[neo4j-client] Live query encountered issue, falling back to local graph store:", err);
    } finally {
      if (session) await session.close();
    }
  }

  // Graceful, fast local fallback
  const store = new LocalGraphStore(localGraph);
  const localRes = store.queryGraph(query);
  return {
    ...localRes,
    mode: "graph-store-fallback",
    retrievedNodes: localRes.nodes,
    retrievedEdges: localRes.edges,
    contextString: localRes.summary,
  };
}
