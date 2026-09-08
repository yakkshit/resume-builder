/**
 * Neo4j Career Knowledge Graph Service
 * Models User, Skills, Experiences, Resumes, Job Listings, and Chat Feedback.
 */

import { getNeo4jSession } from "./driver";

export interface SkillNode {
  name: string;
  category?: string;
  proficiency?: string;
  yearsOfExperience?: number;
}

export interface UserGraphData {
  userId: string;
  email: string;
  name: string;
  skills?: SkillNode[];
  targetRoles?: string[];
}

export interface ChatFeedbackGraphData {
  feedbackId: string;
  userId?: string;
  sessionId?: string;
  messageId: string;
  prompt: string;
  response: string;
  rating: number; // 1 to 5 (or 1 for upvote, -1 for downvote)
  isPositive: boolean;
  correction?: string;
  tags?: string[];
  comments?: string;
  timestamp: number;
}

export class Neo4jGraphService {
  /**
   * Upsert a user node and link their skill knowledge graph in Neo4j.
   */
  static async syncUserGraph(userData: UserGraphData): Promise<boolean> {
    const session = await getNeo4jSession();
    if (!session) return false;

    try {
      // 1. Merge User node
      await session.run(
        `
        MERGE (u:User {id: $userId})
        SET u.email = $email,
            u.name = $name,
            u.targetRoles = $targetRoles,
            u.updatedAt = datetime()
        RETURN u
        `,
        {
          userId: userData.userId,
          email: userData.email,
          name: userData.name,
          targetRoles: userData.targetRoles || [],
        }
      );

      // 2. Link Skills
      if (userData.skills && userData.skills.length > 0) {
        for (const skill of userData.skills) {
          await session.run(
            `
            MATCH (u:User {id: $userId})
            MERGE (s:Skill {name: $skillName})
            ON CREATE SET s.category = $category
            MERGE (u)-[r:HAS_SKILL]->(s)
            SET r.proficiency = $proficiency,
                r.yearsOfExperience = $yearsOfExperience,
                r.updatedAt = datetime()
            `,
            {
              userId: userData.userId,
              skillName: skill.name.trim(),
              category: skill.category || "General",
              proficiency: skill.proficiency || "Intermediate",
              yearsOfExperience: skill.yearsOfExperience || 1,
            }
          );
        }
      }

      return true;
    } catch (err) {
      console.warn("Neo4j syncUserGraph error:", err);
      return false;
    } finally {
      await session.close();
    }
  }

  /**
   * Calculate skill match and gap between a User and a target Job role or Job node.
   */
  static async calculateSkillGap(userId: string, targetSkills: string[]): Promise<{
    matchingSkills: string[];
    missingSkills: string[];
    matchPercentage: number;
  }> {
    const session = await getNeo4jSession();
    if (!session) {
      // Fallback calculation if Neo4j is offline
      return {
        matchingSkills: [],
        missingSkills: targetSkills,
        matchPercentage: 0,
      };
    }

    try {
      const result = await session.run(
        `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:HAS_SKILL]->(s:Skill)
        WHERE s.name IN $targetSkills
        RETURN collect(s.name) AS userMatchingSkills
        `,
        { userId, targetSkills }
      );

      const record = result.records[0];
      const matchingSkills: string[] = record ? record.get("userMatchingSkills") : [];
      const matchingSet = new Set(matchingSkills.map((s) => s.toLowerCase()));
      const missingSkills = targetSkills.filter((s) => !matchingSet.has(s.toLowerCase()));

      const matchPercentage = targetSkills.length > 0
        ? Math.round((matchingSkills.length / targetSkills.length) * 100)
        : 100;

      return { matchingSkills, missingSkills, matchPercentage };
    } catch (err) {
      console.warn("Neo4j calculateSkillGap error:", err);
      return { matchingSkills: [], missingSkills: targetSkills, matchPercentage: 0 };
    } finally {
      await session.close();
    }
  }

  /**
   * Save RLHF / Fine-Tuning feedback into the Neo4j Graph.
   */
  static async saveChatFeedback(feedback: ChatFeedbackGraphData): Promise<boolean> {
    const session = await getNeo4jSession();
    if (!session) return false;

    try {
      await session.run(
        `
        MERGE (f:ChatFeedback {id: $feedbackId})
        SET f.messageId = $messageId,
            f.sessionId = $sessionId,
            f.prompt = $prompt,
            f.response = $response,
            f.rating = $rating,
            f.isPositive = $isPositive,
            f.correction = $correction,
            f.tags = $tags,
            f.comments = $comments,
            f.timestamp = $timestamp,
            f.createdAt = datetime()
        WITH f
        OPTIONAL MATCH (u:User {id: $userId})
        FOREACH (_ IN CASE WHEN u IS NOT NULL THEN [1] ELSE [] END |
          MERGE (u)-[:SUBMITTED_FEEDBACK]->(f)
        )
        RETURN f
        `,
        {
          feedbackId: feedback.feedbackId,
          userId: feedback.userId || "anonymous",
          sessionId: feedback.sessionId || "default",
          messageId: feedback.messageId,
          prompt: feedback.prompt,
          response: feedback.response,
          rating: feedback.rating,
          isPositive: feedback.isPositive,
          correction: feedback.correction || "",
          tags: feedback.tags || [],
          comments: feedback.comments || "",
          timestamp: feedback.timestamp,
        }
      );

      return true;
    } catch (err) {
      console.warn("Neo4j saveChatFeedback error:", err);
      return false;
    } finally {
      await session.close();
    }
  }

  /**
   * Retrieve fine-tuning dataset pairs from Neo4j (for DPO / SFT training).
   */
  static async getFineTuningDataset(limit = 1000): Promise<Array<{
    prompt: string;
    chosen: string;
    rejected?: string;
    tags: string[];
    rating: number;
  }>> {
    const session = await getNeo4jSession();
    if (!session) return [];

    try {
      const result = await session.run(
        `
        MATCH (f:ChatFeedback)
        RETURN f.prompt AS prompt,
               f.response AS response,
               f.correction AS correction,
               f.isPositive AS isPositive,
               f.rating AS rating,
               f.tags AS tags
        ORDER BY f.timestamp DESC
        LIMIT $limit
        `,
        { limit }
      );

      return result.records.map((r) => {
        const isPositive = r.get("isPositive");
        const correction = r.get("correction");
        const response = r.get("response");
        const prompt = r.get("prompt");

        // If user provided a correction, correction is the 'chosen' (ideal) response
        // and response is the 'rejected' baseline.
        let chosen = response;
        let rejected: string | undefined = undefined;

        if (correction && correction.trim().length > 0) {
          chosen = correction;
          rejected = response;
        } else if (!isPositive) {
          rejected = response;
          chosen = "";
        }

        return {
          prompt,
          chosen,
          rejected,
          tags: r.get("tags") || [],
          rating: r.get("rating") || (isPositive ? 5 : 1),
        };
      });
    } catch (err) {
      console.warn("Neo4j getFineTuningDataset error:", err);
      return [];
    } finally {
      await session.close();
    }
  }
}
