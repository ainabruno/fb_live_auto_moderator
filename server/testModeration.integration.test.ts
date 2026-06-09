import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import * as moderationEngine from "./moderationEngine";

/**
 * Integration tests for the testModeration procedure
 * Tests the actual procedure with mocked dependencies
 */
describe("testModeration Procedure Integration", () => {
  const mockUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const mockContext = {
    user: mockUser,
    req: { protocol: "https", headers: {} } as any,
    res: {} as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Question Classification", () => {
    it("should classify and prioritize questions about live topic", async () => {
      // Mock settings
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock language detection
      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      // Mock classification
      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.92,
        priority: 85,
      });

      // Mock response generation
      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Great question! The answer is...",
        isGroundedInContext: true,
        language: "en",
        confidence: 0.88,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "How much does this cost?",
        liveContext: "We are discussing product pricing",
      });

      expect(result.classification.type).toBe("question");
      expect(result.priority.level).toBe("critical"); // 85 >= 80
      expect(result.response).toBeTruthy();
      expect(result.wouldAutoApprove).toBe(true);
    });
  });

  describe("Gratitude Classification", () => {
    it("should classify positive feedback as gratitude", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "gratitude",
        confidence: 0.89,
        priority: 45,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Thank you so much! We appreciate your support.",
        isGroundedInContext: true,
        language: "en",
        confidence: 0.85,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "This is amazing! Thank you!",
      });

      expect(result.classification.type).toBe("gratitude");
      expect(result.priority.level).toBe("medium");
    });
  });

  describe("Spam Detection", () => {
    it("should detect and block spam comments", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: JSON.stringify(["viagra", "casino", "lottery"]),
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "spam",
        confidence: 0.95,
        priority: 0,
      });

      vi.spyOn(moderationEngine, "checkSpamKeywords").mockReturnValue(true);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "Buy viagra now! Click here for casino games!",
      });

      expect(result.isSpam).toBe(true);
      expect(result.response).toBeNull();
      expect(result.wouldAutoApprove).toBe(false);
    });
  });

  describe("Off-Topic Classification", () => {
    it("should classify unrelated comments as off-topic", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "off_topic",
        confidence: 0.87,
        priority: 15,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Thanks for watching! Please stay on topic.",
        isGroundedInContext: true,
        language: "en",
        confidence: 0.72,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "Did you see the game last night?",
        liveContext: "We are discussing web development",
      });

      expect(result.classification.type).toBe("off_topic");
      expect(result.priority.level).toBe("low");
    });
  });

  describe("Language Detection", () => {
    it("should detect and respond in French", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "fr",
        confidence: 0.93,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.90,
        priority: 80,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Merci pour votre question! La réponse est...",
        isGroundedInContext: true,
        language: "fr",
        confidence: 0.86,
      });

      vi.spyOn(moderationEngine, "checkSpamKeywords").mockReturnValue(false);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "Combien coûte ce produit?",
      });

      expect(result.detectedLanguage).toBe("fr");
      expect(result.languageEnabled).toBe(true);
      expect(result.response).toBeTruthy();
    });

    it("should detect and respond in Malagasy", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "mg",
        confidence: 0.91,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.88,
        priority: 82,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Misaotra ny fanontanianao! Ny valiny dia...",
        isGroundedInContext: true,
        language: "mg",
        confidence: 0.84,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "Ohatrinona ny vidin'ity?",
      });

      expect(result.detectedLanguage).toBe("mg");
      expect(result.languageEnabled).toBe(true);
    });
  });

  describe("Language Settings Respect", () => {
    it("should not respond when language is disabled", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: false, // Malagasy disabled
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "mg",
        confidence: 0.92,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.90,
        priority: 85,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "Ohatrinona ny vidin'ity?",
      });

      expect(result.detectedLanguage).toBe("mg");
      expect(result.languageEnabled).toBe(false);
      expect(result.response).toBeNull();
      expect(result.wouldAutoApprove).toBe(false);
    });
  });

  describe("Auto-Approval Logic", () => {
    it("should auto-approve high-confidence responses when enabled", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.92,
        priority: 85,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Here is the answer...",
        isGroundedInContext: true,
        language: "en",
        confidence: 0.88, // High confidence
      });

      vi.spyOn(moderationEngine, "checkSpamKeywords").mockReturnValue(false);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "How does this work?",
      });

      // wouldAutoApprove requires response !== null and confidence >= 0.7
      expect(result.response).toBeTruthy();
      expect(result.wouldAutoApprove).toBe(true);
    });

    it("should not auto-approve low-confidence responses", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.85,
        priority: 70,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Maybe the answer is...",
        isGroundedInContext: false,
        language: "en",
        confidence: 0.55, // Low confidence
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "What about edge cases?",
      });

      expect(result.wouldAutoApprove).toBe(false);
    });

    it("should not auto-approve when auto-approval is disabled", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: false, // Auto-approval disabled
        responseDelaySeconds: 5,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.92,
        priority: 85,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Here is the answer...",
        isGroundedInContext: true,
        language: "en",
        confidence: 0.88,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "How does this work?",
      });

      expect(result.wouldAutoApprove).toBe(false);
    });
  });

  describe("Settings Reflection", () => {
    it("should include current settings in response", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 5,
        maxRepliesPerMinute: 15,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      vi.spyOn(moderationEngine, "classifyComment").mockResolvedValue({
        classification: "question",
        confidence: 0.90,
        priority: 80,
      });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Here is the answer...",
        isGroundedInContext: true,
        language: "en",
        confidence: 0.85,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.moderation.testModeration({
        sampleComment: "Test comment",
      });

      expect(result.settings.autoApproveEnabled).toBe(true);
      expect(result.settings.responseDelaySeconds).toBe(5);
      expect(result.settings.maxRepliesPerMinute).toBe(15);
      expect(result.settings.spamFilterEnabled).toBe(true);
    });
  });

  describe("Context Awareness", () => {
    it("should use live context for better classification", async () => {
      vi.spyOn(db, "getModerationSettings").mockResolvedValue({
        userId: 1,
        autoApproveResponses: true,
        responseDelaySeconds: 0,
        maxRepliesPerMinute: 10,
        spamFilterEnabled: true,
        blockedKeywords: "[]",
        enableMalagasy: true,
        enableFrench: true,
        enableEnglish: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      vi.spyOn(moderationEngine, "detectLanguage").mockResolvedValue({
        language: "en",
        confidence: 0.95,
      });

      const classifyCommentSpy = vi
        .spyOn(moderationEngine, "classifyComment")
        .mockResolvedValue({
          classification: "question",
          confidence: 0.92,
          priority: 85,
        });

      vi.spyOn(moderationEngine, "generateResponse").mockResolvedValue({
        response: "Great question about pricing!",
        isGroundedInContext: true,
        language: "en",
        confidence: 0.88,
      });

      const caller = appRouter.createCaller(mockContext);
      await caller.moderation.testModeration({
        sampleComment: "How much?",
        liveContext: "We are discussing product pricing today",
      });

      // Verify that classifyComment was called with the context
      expect(classifyCommentSpy).toHaveBeenCalledWith(
        "How much?",
        "We are discussing product pricing today"
      );
    });
  });
});
