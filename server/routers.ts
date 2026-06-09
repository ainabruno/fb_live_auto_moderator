import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import {
  detectLanguage,
  classifyComment,
  generateResponse,
  checkSpamKeywords,
  calculatePriority,
  shouldAutoApprove,
} from "./moderationEngine";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  moderation: router({
    // Moderation Sessions
    createSession: protectedProcedure
      .input(
        z.object({
          facebookPageId: z.string().min(1),
          facebookAccessToken: z.string().min(1),
          liveVideoId: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const result = await db.createModerationSession({
          userId: ctx.user!.id,
          facebookPageId: input.facebookPageId,
          facebookAccessToken: input.facebookAccessToken,
          liveVideoId: input.liveVideoId,
          isActive: true,
        });
        return result;
      }),

    getActiveSession: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveModerationSession(ctx.user!.id);
    }),

    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getModerationSessionById(input.sessionId);
      }),

    updateContext: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          liveContext: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updateModerationSessionContext(
          input.sessionId,
          input.liveContext
        );
      }),

    endSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deactivateModerationSession(input.sessionId);
      }),

    // Comments
    addComment: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          facebookCommentId: z.string(),
          userName: z.string(),
          message: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Detect language
        const languageResult = await detectLanguage(input.message);

        // Get moderation settings
        const settings = await db.getModerationSettings(ctx.user!.id);
        const blockedKeywords = settings?.blockedKeywords
          ? JSON.parse(settings.blockedKeywords)
          : [];

        // Check for spam
        const isSpam = checkSpamKeywords(input.message, blockedKeywords);

        // Classify comment
        const session = await db.getModerationSessionById(input.sessionId);
        const liveContext = session?.liveContext || "";
        const classificationResult = await classifyComment(
          input.message,
          liveContext
        );

        // Calculate priority
        const priority = calculatePriority(
          classificationResult.classification,
          classificationResult.confidence,
          isSpam
        );

        // Create comment
        const result = await db.createComment({
          sessionId: input.sessionId,
          facebookCommentId: input.facebookCommentId,
          userName: input.userName,
          message: input.message,
          detectedLanguage: languageResult.language,
          classification: classificationResult.classification,
          classificationConfidence: classificationResult.confidence as any,
          priority,
          isSpam,
          status: "pending",
        });

        return result;
      }),

    getComments: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ input }) => {
        return await db.getSessionComments(input.sessionId, input.limit);
      }),

    getPendingComments: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPendingComments(input.sessionId);
      }),

    // Generated Responses
    generateCommentResponse: protectedProcedure
      .input(
        z.object({
          commentId: z.number(),
          sessionId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get comment
        const comments = await db.getSessionComments(input.sessionId, 1000);
        const comment = comments.find((c) => c.id === input.commentId);

        if (!comment) {
          throw new Error("Comment not found");
        }

        // Get session for context
        const session = await db.getModerationSessionById(input.sessionId);
        const liveContext = session?.liveContext || "";

        // Generate response
        const responseResult = await generateResponse(
          comment.message,
          liveContext,
          comment.detectedLanguage as any
        );

        // Get user settings for auto-approve
        const settings = await db.getModerationSettings(ctx.user!.id);
        const shouldAutoApproveResponse = shouldAutoApprove(
          settings?.autoApproveResponses || false,
          responseResult.isGroundedInContext,
          responseResult.confidence
        );

        // Create response
        await db.createGeneratedResponse({
          commentId: input.commentId,
          sessionId: input.sessionId,
          responseText: responseResult.response,
          responseLanguage: responseResult.language,
          isGroundedInContext: responseResult.isGroundedInContext,
          status: shouldAutoApproveResponse ? "approved" : "pending",
          approvedBy: shouldAutoApproveResponse ? ctx.user!.id : undefined,
          approvedAt: shouldAutoApproveResponse ? new Date() : undefined,
        });

        return {
          ...responseResult,
          autoApproved: shouldAutoApproveResponse,
        };
      }),

    getCommentResponse: protectedProcedure
      .input(z.object({ commentId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCommentResponse(input.commentId);
      }),

    approveResponse: protectedProcedure
      .input(
        z.object({
          responseId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await db.updateResponseStatus(
          input.responseId,
          "approved",
          ctx.user!.id
        );
      }),

    rejectResponse: protectedProcedure
      .input(
        z.object({
          responseId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        return await db.updateResponseStatus(input.responseId, "rejected");
      }),

    sendResponse: protectedProcedure
      .input(
        z.object({
          responseId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        // In production, this would send to Facebook API
        return await db.updateResponseStatus(input.responseId, "sent");
      }),

    getPendingResponses: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPendingResponses(input.sessionId);
      }),

    getSessionResponses: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          limit: z.number().default(50),
        })
      )
      .query(async ({ input }) => {
        return await db.getSessionResponses(input.sessionId, input.limit);
      }),

    // Moderation Settings
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      return await db.getModerationSettings(ctx.user!.id);
    }),

    updateSettings: protectedProcedure
      .input(
        z.object({
          autoApproveResponses: z.boolean().optional(),
          responseDelaySeconds: z.number().optional(),
          maxRepliesPerMinute: z.number().optional(),
          spamFilterEnabled: z.boolean().optional(),
          blockedKeywords: z.array(z.string()).optional(),
          enableMalagasy: z.boolean().optional(),
          enableFrench: z.boolean().optional(),
          enableEnglish: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const blockedKeywordsJson = input.blockedKeywords
          ? JSON.stringify(input.blockedKeywords)
          : undefined;

        return await db.createOrUpdateModerationSettings({
          userId: ctx.user!.id,
          autoApproveResponses: input.autoApproveResponses,
          responseDelaySeconds: input.responseDelaySeconds,
          maxRepliesPerMinute: input.maxRepliesPerMinute,
          spamFilterEnabled: input.spamFilterEnabled,
          blockedKeywords: blockedKeywordsJson,
          enableMalagasy: input.enableMalagasy,
          enableFrench: input.enableFrench,
          enableEnglish: input.enableEnglish,
        });
      }),

    // Response History
    getResponseHistory: protectedProcedure
      .input(
        z.object({
          sessionId: z.number(),
          limit: z.number().default(100),
        })
      )
      .query(async ({ input }) => {
        return await db.getSessionResponseHistory(input.sessionId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
