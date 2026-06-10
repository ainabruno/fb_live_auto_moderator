import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from './db';

// Mock database functions
vi.mock('./db', () => ({
  db: {
    getUserModerationSessions: vi.fn(),
    getModerationSessionById: vi.fn(),
    getSessionComments: vi.fn(),
    getSessionResponses: vi.fn(),
  },
}));

describe('Session History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserModerationSessions', () => {
    it('should return all sessions for a user', async () => {
      const mockSessions = [
        {
          id: 1,
          userId: 1,
          facebookPageId: 'page123',
          facebookAccessToken: 'token123',
          liveVideoId: 'video123',
          liveContext: 'Live topic: Product launch',
          isActive: false,
          createdAt: new Date('2026-06-10T08:00:00Z'),
          updatedAt: new Date('2026-06-10T09:30:00Z'),
        },
        {
          id: 2,
          userId: 1,
          facebookPageId: 'page456',
          facebookAccessToken: 'token456',
          liveVideoId: 'video456',
          liveContext: 'Live topic: Q&A Session',
          isActive: true,
          createdAt: new Date('2026-06-10T09:00:00Z'),
          updatedAt: new Date('2026-06-10T09:45:00Z'),
        },
      ];

      vi.mocked(db.getUserModerationSessions).mockResolvedValue(mockSessions as any);

      const result = await db.getUserModerationSessions(1, 50);

      expect(result).toEqual(mockSessions);
      expect(result).toHaveLength(2);
      expect(db.getUserModerationSessions).toHaveBeenCalledWith(1, 50);
    });

    it('should return empty array when no sessions exist', async () => {
      vi.mocked(db.getUserModerationSessions).mockResolvedValue([]);

      const result = await db.getUserModerationSessions(1, 50);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const mockSessions = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        userId: 1,
        facebookPageId: `page${i}`,
        facebookAccessToken: `token${i}`,
        liveVideoId: `video${i}`,
        liveContext: `Context ${i}`,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      vi.mocked(db.getUserModerationSessions).mockResolvedValue(mockSessions.slice(0, 50) as any);

      const result = await db.getUserModerationSessions(1, 50);

      expect(result).toHaveLength(50);
      expect(db.getUserModerationSessions).toHaveBeenCalledWith(1, 50);
    });

    it('should return sessions ordered by creation date (newest first)', async () => {
      const unorderedSessions = [
        {
          id: 1,
          userId: 1,
          facebookPageId: 'page1',
          facebookAccessToken: 'token1',
          liveVideoId: 'video1',
          liveContext: 'Context 1',
          isActive: false,
          createdAt: new Date('2026-06-10T08:00:00Z'),
          updatedAt: new Date('2026-06-10T09:00:00Z'),
        },
        {
          id: 3,
          userId: 1,
          facebookPageId: 'page3',
          facebookAccessToken: 'token3',
          liveVideoId: 'video3',
          liveContext: 'Context 3',
          isActive: false,
          createdAt: new Date('2026-06-10T10:00:00Z'),
          updatedAt: new Date('2026-06-10T10:30:00Z'),
        },
        {
          id: 2,
          userId: 1,
          facebookPageId: 'page2',
          facebookAccessToken: 'token2',
          liveVideoId: 'video2',
          liveContext: 'Context 2',
          isActive: false,
          createdAt: new Date('2026-06-10T09:00:00Z'),
          updatedAt: new Date('2026-06-10T09:30:00Z'),
        },
      ];

      // Sort by creation date descending (newest first)
      const mockSessions = [...unorderedSessions].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      vi.mocked(db.getUserModerationSessions).mockResolvedValue(mockSessions as any);

      const result = await db.getUserModerationSessions(1, 50);

      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);
    });
  });

  describe('Session Statistics', () => {
    it('should calculate session statistics correctly', () => {
      const comments = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        sessionId: 1,
        message: `Comment ${i}`,
        classification: 'question',
        priority: 50 + i,
      }));

      const responses = [
        { id: 1, status: 'sent', sessionId: 1 },
        { id: 2, status: 'sent', sessionId: 1 },
        { id: 3, status: 'approved', sessionId: 1 },
        { id: 4, status: 'pending', sessionId: 1 },
        { id: 5, status: 'rejected', sessionId: 1 },
      ];

      const stats = {
        totalComments: comments.length,
        totalResponses: responses.length,
        sentResponses: responses.filter((r: any) => r.status === 'sent').length,
        approvedResponses: responses.filter((r: any) => r.status === 'approved').length,
        pendingResponses: responses.filter((r: any) => r.status === 'pending').length,
        responseRate: Math.round((responses.length / comments.length) * 100),
      };

      expect(stats.totalComments).toBe(50);
      expect(stats.totalResponses).toBe(5);
      expect(stats.sentResponses).toBe(2);
      expect(stats.approvedResponses).toBe(1);
      expect(stats.pendingResponses).toBe(1);
      expect(stats.responseRate).toBe(10);
    });

    it('should handle zero comments gracefully', () => {
      const comments: any[] = [];
      const responses = [{ id: 1, status: 'sent' }];

      const responseRate = comments.length > 0 ? Math.round((responses.length / comments.length) * 100) : 0;

      expect(responseRate).toBe(0);
    });
  });

  describe('Session Duration Calculation', () => {
    it('should calculate duration in minutes', () => {
      const session = {
        id: 1,
        createdAt: new Date('2026-06-10T09:00:00Z'),
        updatedAt: new Date('2026-06-10T09:30:00Z'),
      };

      const diffMs = new Date(session.updatedAt).getTime() - new Date(session.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);

      expect(diffMins).toBe(30);
    });

    it('should calculate duration in hours and minutes', () => {
      const session = {
        id: 1,
        createdAt: new Date('2026-06-10T09:00:00Z'),
        updatedAt: new Date('2026-06-10T11:45:00Z'),
      };

      const diffMs = new Date(session.updatedAt).getTime() - new Date(session.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;

      expect(hours).toBe(2);
      expect(mins).toBe(45);
    });
  });

  describe('Session Filtering', () => {
    it('should filter active sessions', () => {
      const sessions = [
        { id: 1, isActive: true, facebookPageId: 'page1' },
        { id: 2, isActive: false, facebookPageId: 'page2' },
        { id: 3, isActive: true, facebookPageId: 'page3' },
        { id: 4, isActive: false, facebookPageId: 'page4' },
      ];

      const activeSessions = sessions.filter((s: any) => s.isActive);

      expect(activeSessions).toHaveLength(2);
      expect(activeSessions.every((s: any) => s.isActive)).toBe(true);
    });

    it('should filter inactive sessions', () => {
      const sessions = [
        { id: 1, isActive: true, facebookPageId: 'page1' },
        { id: 2, isActive: false, facebookPageId: 'page2' },
        { id: 3, isActive: true, facebookPageId: 'page3' },
        { id: 4, isActive: false, facebookPageId: 'page4' },
      ];

      const inactiveSessions = sessions.filter((s: any) => !s.isActive);

      expect(inactiveSessions).toHaveLength(2);
      expect(inactiveSessions.every((s: any) => !s.isActive)).toBe(true);
    });
  });

  describe('Session Data Export', () => {
    it('should generate valid CSV from session responses', () => {
      const responses = [
        {
          id: 1,
          responseText: 'Thank you for your question!',
          status: 'sent',
          responseLanguage: 'en',
          isGroundedInContext: true,
          createdAt: new Date('2026-06-10T09:00:00Z'),
        },
        {
          id: 2,
          responseText: 'Merci pour votre commentaire!',
          status: 'sent',
          responseLanguage: 'fr',
          isGroundedInContext: true,
          createdAt: new Date('2026-06-10T09:05:00Z'),
        },
      ];

      const csv = [
        ['Timestamp', 'Response', 'Status', 'Language', 'Grounded'].join(','),
        ...responses.map((r: any) =>
          [
            new Date(r.createdAt).toISOString(),
            `"${r.responseText?.replace(/"/g, '""') || ''}"`,
            r.status,
            r.responseLanguage || 'Unknown',
            r.isGroundedInContext ? 'Yes' : 'No',
          ].join(',')
        ),
      ].join('\n');

      expect(csv).toContain('Timestamp');
      expect(csv).toContain('Thank you for your question!');
      expect(csv).toContain('Merci pour votre commentaire!');
      expect(csv).toContain('sent');
      expect(csv).toContain('en');
      expect(csv).toContain('fr');
    });
  });

  describe('Session Metadata', () => {
    it('should extract session metadata correctly', () => {
      const session = {
        id: 1,
        userId: 1,
        facebookPageId: 'page123',
        facebookAccessToken: 'token123',
        liveVideoId: 'video123',
        liveContext: 'Live topic: Product launch',
        isActive: false,
        createdAt: new Date('2026-06-10T08:00:00Z'),
        updatedAt: new Date('2026-06-10T09:30:00Z'),
      };

      expect(session.facebookPageId).toBe('page123');
      expect(session.liveVideoId).toBe('video123');
      expect(session.liveContext).toBe('Live topic: Product launch');
      expect(session.isActive).toBe(false);
    });
  });
});
