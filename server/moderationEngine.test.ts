import { describe, it, expect, vi } from "vitest";
import {
  checkSpamKeywords,
  calculatePriority,
  shouldAutoApprove,
} from "./moderationEngine";

describe("Moderation Engine", () => {
  describe("checkSpamKeywords", () => {
    it("should detect spam keywords in text", () => {
      const blockedKeywords = ["buy now", "click here", "limited offer"];
      const text = "BUY NOW and get 50% off!";

      const result = checkSpamKeywords(text, blockedKeywords);
      expect(result).toBe(true);
    });

    it("should be case-insensitive", () => {
      const blockedKeywords = ["SPAM"];
      const text = "This is spam content";

      const result = checkSpamKeywords(text, blockedKeywords);
      expect(result).toBe(true);
    });

    it("should return false when no keywords match", () => {
      const blockedKeywords = ["buy now", "click here"];
      const text = "This is a legitimate question about the topic";

      const result = checkSpamKeywords(text, blockedKeywords);
      expect(result).toBe(false);
    });

    it("should handle empty keyword list", () => {
      const result = checkSpamKeywords("any text", []);
      expect(result).toBe(false);
    });

    it("should handle undefined keyword list", () => {
      const result = checkSpamKeywords("any text", undefined as any);
      expect(result).toBe(false);
    });
  });

  describe("calculatePriority", () => {
    it("should give highest priority to questions", () => {
      const questionPriority = calculatePriority("question", 0.9, false);
      const gratitudePriority = calculatePriority("gratitude", 0.9, false);

      expect(questionPriority).toBeGreaterThan(gratitudePriority);
    });

    it("should give lowest priority to spam", () => {
      const spamPriority = calculatePriority("spam", 0.9, true);
      const questionPriority = calculatePriority("question", 0.5, false);

      expect(spamPriority).toBeLessThan(questionPriority);
    });

    it("should boost priority with higher confidence", () => {
      const highConfidence = calculatePriority("question", 0.9, false);
      const lowConfidence = calculatePriority("question", 0.5, false);

      expect(highConfidence).toBeGreaterThan(lowConfidence);
    });

    it("should give negative priority for spam", () => {
      const spamPriority = calculatePriority("spam", 0.9, true);
      expect(spamPriority).toBeLessThan(0);
    });

    it("should rank off-topic lower than gratitude", () => {
      const offTopicPriority = calculatePriority("off_topic", 0.8, false);
      const gratitudePriority = calculatePriority("gratitude", 0.8, false);

      expect(offTopicPriority).toBeLessThan(gratitudePriority);
    });
  });

  describe("shouldAutoApprove", () => {
    it("should return false when autoApprove is disabled", () => {
      const result = shouldAutoApprove(false, true, 0.9);
      expect(result).toBe(false);
    });

    it("should return false when response is not grounded in context", () => {
      const result = shouldAutoApprove(true, false, 0.9);
      expect(result).toBe(false);
    });

    it("should return false when confidence is too low", () => {
      const result = shouldAutoApprove(true, true, 0.6);
      expect(result).toBe(false);
    });

    it("should return true when all conditions are met", () => {
      const result = shouldAutoApprove(true, true, 0.8);
      expect(result).toBe(true);
    });

    it("should require minimum confidence of 0.7", () => {
      const justBelow = shouldAutoApprove(true, true, 0.69);
      const justAbove = shouldAutoApprove(true, true, 0.71);

      expect(justBelow).toBe(false);
      expect(justAbove).toBe(true);
    });
  });
});
