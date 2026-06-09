import { describe, it, expect } from "vitest";

/**
 * Tests for comment filtering logic
 */
describe("Comment Filtering", () => {
  const mockComments = [
    {
      id: 1,
      message: "What is the price?",
      classification: "question",
      priority: 85,
      isSpam: false,
      detectedLanguage: "en",
      createdAt: new Date(),
    },
    {
      id: 2,
      message: "Thank you so much!",
      classification: "gratitude",
      priority: 30,
      isSpam: false,
      detectedLanguage: "en",
      createdAt: new Date(),
    },
    {
      id: 3,
      message: "BUY NOW CLICK HERE!!!",
      classification: "spam",
      priority: 10,
      isSpam: true,
      detectedLanguage: "en",
      createdAt: new Date(),
    },
    {
      id: 4,
      message: "Random off-topic message",
      classification: "off_topic",
      priority: 15,
      isSpam: false,
      detectedLanguage: "en",
      createdAt: new Date(),
    },
    {
      id: 5,
      message: "How does this work?",
      classification: "question",
      priority: 75,
      isSpam: false,
      detectedLanguage: "fr",
      createdAt: new Date(),
    },
  ];

  it("should filter comments by classification type", () => {
    const filtered = mockComments.filter((c) => c.classification === "question");
    expect(filtered).toHaveLength(2);
    expect(filtered.every((c) => c.classification === "question")).toBe(true);
  });

  it("should filter gratitude comments", () => {
    const filtered = mockComments.filter((c) => c.classification === "gratitude");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.message).toBe("Thank you so much!");
  });

  it("should filter spam comments", () => {
    const filtered = mockComments.filter((c) => c.classification === "spam");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.isSpam).toBe(true);
  });

  it("should filter off-topic comments", () => {
    const filtered = mockComments.filter((c) => c.classification === "off_topic");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.message).toBe("Random off-topic message");
  });

  it("should return all comments when no filter is applied", () => {
    const filtered = mockComments.filter(() => true);
    expect(filtered).toHaveLength(5);
  });

  it("should count comments by classification", () => {
    const counts = {
      question: mockComments.filter((c) => c.classification === "question").length,
      gratitude: mockComments.filter((c) => c.classification === "gratitude").length,
      spam: mockComments.filter((c) => c.classification === "spam").length,
      off_topic: mockComments.filter((c) => c.classification === "off_topic").length,
    };

    expect(counts.question).toBe(2);
    expect(counts.gratitude).toBe(1);
    expect(counts.spam).toBe(1);
    expect(counts.off_topic).toBe(1);
  });

  it("should maintain comment order after filtering", () => {
    const filtered = mockComments.filter((c) => c.classification === "question");
    expect(filtered[0]?.id).toBe(1);
    expect(filtered[1]?.id).toBe(5);
  });

  it("should handle empty filter results", () => {
    const filtered = mockComments.filter((c) => c.classification === "nonexistent");
    expect(filtered).toHaveLength(0);
  });

  it("should filter by multiple criteria", () => {
    const filtered = mockComments.filter(
      (c) => c.classification === "question" && c.priority >= 75
    );
    expect(filtered).toHaveLength(2);
  });

  it("should filter by language", () => {
    const filtered = mockComments.filter((c) => c.detectedLanguage === "fr");
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.message).toBe("How does this work?");
  });

  it("should filter spam by isSpam flag", () => {
    const filtered = mockComments.filter((c) => c.isSpam);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.classification).toBe("spam");
  });

  it("should calculate filter counts correctly", () => {
    const totalComments = mockComments.length;
    const questionCount = mockComments.filter((c) => c.classification === "question").length;
    const approvalRate = (questionCount / totalComments) * 100;

    expect(totalComments).toBe(5);
    expect(questionCount).toBe(2);
    expect(approvalRate).toBe(40);
  });

  it("should handle filter state changes", () => {
    let selectedFilter: string | null = null;

    // Start with all comments
    let filtered = mockComments.filter((c) => !selectedFilter || c.classification === selectedFilter);
    expect(filtered).toHaveLength(5);

    // Switch to questions
    selectedFilter = "question";
    filtered = mockComments.filter((c) => !selectedFilter || c.classification === selectedFilter);
    expect(filtered).toHaveLength(2);

    // Switch to spam
    selectedFilter = "spam";
    filtered = mockComments.filter((c) => !selectedFilter || c.classification === selectedFilter);
    expect(filtered).toHaveLength(1);

    // Reset to all
    selectedFilter = null;
    filtered = mockComments.filter((c) => !selectedFilter || c.classification === selectedFilter);
    expect(filtered).toHaveLength(5);
  });

  it("should provide accurate badge counts for filter buttons", () => {
    const filterButtons = [
      { id: null, label: "All", count: mockComments.length },
      {
        id: "question",
        label: "Questions",
        count: mockComments.filter((c) => c.classification === "question").length,
      },
      {
        id: "gratitude",
        label: "Gratitude",
        count: mockComments.filter((c) => c.classification === "gratitude").length,
      },
      {
        id: "spam",
        label: "Spam",
        count: mockComments.filter((c) => c.classification === "spam").length,
      },
      {
        id: "off_topic",
        label: "Off-Topic",
        count: mockComments.filter((c) => c.classification === "off_topic").length,
      },
    ];

    expect(filterButtons[0]?.count).toBe(5); // All
    expect(filterButtons[1]?.count).toBe(2); // Questions
    expect(filterButtons[2]?.count).toBe(1); // Gratitude
    expect(filterButtons[3]?.count).toBe(1); // Spam
    expect(filterButtons[4]?.count).toBe(1); // Off-Topic
  });
});
