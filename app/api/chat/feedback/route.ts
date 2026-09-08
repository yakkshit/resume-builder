import { NextRequest, NextResponse } from "next/server";
import { Neo4jGraphService } from "@/lib/neo4j/graph-service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { feedbackId, userId, sessionId, messageId, prompt, response, rating, isPositive, correction, tags, comments, timestamp } = body;

    if (!messageId || !prompt || !response) {
      return NextResponse.json({ error: "Missing required feedback fields" }, { status: 400 });
    }

    const payload = {
      feedbackId: feedbackId || `fb_${messageId}_${Date.now()}`,
      userId: userId || "anonymous",
      sessionId: sessionId || "default",
      messageId,
      prompt,
      response,
      rating: typeof rating === "number" ? rating : (isPositive ? 5 : 1),
      isPositive: typeof isPositive === "boolean" ? isPositive : true,
      correction: correction || undefined,
      tags: Array.isArray(tags) ? tags : [],
      comments: comments || undefined,
      timestamp: timestamp || Date.now(),
    };

    // 1. Save to Neo4j Graph
    await Neo4jGraphService.saveChatFeedback(payload);

    return NextResponse.json({ success: true, feedbackId: payload.feedbackId });
  } catch (error) {
    console.error("Error logging chat feedback:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error logging feedback" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";
    const limit = parseInt(searchParams.get("limit") || "500", 10);

    const dataset = await Neo4jGraphService.getFineTuningDataset(limit);

    if (format === "jsonl") {
      // Export standard JSONL training format
      const jsonlLines = dataset.map((item) =>
        JSON.stringify({
          messages: [
            { role: "user", content: item.prompt },
            { role: "assistant", content: item.chosen || item.rejected },
          ],
          chosen: item.chosen,
          rejected: item.rejected,
          tags: item.tags,
          rating: item.rating,
        })
      );

      return new NextResponse(jsonlLines.join("\n"), {
        headers: {
          "Content-Type": "application/x-ndjson",
          "Content-Disposition": 'attachment; filename="rlhf_career_model_dataset.jsonl"',
        },
      });
    }

    return NextResponse.json({ total: dataset.length, dataset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to export training dataset" },
      { status: 500 }
    );
  }
}
