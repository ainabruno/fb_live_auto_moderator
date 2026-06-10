import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  moderationSessions,
  comments,
  generatedResponses,
  moderationSettings,
  responseHistory,
  InsertComment,
  InsertGeneratedResponse,
  InsertModerationSession,
  InsertModerationSetting,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Moderation Sessions
export async function createModerationSession(
  session: InsertModerationSession
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(moderationSessions).values(session);
  return result;
}

export async function getActiveModerationSession(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(moderationSessions)
    .where(
      and(
        eq(moderationSessions.userId, userId),
        eq(moderationSessions.isActive, true)
      )
    )
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getModerationSessionById(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(moderationSessions)
    .where(eq(moderationSessions.id, sessionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateModerationSessionContext(
  sessionId: number,
  liveContext: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(moderationSessions)
    .set({ liveContext, updatedAt: new Date() })
    .where(eq(moderationSessions.id, sessionId));
}

export async function deactivateModerationSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(moderationSessions)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(moderationSessions.id, sessionId));
}

// Comments
export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(comments).values(comment);
  return result;
}

export async function getSessionComments(sessionId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(comments)
    .where(eq(comments.sessionId, sessionId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function getPendingComments(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.sessionId, sessionId),
        eq(comments.status, "pending")
      )
    )
    .orderBy(desc(comments.createdAt));
}

export async function updateCommentStatus(
  commentId: number,
  status: "pending" | "approved" | "rejected" | "sent"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(comments)
    .set({ status, updatedAt: new Date() })
    .where(eq(comments.id, commentId));
}

export async function updateCommentClassification(
  commentId: number,
  classification: "question" | "gratitude" | "spam" | "off_topic",
  confidence: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(comments)
    .set({
      classification,
      classificationConfidence: confidence as any,
      updatedAt: new Date(),
    })
    .where(eq(comments.id, commentId));
}

export async function updateCommentLanguage(
  commentId: number,
  language: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .update(comments)
    .set({ detectedLanguage: language, updatedAt: new Date() })
    .where(eq(comments.id, commentId));
}

// Generated Responses
export async function createGeneratedResponse(
  response: InsertGeneratedResponse
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(generatedResponses).values(response);
  return result;
}

export async function getCommentByFacebookId(facebookCommentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.facebookCommentId, facebookCommentId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getCommentResponse(commentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(generatedResponses)
    .where(eq(generatedResponses.commentId, commentId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getGeneratedResponse(responseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(generatedResponses)
    .where(eq(generatedResponses.id, responseId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateResponseStatus(
  responseId: number,
  status: "pending" | "approved" | "rejected" | "sent" | "failed",
  approvedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const updateData: any = { status, updatedAt: new Date() };
  if (approvedBy) {
    updateData.approvedBy = approvedBy;
    updateData.approvedAt = new Date();
  }
  return await db
    .update(generatedResponses)
    .set(updateData)
    .where(eq(generatedResponses.id, responseId));
}

export async function getPendingResponses(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(generatedResponses)
    .where(
      and(
        eq(generatedResponses.sessionId, sessionId),
        eq(generatedResponses.status, "pending")
      )
    )
    .orderBy(desc(generatedResponses.createdAt));
}

export async function getSessionResponses(
  sessionId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(generatedResponses)
    .where(eq(generatedResponses.sessionId, sessionId))
    .orderBy(desc(generatedResponses.createdAt))
    .limit(limit);
}

// Moderation Settings
export async function getModerationSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(moderationSettings)
    .where(eq(moderationSettings.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateModerationSettings(
  settings: InsertModerationSetting
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .insert(moderationSettings)
    .values(settings)
    .onDuplicateKeyUpdate({
      set: settings,
    });
}

export async function createResponseHistory(history: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(responseHistory).values(history);
}

export async function getSessionResponseHistory(
  sessionId: number,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(responseHistory)
    .where(eq(responseHistory.sessionId, sessionId))
    .orderBy(desc(responseHistory.createdAt))
    .limit(limit);
}

export async function getUserModerationSessions(
  userId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(moderationSessions)
    .where(eq(moderationSessions.userId, userId))
    .orderBy(desc(moderationSessions.createdAt))
    .limit(limit);
}

export async function getSessionResponsesWithComments(
  sessionId: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  // Get all responses for the session
  const responses = await db
    .select()
    .from(generatedResponses)
    .where(eq(generatedResponses.sessionId, sessionId))
    .orderBy(desc(generatedResponses.createdAt))
    .limit(limit);

  // For each response, get the corresponding comment
  const responsesWithComments = await Promise.all(
    responses.map(async (response: any) => {
      const comment = await db
        .select()
        .from(comments)
        .where(eq(comments.id, response.commentId))
        .limit(1);

      return {
        ...response,
        comment: comment.length > 0 ? comment[0] : null,
      };
    })
  );

  return responsesWithComments;
}
