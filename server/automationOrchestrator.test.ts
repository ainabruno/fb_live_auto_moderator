import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { automationOrchestrator, AutomationConfig } from "./automationOrchestrator";

describe("AutomationOrchestrator", () => {
  const mockConfig: AutomationConfig = {
    sessionId: 1,
    pageId: "page123",
    accessToken: "token123",
    liveVideoId: "video123",
    autoApprove: true,
    responseDelay: 1000,
    maxRepliesPerMinute: 10,
    enableAudioTranscription: true,
    enableAutoReply: true,
  };

  beforeEach(() => {
    // Clear all sessions before each test
    const activeAutomations = automationOrchestrator.getActiveAutomations();
    activeAutomations.forEach((state) => {
      automationOrchestrator.clearSession(state.sessionId);
    });
  });

  afterEach(() => {
    // Clean up after each test
    const activeAutomations = automationOrchestrator.getActiveAutomations();
    activeAutomations.forEach((state) => {
      automationOrchestrator.clearSession(state.sessionId);
    });
  });

  describe("startAutomation", () => {
    it("should initialize automation state correctly", async () => {
      const state = await automationOrchestrator.startAutomation(mockConfig);

      expect(state).toBeDefined();
      expect(state.sessionId).toBe(mockConfig.sessionId);
      expect(state.isRunning).toBe(true);
      expect(state.isPaused).toBe(false);
      expect(state.commentsProcessed).toBe(0);
      expect(state.responsesGenerated).toBe(0);
      expect(state.responsesSent).toBe(0);
      expect(state.errors).toEqual([]);
    });

    it("should return existing state if automation already running", async () => {
      const state1 = await automationOrchestrator.startAutomation(mockConfig);
      const state2 = await automationOrchestrator.startAutomation(mockConfig);

      expect(state1.sessionId).toBe(state2.sessionId);
      expect(state1.isRunning).toBe(state2.isRunning);
    });

    it("should track automation state in active automations", async () => {
      await automationOrchestrator.startAutomation(mockConfig);

      const active = automationOrchestrator.getActiveAutomations();
      expect(active.length).toBeGreaterThan(0);
      expect(active.some((s) => s.sessionId === mockConfig.sessionId)).toBe(true);
    });
  });

  describe("stopAutomation", () => {
    it("should stop automation and mark as not running", async () => {
      await automationOrchestrator.startAutomation(mockConfig);
      const stoppedState = await automationOrchestrator.stopAutomation(mockConfig.sessionId);

      expect(stoppedState).toBeDefined();
      expect(stoppedState?.isRunning).toBe(false);
    });

    it("should return null if session doesn't exist", async () => {
      const result = await automationOrchestrator.stopAutomation(99999);
      expect(result).toBeNull();
    });

    it("should remove from active automations after stopping", async () => {
      await automationOrchestrator.startAutomation(mockConfig);
      await automationOrchestrator.stopAutomation(mockConfig.sessionId);

      const active = automationOrchestrator.getActiveAutomations();
      expect(active.some((s) => s.sessionId === mockConfig.sessionId)).toBe(false);
    });
  });

  describe("pauseAutomation", () => {
    it("should pause automation", async () => {
      await automationOrchestrator.startAutomation(mockConfig);
      const result = automationOrchestrator.pauseAutomation(mockConfig.sessionId);

      expect(result).toBe(true);

      const state = automationOrchestrator.getState(mockConfig.sessionId);
      expect(state?.isPaused).toBe(true);
    });

    it("should return false if session doesn't exist", () => {
      const result = automationOrchestrator.pauseAutomation(99999);
      expect(result).toBe(false);
    });
  });

  describe("resumeAutomation", () => {
    it("should resume paused automation", async () => {
      await automationOrchestrator.startAutomation(mockConfig);
      automationOrchestrator.pauseAutomation(mockConfig.sessionId);
      const result = automationOrchestrator.resumeAutomation(mockConfig.sessionId);

      expect(result).toBe(true);

      const state = automationOrchestrator.getState(mockConfig.sessionId);
      expect(state?.isPaused).toBe(false);
    });

    it("should return false if session doesn't exist", () => {
      const result = automationOrchestrator.resumeAutomation(99999);
      expect(result).toBe(false);
    });
  });

  describe("getState", () => {
    it("should return automation state for active session", async () => {
      await automationOrchestrator.startAutomation(mockConfig);
      const state = automationOrchestrator.getState(mockConfig.sessionId);

      expect(state).toBeDefined();
      expect(state?.sessionId).toBe(mockConfig.sessionId);
    });

    it("should return null for non-existent session", () => {
      const state = automationOrchestrator.getState(99999);
      expect(state).toBeNull();
    });
  });

  describe("getActiveAutomations", () => {
    it("should return empty array when no automations running", () => {
      const active = automationOrchestrator.getActiveAutomations();
      expect(Array.isArray(active)).toBe(true);
    });

    it("should return all running automations", async () => {
      const config1 = { ...mockConfig, sessionId: 1 };
      const config2 = { ...mockConfig, sessionId: 2 };

      await automationOrchestrator.startAutomation(config1);
      await automationOrchestrator.startAutomation(config2);

      const active = automationOrchestrator.getActiveAutomations();
      expect(active.length).toBeGreaterThanOrEqual(2);
      expect(active.some((s) => s.sessionId === 1)).toBe(true);
      expect(active.some((s) => s.sessionId === 2)).toBe(true);
    });
  });

  describe("clearSession", () => {
    it("should remove session from state", async () => {
      await automationOrchestrator.startAutomation(mockConfig);
      automationOrchestrator.clearSession(mockConfig.sessionId);

      const state = automationOrchestrator.getState(mockConfig.sessionId);
      expect(state).toBeNull();
    });

    it("should not throw error for non-existent session", () => {
      expect(() => {
        automationOrchestrator.clearSession(99999);
      }).not.toThrow();
    });
  });

  describe("processComment", () => {
    it("should increment comments processed counter", async () => {
      await automationOrchestrator.startAutomation(mockConfig);

      const mockComment = {
        message: "What is this about?",
        facebookCommentId: "comment123",
      };

      await automationOrchestrator.processComment(mockConfig.sessionId, mockComment);

      const state = automationOrchestrator.getState(mockConfig.sessionId);
      expect(state?.commentsProcessed).toBeGreaterThan(0);
    });

    it("should not process comments when paused", async () => {
      await automationOrchestrator.startAutomation(mockConfig);
      automationOrchestrator.pauseAutomation(mockConfig.sessionId);

      const initialState = automationOrchestrator.getState(mockConfig.sessionId);
      const initialCount = initialState?.commentsProcessed || 0;

      const mockComment = {
        message: "Test comment",
        facebookCommentId: "comment123",
      };

      await automationOrchestrator.processComment(mockConfig.sessionId, mockComment);

      const state = automationOrchestrator.getState(mockConfig.sessionId);
      expect(state?.commentsProcessed).toBe(initialCount);
    });

    it("should handle errors gracefully", async () => {
      await automationOrchestrator.startAutomation(mockConfig);

      const mockComment = {
        message: "",
        facebookCommentId: "comment123",
      };

      await automationOrchestrator.processComment(mockConfig.sessionId, mockComment);

      const state = automationOrchestrator.getState(mockConfig.sessionId);
      expect(state).toBeDefined();
      expect(state?.isRunning).toBe(true);
    });
  });

  describe("AutomationState tracking", () => {
    it("should update lastActivityTime on comment processing", async () => {
      await automationOrchestrator.startAutomation(mockConfig);

      const initialState = automationOrchestrator.getState(mockConfig.sessionId);
      const initialTime = initialState?.lastActivityTime;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const mockComment = {
        message: "Test comment",
        facebookCommentId: "comment123",
      };

      await automationOrchestrator.processComment(mockConfig.sessionId, mockComment);

      const updatedState = automationOrchestrator.getState(mockConfig.sessionId);
      expect(updatedState?.lastActivityTime.getTime()).toBeGreaterThan(
        initialTime?.getTime() || 0
      );
    });

    it("should track current transcript", async () => {
      await automationOrchestrator.startAutomation(mockConfig);

      const mockComment = {
        message: "Test comment",
        facebookCommentId: "comment123",
      };

      await automationOrchestrator.processComment(mockConfig.sessionId, mockComment);

      const state = automationOrchestrator.getState(mockConfig.sessionId);
      expect(state?.currentTranscript).toBeDefined();
    });
  });
});
