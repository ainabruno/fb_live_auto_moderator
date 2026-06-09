import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Moderation sessions for Facebook Live streams.
 * Tracks active moderation sessions with FB credentials and context.
 */
export const moderationSessions = mysqlTable(
  "moderation_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    facebookPageId: varchar("facebookPageId", { length: 255 }).notNull(),
    facebookAccessToken: text("facebookAccessToken").notNull(), // Encrypted in practice
    liveVideoId: varchar("liveVideoId", { length: 255 }),
    liveContext: text("liveContext"), // Live topic/transcript
    isActive: boolean("isActive").default(true).notNull(),
    isListening: boolean("isListening").default(false).notNull(), // Is polling for comments
    lastCommentFetchTime: timestamp("lastCommentFetchTime"), // Last time we fetched comments
    totalCommentsReceived: int("totalCommentsReceived").default(0).notNull(),
    totalResponsesSent: int("totalResponsesSent").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type ModerationSession = typeof moderationSessions.$inferSelect;
export type InsertModerationSession = typeof moderationSessions.$inferInsert;

/**
 * Facebook Live comments to be moderated.
 * Stores comment data, classification, and priority.
 */
export const comments = mysqlTable(
  "comments",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull(),
    facebookCommentId: varchar("facebookCommentId", { length: 255 }).notNull().unique(),
    userName: varchar("userName", { length: 255 }).notNull(),
    message: text("message").notNull(),
    detectedLanguage: varchar("detectedLanguage", { length: 10 }).default("en"), // en, mg, fr
    classification: mysqlEnum("classification", ["question", "gratitude", "spam", "off_topic"]).notNull(),
    classificationConfidence: decimal("classificationConfidence", { precision: 3, scale: 2 }), // 0-1
    priority: int("priority").default(0).notNull(), // Higher = more priority
    isSpam: boolean("isSpam").default(false).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "sent"]).default("pending").notNull(),
    responseId: int("responseId"),
    facebookTimestamp: timestamp("facebookTimestamp"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index("sessionId_idx").on(table.sessionId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Generated responses to comments.
 * Stores AI-generated responses and their status.
 */
export const generatedResponses = mysqlTable(
  "generated_responses",
  {
    id: int("id").autoincrement().primaryKey(),
    commentId: int("commentId").notNull(),
    sessionId: int("sessionId").notNull(),
    responseText: text("responseText").notNull(),
    responseLanguage: varchar("responseLanguage", { length: 10 }).notNull(), // en, mg, fr
    isGroundedInContext: boolean("isGroundedInContext").default(true).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "sent", "failed"]).default("pending").notNull(),
    sentToFacebook: boolean("sentToFacebook").default(false).notNull(),
    facebookResponseId: varchar("facebookResponseId", { length: 255 }),
    approvedBy: int("approvedBy"), // User ID who approved
    approvedAt: timestamp("approvedAt"),
    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    commentIdIdx: index("commentId_idx").on(table.commentId),
    sessionIdIdx: index("sessionId_idx").on(table.sessionId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type GeneratedResponse = typeof generatedResponses.$inferSelect;
export type InsertGeneratedResponse = typeof generatedResponses.$inferInsert;

/**
 * Moderation settings per user.
 * Stores spam filters, response delays, and other preferences.
 */
export const moderationSettings = mysqlTable(
  "moderation_settings",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    autoApproveResponses: boolean("autoApproveResponses").default(false).notNull(),
    responseDelaySeconds: int("responseDelaySeconds").default(0).notNull(),
    maxRepliesPerMinute: int("maxRepliesPerMinute").default(10).notNull(),
    spamFilterEnabled: boolean("spamFilterEnabled").default(true).notNull(),
    blockedKeywords: text("blockedKeywords"), // JSON array of keywords
    enableMalagasy: boolean("enableMalagasy").default(true).notNull(),
    enableFrench: boolean("enableFrench").default(true).notNull(),
    enableEnglish: boolean("enableEnglish").default(true).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
  })
);

export type ModerationSetting = typeof moderationSettings.$inferSelect;
export type InsertModerationSetting = typeof moderationSettings.$inferInsert;

/**
 * Response history and audit log.
 * Tracks all sent responses for analytics and compliance.
 */
export const responseHistory = mysqlTable(
  "response_history",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull(),
    commentId: int("commentId").notNull(),
    responseId: int("responseId").notNull(),
    originalMessage: text("originalMessage").notNull(),
    generatedResponse: text("generatedResponse").notNull(),
    sentResponse: text("sentResponse"), // May differ from generated if manually edited
    status: mysqlEnum("status", ["sent", "rejected", "failed"]).notNull(),
    responseLanguage: varchar("responseLanguage", { length: 10 }).notNull(),
    sentAt: timestamp("sentAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index("sessionId_idx").on(table.sessionId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type ResponseHistory = typeof responseHistory.$inferSelect;
export type InsertResponseHistory = typeof responseHistory.$inferInsert;