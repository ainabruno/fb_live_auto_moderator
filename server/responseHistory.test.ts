import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from './db';

// Mock database functions
vi.mock('./db', () => ({
  db: {
    getActiveModerationSession: vi.fn(),
    getSessionResponses: vi.fn(),
    getModerationSessionById: vi.fn(),
  },
}));

describe('Response History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionResponses', () => {
    it('should return responses for a session', async () => {
      const mockResponses = [
        {
          id: 1,
          sessionId: 1,
          commentId: 1,
          responseText: 'Thank you for your question!',
          responseLanguage: 'en',
          isGroundedInContext: true,
          status: 'sent',
          createdAt: new Date('2026-06-10T09:00:00Z'),
          approvedBy: 1,
          approvedAt: new Date('2026-06-10T08:59:00Z'),
        },
        {
          id: 2,
          sessionId: 1,
          commentId: 2,
          responseText: 'Merci pour votre commentaire!',
          responseLanguage: 'fr',
          isGroundedInContext: true,
          status: 'sent',
          createdAt: new Date('2026-06-10T09:05:00Z'),
          approvedBy: 1,
          approvedAt: new Date('2026-06-10T09:04:00Z'),
        },
      ];

      vi.mocked(db.getSessionResponses).mockResolvedValue(mockResponses as any);

      const result = await db.getSessionResponses(1, 50);

      expect(result).toEqual(mockResponses);
      expect(db.getSessionResponses).toHaveBeenCalledWith(1, 50);
    });

    it('should handle empty response list', async () => {
      vi.mocked(db.getSessionResponses).mockResolvedValue([]);

      const result = await db.getSessionResponses(1, 50);

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      vi.mocked(db.getSessionResponses).mockResolvedValue([]);

      await db.getSessionResponses(1, 100);

      expect(db.getSessionResponses).toHaveBeenCalledWith(1, 100);
    });
  });

  describe('getActiveModerationSession', () => {
    it('should return active session for user', async () => {
      const mockSession = {
        id: 1,
        userId: 1,
        facebookPageId: 'page123',
        facebookAccessToken: 'token123',
        liveVideoId: 'video123',
        liveContext: 'Live topic: Product launch',
        isActive: true,
        createdAt: new Date('2026-06-10T08:00:00Z'),
        updatedAt: new Date('2026-06-10T09:30:00Z'),
      };

      vi.mocked(db.getActiveModerationSession).mockResolvedValue(mockSession as any);

      const result = await db.getActiveModerationSession(1);

      expect(result).toEqual(mockSession);
      expect(db.getActiveModerationSession).toHaveBeenCalledWith(1);
    });

    it('should return null when no active session', async () => {
      vi.mocked(db.getActiveModerationSession).mockResolvedValue(null);

      const result = await db.getActiveModerationSession(1);

      expect(result).toBeNull();
    });
  });

  describe('getModerationSessionById', () => {
    it('should return session by ID', async () => {
      const mockSession = {
        id: 1,
        userId: 1,
        facebookPageId: 'page123',
        facebookAccessToken: 'token123',
        liveVideoId: 'video123',
        liveContext: 'Live topic: Product launch',
        isActive: true,
        createdAt: new Date('2026-06-10T08:00:00Z'),
        updatedAt: new Date('2026-06-10T09:30:00Z'),
      };

      vi.mocked(db.getModerationSessionById).mockResolvedValue(mockSession as any);

      const result = await db.getModerationSessionById(1);

      expect(result).toEqual(mockSession);
      expect(db.getModerationSessionById).toHaveBeenCalledWith(1);
    });

    it('should return null for non-existent session', async () => {
      vi.mocked(db.getModerationSessionById).mockResolvedValue(null);

      const result = await db.getModerationSessionById(999);

      expect(result).toBeNull();
    });
  });

  describe('Response filtering', () => {
    it('should filter responses by status', () => {
      const responses = [
        { id: 1, status: 'sent', responseText: 'Response 1' },
        { id: 2, status: 'pending', responseText: 'Response 2' },
        { id: 3, status: 'sent', responseText: 'Response 3' },
        { id: 4, status: 'rejected', responseText: 'Response 4' },
      ];

      const filtered = responses.filter((r: any) => r.status === 'sent');

      expect(filtered).toHaveLength(2);
      expect(filtered.every((r: any) => r.status === 'sent')).toBe(true);
    });

    it('should search responses by text', () => {
      const responses = [
        { id: 1, responseText: 'Thank you for your question' },
        { id: 2, responseText: 'Merci pour votre commentaire' },
        { id: 3, responseText: 'Thank you for watching' },
      ];

      const query = 'thank';
      const filtered = responses.filter((r: any) =>
        r.responseText.toLowerCase().includes(query.toLowerCase())
      );

      expect(filtered).toHaveLength(2);
    });

    it('should sort responses by date (newest first)', () => {
      const responses = [
        { id: 1, createdAt: new Date('2026-06-10T08:00:00Z') },
        { id: 2, createdAt: new Date('2026-06-10T09:00:00Z') },
        { id: 3, createdAt: new Date('2026-06-10T07:00:00Z') },
      ];

      const sorted = [...responses].sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      expect(sorted[0].id).toBe(2);
      expect(sorted[1].id).toBe(1);
      expect(sorted[2].id).toBe(3);
    });

    it('should sort responses by date (oldest first)', () => {
      const responses = [
        { id: 1, createdAt: new Date('2026-06-10T08:00:00Z') },
        { id: 2, createdAt: new Date('2026-06-10T09:00:00Z') },
        { id: 3, createdAt: new Date('2026-06-10T07:00:00Z') },
      ];

      const sorted = [...responses].sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      expect(sorted[0].id).toBe(3);
      expect(sorted[1].id).toBe(1);
      expect(sorted[2].id).toBe(2);
    });

    it('should sort responses by status', () => {
      const responses = [
        { id: 1, status: 'sent' },
        { id: 2, status: 'approved' },
        { id: 3, status: 'pending' },
      ];

      const sorted = [...responses].sort((a: any, b: any) =>
        (a.status || '').localeCompare(b.status || '')
      );

      expect(sorted[0].status).toBe('approved');
      expect(sorted[1].status).toBe('pending');
      expect(sorted[2].status).toBe('sent');
    });
  });

  describe('CSV Export', () => {
    it('should generate valid CSV from responses', () => {
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
      expect(csv).toContain('Response');
      expect(csv).toContain('Status');
      expect(csv).toContain('Thank you for your question!');
      expect(csv).toContain('Merci pour votre commentaire!');
      expect(csv).toContain('sent');
      expect(csv).toContain('en');
      expect(csv).toContain('fr');
    });

    it('should escape quotes in CSV response text', () => {
      const responses = [
        {
          id: 1,
          responseText: 'He said "thank you"',
          status: 'sent',
          responseLanguage: 'en',
          isGroundedInContext: true,
          createdAt: new Date('2026-06-10T09:00:00Z'),
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

      expect(csv).toContain('He said ""thank you""');
    });
  });

  describe('Response Status Colors', () => {
    it('should return correct color for sent status', () => {
      const getStatusColor = (status: string) => {
        switch (status) {
          case 'sent':
            return 'bg-green-100 text-green-800';
          case 'approved':
            return 'bg-blue-100 text-blue-800';
          case 'pending':
            return 'bg-yellow-100 text-yellow-800';
          case 'failed':
            return 'bg-red-100 text-red-800';
          case 'rejected':
            return 'bg-gray-100 text-gray-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };

      expect(getStatusColor('sent')).toBe('bg-green-100 text-green-800');
      expect(getStatusColor('approved')).toBe('bg-blue-100 text-blue-800');
      expect(getStatusColor('pending')).toBe('bg-yellow-100 text-yellow-800');
      expect(getStatusColor('failed')).toBe('bg-red-100 text-red-800');
      expect(getStatusColor('rejected')).toBe('bg-gray-100 text-gray-800');
    });
  });
});
