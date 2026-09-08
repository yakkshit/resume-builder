/**
 * Neo4j Graph Database Connection & Driver
 * Supports Neo4j AuraDB (cloud) and local/Docker instances.
 * Includes graceful connection testing and fallback.
 */

import neo4j, { Driver, Session } from "neo4j-driver";

let driverInstance: Driver | null = null;

export function getNeo4jDriver(): Driver | null {
  const uri = process.env.NEO4J_URI || process.env.NEO4J_URL;
  const user = process.env.NEO4J_USERNAME || process.env.NEO4J_USER || "neo4j";
  const password = process.env.NEO4J_PASSWORD;

  if (!uri || !password) {
    return null;
  }

  if (!driverInstance) {
    try {
      driverInstance = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        disableLosslessIntegers: true,
      });
    } catch (err) {
      console.warn("Failed to initialize Neo4j driver:", err);
      return null;
    }
  }

  return driverInstance;
}

export async function getNeo4jSession(database?: string): Promise<Session | null> {
  const driver = getNeo4jDriver();
  if (!driver) return null;
  return driver.session({ database: database || process.env.NEO4J_DATABASE || "neo4j" });
}

export async function testNeo4jConnection(): Promise<{ success: boolean; message: string; version?: string }> {
  const driver = getNeo4jDriver();
  if (!driver) {
    return {
      success: false,
      message: "Neo4j environment variables (NEO4J_URI, NEO4J_PASSWORD) are not configured.",
    };
  }

  const session = await getNeo4jSession();
  if (!session) {
    return { success: false, message: "Could not open Neo4j session." };
  }

  try {
    const result = await session.run("CALL dbms.components() YIELD name, versions, edition RETURN name, versions[0] AS version, edition");
    const record = result.records[0];
    const version = record ? `${record.get("name")} ${record.get("version")} (${record.get("edition")})` : "Neo4j Connected";
    return { success: true, message: "Connected to Neo4j successfully!", version };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error connecting to Neo4j database",
    };
  } finally {
    await session.close();
  }
}
