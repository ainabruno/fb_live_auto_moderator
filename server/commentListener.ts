/**
 * Comment Listener Service
 * Polls Facebook Live for new comments and processes them through the moderation engine
 */

import { createFacebookClient, FacebookClient } from "./facebookClient";
import * as db from "./db";
import {
  classifyComment,
  generateResponse,
  detectLanguage,
  checkSpamKeywords,
} from "./moderationEngine";
import { ModerationSession } from "../drizzle/schema";

interface ListenerOptions {
  pollIntervalSeconds?: number;
  maxCommentsPerPoll?: number;
}

/**
 * Comment Listener for a moderation session
 */
export class CommentListener {
  private session: ModerationSession;
  private facebookClient: FacebookClient;
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private lastCursor: string | null = null;
  private options: Required<ListenerOptions>;

  constructor(
    session: ModerationSession,
    options: ListenerOptions = {}
  ) {
    this.session = session;
    this.facebookClient = createFacebookClient(session.facebookAccessToken);
    this.options = {
      pollIntervalSeconds: options.pollIntervalSeconds || 3,
      maxCommentsPerPoll: options.maxCommentsPerPoll || 50,
    };
  }

  /**
   * Start listening for comments
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log(`[CommentListener] Already running for session ${this.session.id}`);
      return;
    }

    this.isRunning = true;
    console.log(
      `[CommentListener] Starting for session ${this.session.id}, video ${this.session.liveVideoId}`
    );

      // Update session to mark as listening
      // Note: updateModerationSessionContext only updates liveContext, would need a generic update
      // TODO: Add generic update function for moderation_sessions

    // Start polling
    this.pollInterval = setInterval(
      () => this.pollComments(),
      this.options.pollIntervalSeconds * 1000
    );

    // Do an immediate poll
    await this.pollComments();
  }

  /**
   * Stop listening for comments
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log(`[CommentListener] Not running for session ${this.session.id}`);
      return;
    }

    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    console.log(`[CommentListener] Stopped for session ${this.session.id}`);

    // Update session to mark as not listening
    // Note: updateModerationSessionContext only updates liveContext, would need a generic update
    // TODO: Add generic update function for moderation_sessions
  }

  /**
   * Poll for new comments
   */
  private async pollComments(): Promise<void> {
    try {
      if (!this.session.liveVideoId) {
        console.warn(
          `[CommentListener] No liveVideoId for session ${this.session.id}`
        );
        return;
      }

      // Fetch comments from Facebook
      const response = await this.facebookClient.getLiveComments(
        this.session.liveVideoId,
        this.lastCursor || undefined
      );

      const comments = response.data || [];
      console.log(
        `[CommentListener] Fetched ${comments.length} comments for session ${this.session.id}`
      );

      // Process each comment
      for (const fbComment of comments) {
        await this.processComment(fbComment);
      }

      // Update cursor for next poll
      if (response.paging?.cursors?.after) {
        this.lastCursor = response.paging.cursors.after;
      }

      // Update last fetch time
      // Note: updateModerationSessionContext only updates liveContext, would need a generic update
      // TODO: Add generic update function for moderation_sessions
    } catch (error) {
      console.error(`[CommentListener] Error polling comments:`, error);
    }
  }

