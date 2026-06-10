import axios, { AxiosInstance } from "axios";

export interface FacebookReplyOptions {
  commentId: string;
  message: string;
  accessToken: string;
}

export interface FacebookReplyResponse {
  id: string;
  success: boolean;
  error?: string;
}

export interface FacebookCommentReply {
  id: string;
  message: string;
  createdTime: string;
  from: {
    name: string;
    id: string;
  };
}

/**
 * Enhanced Facebook API Client for posting replies to comments
 */
export class FacebookReplyClient {
  private baseUrl = "https://graph.facebook.com/v18.0";
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Post a reply to a Facebook comment
   * This posts the response as a reply under the original comment
   */
  async postReplyToComment(options: FacebookReplyOptions): Promise<FacebookReplyResponse> {
    try {
      const { commentId, message, accessToken } = options;

      // Validate inputs
      if (!commentId || !message || !accessToken) {
        return {
          id: "",
          success: false,
          error: "Missing required parameters: commentId, message, or accessToken",
        };
      }

      // Post reply to comment using Facebook Graph API
      // POST /{comment-id}/comments with message parameter
      const response = await this.client.post(`/${commentId}/comments`, {
        message,
        access_token: accessToken,
      });

      return {
        id: response.data.id,
        success: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[FacebookReplyClient] Error posting reply:`, errorMessage);

      return {
        id: "",
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Post multiple replies in sequence with rate limiting
   */
  async postRepliesInSequence(
    replies: FacebookReplyOptions[],
    delayMs: number = 1000
  ): Promise<FacebookReplyResponse[]> {
    const results: FacebookReplyResponse[] = [];

    for (const reply of replies) {
      const result = await this.postReplyToComment(reply);
      results.push(result);

      // Add delay between posts to respect rate limits
      if (replies.indexOf(reply) < replies.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }

  /**
   * Get replies to a comment
   */
  async getCommentReplies(commentId: string, accessToken: string): Promise<FacebookCommentReply[]> {
    try {
      const response = await this.client.get(`/${commentId}/comments`, {
        params: {
          fields: "id,message,created_time,from",
          access_token: accessToken,
        },
      });

      return response.data.data || [];
    } catch (error) {
      console.error(`[FacebookReplyClient] Error fetching replies:`, error);
      return [];
    }
  }

  /**
   * Delete a comment/reply
   */
  async deleteComment(commentId: string, accessToken: string): Promise<boolean> {
    try {
      await this.client.delete(`/${commentId}`, {
        params: {
          access_token: accessToken,
        },
      });

      return true;
    } catch (error) {
      console.error(`[FacebookReplyClient] Error deleting comment:`, error);
      return false;
    }
  }

  /**
   * Update a comment/reply message
   */
  async updateComment(
    commentId: string,
    message: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      await this.client.post(`/${commentId}`, {
        message,
        access_token: accessToken,
      });

      return true;
    } catch (error) {
      console.error(`[FacebookReplyClient] Error updating comment:`, error);
      return false;
    }
  }

  /**
   * Check if a comment exists and get its details
   */
  async getCommentDetails(commentId: string, accessToken: string): Promise<any> {
    try {
      const response = await this.client.get(`/${commentId}`, {
        params: {
          fields: "id,message,created_time,from,like_count",
          access_token: accessToken,
        },
      });

      return response.data;
    } catch (error) {
      console.error(`[FacebookReplyClient] Error fetching comment details:`, error);
      return null;
    }
  }

  /**
   * Batch post replies (more efficient for multiple replies)
   */
  async batchPostReplies(
    replies: FacebookReplyOptions[]
  ): Promise<Map<string, FacebookReplyResponse>> {
    const results = new Map<string, FacebookReplyResponse>();

    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < replies.length; i += batchSize) {
      const batch = replies.slice(i, i + batchSize);
      const batchResults = await this.postRepliesInSequence(batch, 500);

      batch.forEach((reply, index) => {
        results.set(reply.commentId, batchResults[index]);
      });

      // Add delay between batches
      if (i + batchSize < replies.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

// Export singleton instance
export const facebookReplyClient = new FacebookReplyClient();
