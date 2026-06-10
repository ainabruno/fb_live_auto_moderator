import { audioTranscriptionService } from "./audioTranscription";
// import { CommentListener } from "./commentListener"; // Not used in this version
import { facebookReplyClient } from "./facebookReplyClient";
// import { getDb } from "./db"; // Not used in current version
import { classifyComment, generateResponse } from "./moderationEngine";

export interface AutomationState {
  sessionId: number;
  isRunning: boolean;
  isPaused: boolean;
  commentsProcessed: number;
  responsesGenerated: number;
  responsesSent: number;
  errors: string[];
  lastActivityTime: Date;
  currentTranscript: string;
}

export interface AutomationConfig {
  sessionId: number;
  pageId: string;
  accessToken: string;
  liveVideoId: string;
  autoApprove: boolean;
  responseDelay: number; // milliseconds
  maxRepliesPerMinute: number;
  enableAudioTranscription: boolean;
  enableAutoReply: boolean;
}

/**
 * Automation Orchestrator
 * Coordinates the entire end-to-end automation workflow:
 * 1. Captures and transcribes live audio
 * 2. Listens for incoming comments
 * 3. Analyzes comments against transcript
 * 4. Generates responses
 * 5. Posts replies automatically to Facebook
 */
export class AutomationOrchestrator {
  private automationStates: Map<number, AutomationState> = new Map();
  private automationConfigs: Map<number, AutomationConfig> = new Map();
  private replyQueues: Map<number, Array<{ commentId: string; message: string }>> = new Map();
  private replyProcessingIntervals: Map<number, NodeJS.Timeout> = new Map();

  /**
   * Start complete automation for a session
   */
  async startAutomation(config: AutomationConfig): Promise<AutomationState> {
    const { sessionId } = config;

    // Check if already running
    if (this.automationStates.has(sessionId)) {
      const state = this.automationStates.get(sessionId)!;
      if (state.isRunning) {
        return state;
      }
    }

    // Initialize state
    const state: AutomationState = {
      sessionId,
      isRunning: true,
      isPaused: false,
      commentsProcessed: 0,
      responsesGenerated: 0,
      responsesSent: 0,
      errors: [],
      lastActivityTime: new Date(),
      currentTranscript: "",
    };

    this.automationStates.set(sessionId, state);
    this.automationConfigs.set(sessionId, config);
    this.replyQueues.set(sessionId, []);

    // Start audio transcription if enabled
    if (config.enableAudioTranscription) {
      await audioTranscriptionService.startTranscription(sessionId);
    }

    // Start comment listening - handled by commentListener service in routers
    // The listener is managed per-session in the database

    // Start reply processing
    this.startReplyProcessing(sessionId, config);

    console.log(`[AutomationOrchestrator] Started automation for session ${sessionId}`);

    return state;
  }

  /**
   * Stop automation for a session
   */
  async stopAutomation(sessionId: number): Promise<AutomationState | null> {
    const state = this.automationStates.get(sessionId);
    if (!state) return null;

    state.isRunning = false;

    // Stop audio transcription
    await audioTranscriptionService.stopTranscription(sessionId);

    // Stop comment listening - handled by stopping the polling
    // The listener cleanup is managed in the database

    // Stop reply processing
    const interval = this.replyProcessingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.replyProcessingIntervals.delete(sessionId);
    }

    // Process remaining replies
    await this.processReplyQueue(sessionId);

    console.log(`[AutomationOrchestrator] Stopped automation for session ${sessionId}`);

    return state;
  }

  /**
   * Pause automation (can be resumed)
   */
  pauseAutomation(sessionId: number): boolean {
    const state = this.automationStates.get(sessionId);
    if (!state) return false;

    state.isPaused = true;
    return true;
  }

  /**
   * Resume automation
   */
  resumeAutomation(sessionId: number): boolean {
    const state = this.automationStates.get(sessionId);
    if (!state) return false;

    state.isPaused = false;
    return true;
  }

  /**
   * Process incoming comments and generate replies
   */
  async processComment(sessionId: number, commentData: any): Promise<void> {
    const state = this.automationStates.get(sessionId);
    const config = this.automationConfigs.get(sessionId);

    if (!state || !config || state.isPaused) return;

    try {
      // Get current transcript for context
      const transcriptSession = audioTranscriptionService.getSessionStatus(sessionId);
      const transcript = transcriptSession?.currentTranscript || "";
      state.currentTranscript = transcript;

      // Analyze comment
      const analysis = await classifyComment(commentData.message, transcript);

      state.commentsProcessed++;

      // Generate response if it's a question
      if (analysis.classification === "question" && config.enableAutoReply) {
        const responseResult = await generateResponse(
          commentData.message,
          transcript,
          "en"
        );

        if (responseResult && responseResult.response) {
          state.responsesGenerated++;

          // Queue reply for posting
          this.replyQueues.get(sessionId)?.push({
            commentId: commentData.facebookCommentId,
            message: responseResult.response,
          });
        }
      }

      state.lastActivityTime = new Date();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      state.errors.push(`Error processing comment: ${errorMsg}`);
      console.error(`[AutomationOrchestrator] Error processing comment:`, error);
    }
  }

  /**
   * Start processing reply queue
   */
  private startReplyProcessing(sessionId: number, config: AutomationConfig): void {
    const interval = setInterval(async () => {
      await this.processReplyQueue(sessionId);
    }, config.responseDelay || 1000);

    this.replyProcessingIntervals.set(sessionId, interval);
  }

  /**
   * Process queued replies and post to Facebook
   */
  private async processReplyQueue(sessionId: number): Promise<void> {
    const state = this.automationStates.get(sessionId);
    const config = this.automationConfigs.get(sessionId);
    const queue = this.replyQueues.get(sessionId);

    if (!state || !config || !queue || queue.length === 0) return;

    try {
      // Get replies to post (respecting rate limit)
      const maxPerMinute = config.maxRepliesPerMinute || 10;
      const repliesToPost = queue.splice(0, Math.ceil(maxPerMinute / 60));

      // Post replies to Facebook
      for (const reply of repliesToPost) {
        try {
          const result = await facebookReplyClient.postReplyToComment({
            commentId: reply.commentId,
            message: reply.message,
            accessToken: config.accessToken,
          });

          if (result.success) {
            state.responsesSent++;

            // Log to database
            console.log(
              `[AutomationOrchestrator] Posted reply to comment ${reply.commentId}`
            );
          } else {
            state.errors.push(`Failed to post reply: ${result.error}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error";
          state.errors.push(`Error posting reply: ${errorMsg}`);
        }
      }

      state.lastActivityTime = new Date();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      state.errors.push(`Error processing reply queue: ${errorMsg}`);
      console.error(`[AutomationOrchestrator] Error processing reply queue:`, error);
    }
  }

  /**
   * Get automation state
   */
  getState(sessionId: number): AutomationState | null {
    return this.automationStates.get(sessionId) || null;
  }

  /**
   * Get all active automations
   */
  getActiveAutomations(): AutomationState[] {
    return Array.from(this.automationStates.values()).filter((s) => s.isRunning);
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: number): void {
    const interval = this.replyProcessingIntervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.replyProcessingIntervals.delete(sessionId);
    }

    this.automationStates.delete(sessionId);
    this.automationConfigs.delete(sessionId);
    this.replyQueues.delete(sessionId);
  }
}

// Export singleton instance
export const automationOrchestrator = new AutomationOrchestrator();
