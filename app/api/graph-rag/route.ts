import { NextRequest, NextResponse } from "next/server";
import { extractKnowledgeGraph } from "@/lib/graph-rag/extractor";
import { testNeo4jConnection, syncKnowledgeGraphToNeo4j, executeNeo4jGraphRag } from "@/lib/graph-rag/neo4j-client";
import { Neo4jConfig } from "@/lib/graph-rag/types";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      action = "query",
      query = "",
      resumeData,
      profile,
      memoryVaultMarkdown,
      config,
    } = body as {
      action?: "query" | "sync" | "test" | "get-graph";
      query?: string;
      resumeData?: any;
      profile?: any;
      memoryVaultMarkdown?: string;
      config?: Neo4jConfig;
    };

    if (action === "test") {
      const result = await testNeo4jConnection(config);
      return NextResponse.json(result);
    }

    // Extract current graph from provided data
    const extractedGraph = extractKnowledgeGraph(resumeData, profile, memoryVaultMarkdown);

    if (action === "sync") {
      const syncResult = await syncKnowledgeGraphToNeo4j(extractedGraph, config);
      return NextResponse.json({
        ...syncResult,
        graph: extractedGraph,
      });
    }

    if (action === "get-graph") {
      return NextResponse.json({
        success: true,
        graph: extractedGraph,
      });
    }

    // Default: execute Graph RAG query
    const ragResult = await executeNeo4jGraphRag(query || "Target role and career skills", extractedGraph, config);
    return NextResponse.json({
      success: true,
      result: ragResult,
      graph: extractedGraph,
    });
  } catch (error: any) {
    console.error("[api/graph-rag] Error processing request:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process Graph RAG request",
      },
      { status: 500 }
    );
  }
}