  /**
   * Process a single comment
   */
  private async processComment(fbComment: any): Promise<void> {
    try {
      // Check if comment already exists
      const existingComment = await db.getCommentByFacebookId(fbComment.id);
      if (existingComment) {
        console.log(`[CommentListener] Comment ${fbComment.id} already processed`);
        return;
      }

      // Detect language
      const languageResult = await detectLanguage(fbComment.message);
      const detectedLanguage = languageResult.language;

      // Classify comment
      const classificationResult = await classifyComment(
        fbComment.message,
        this.session.liveContext || ""
      );

      // Check for spam
      const settings = await db.getModerationSettings(this.session.userId);
      const blockedKeywords = settings?.blockedKeywords ? JSON.parse(settings.blockedKeywords) : [];
      const isSpam =
        settings?.spamFilterEnabled &&
        checkSpamKeywords(fbComment.message, blockedKeywords);

      // Store comment in database
      const commentResult = await db.createComment({
        sessionId: this.session.id,
        facebookCommentId: fbComment.id,
        userName: fbComment.from?.name || "Unknown",
        message: fbComment.message,
        detectedLanguage,
        classification: classificationResult.classification,
        classificationConfidence: classificationResult.confidence as any,
        priority: classificationResult.priority,
        isSpam,
        status: "pending",
        facebookTimestamp: new Date(fbComment.created_time),
      });

      const commentId = ((commentResult as any).insertId as number) || 0;

      console.log(
        `[CommentListener] Stored comment ${fbComment.id} as ${classificationResult.classification}`
      );

      // Generate response if not spam and language is enabled
      const languageEnabled =
        (detectedLanguage === "en" && settings?.enableEnglish) ||
        (detectedLanguage === "fr" && settings?.enableFrench) ||
        (detectedLanguage === "mg" && settings?.enableMalagasy);

      if (!isSpam && languageEnabled) {
        const responseResult = await generateResponse(
          fbComment.message,
          this.session.liveContext || "",
          detectedLanguage
        );

        if (responseResult.response) {
          const responseResultDb = await db.createGeneratedResponse({
            commentId: commentId,
            sessionId: this.session.id,
            responseText: responseResult.response,
            responseLanguage: responseResult.language,
            isGroundedInContext: responseResult.isGroundedInContext,
            status: "pending" as any,
          });

          const responseId = (responseResultDb as any).insertId || 0;

          console.log(
            `[CommentListener] Generated response ${responseId} for comment ${fbComment.id}`
          );

          // Check if should auto-approve and send
          const shouldAutoApprove =
            settings?.autoApproveResponses &&
            (responseResult.confidence || 0) >= 0.7 &&
            responseResult.isGroundedInContext;

          if (shouldAutoApprove) {
            await this.sendResponse(responseId, fbComment.id);
          }
        }
      }

      // Update session statistics - would need a generic update function
      // TODO: Add generic update function for moderation_sessions to update totalCommentsReceived
    } catch (error) {
      console.error(`[CommentListener] Error processing comment:`, error);
    }
  }

  /**
   * Send a response to Facebook
   */
  private async sendResponse(
    responseId: number,
    facebookCommentId: string
  ): Promise<void> {
    try {
      const response = await db.getGeneratedResponse(responseId);
      if (!response) {
        console.warn(`[CommentListener] Response ${responseId} not found`);
        return;
      }

      // Post reply to Facebook
      const fbResponse = await this.facebookClient.replyToComment(
        facebookCommentId,
        response.responseText
      );

      // Update response status
      await db.updateResponseStatus(responseId, "sent");

      console.log(
        `[CommentListener] Sent response ${responseId} to Facebook as ${fbResponse.id}`
      );

      // Update session statistics - would need a generic update function
      // TODO: Add generic update function for moderation_sessions to update totalResponsesSent
    } catch (error) {
      console.error(`[CommentListener] Error sending response:`, error);

      // Mark response as failed
      await db.updateResponseStatus(responseId, "failed");
    }
  }

  /**
   * Check if listener is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Global listener registry
 */
const listeners = new Map<number, CommentListener>();

/**
 * Start listening for a session
 */
export async function startSessionListener(
  session: ModerationSession,
  options?: ListenerOptions
): Promise<CommentListener> {
  const existing = listeners.get(session.id);
  if (existing?.isActive()) {
    console.log(`[CommentListener] Listener already running for session ${session.id}`);
    return existing;
  }

  const listener = new CommentListener(session, options);
  await listener.start();
  listeners.set(session.id, listener);

  return listener;
}

/**
 * Stop listening for a session
 */
export async function stopSessionListener(sessionId: number): Promise<void> {
  const listener = listeners.get(sessionId);
  if (listener) {
    await listener.stop();
    listeners.delete(sessionId);
  }
}

/**
 * Get listener for a session
 */
export function getSessionListener(sessionId: number): CommentListener | undefined {
  return listeners.get(sessionId);
}

/**
 * Stop all listeners
 */
export async function stopAllListeners(): Promise<void> {
  const entries = Array.from(listeners.entries());
  for (const [sessionId, listener] of entries) {
    await listener.stop();
    listeners.delete(sessionId);
  }
}
