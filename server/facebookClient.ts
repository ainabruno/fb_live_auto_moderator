/**
 * Facebook Graph API Client
 * Handles all interactions with Facebook API for live comments and responses
 */

interface FacebookComment {
  id: string;
  message: string;
  created_time: string;
  from: {
    id: string;
    name: string;
  };
}

interface FacebookCommentsResponse {
  data: FacebookComment[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

interface FacebookLiveVideo {
  id: string;
  title?: string;
  description?: string;
  status: string;
  created_time: string;
  updated_time: string;
}

interface FacebookLiveVideosResponse {
  data: FacebookLiveVideo[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

const FACEBOOK_GRAPH_API_VERSION = "v18.0";
const FACEBOOK_API_BASE_URL = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}`;

/**
 * Facebook API Client
 * Provides methods to interact with Facebook Graph API
 */
export class FacebookClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  /**
   * Make a request to Facebook Graph API
   */
  private async makeRequest(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    data?: Record<string, any>
  ): Promise<any> {
    const url = new URL(`${FACEBOOK_API_BASE_URL}${endpoint}`);
    url.searchParams.append("access_token", this.accessToken);

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (method === "POST" && data) {
      options.body = JSON.stringify(data);
    } else if (method === "GET" && data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Facebook API Error: ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get active live videos for a page
   */
  async getLiveVideos(pageId: string): Promise<FacebookLiveVideosResponse> {
    return this.makeRequest(`/${pageId}/live_videos`, "GET", {
      fields: "id,title,description,status,created_time,updated_time",
      limit: 10,
    });
  }

  /**
   * Get comments from a live video
   * @param videoId - Facebook video ID
   * @param after - Pagination cursor for fetching new comments
   */
  async getLiveComments(
    videoId: string,
    after?: string
  ): Promise<FacebookCommentsResponse> {
    const params: Record<string, any> = {
      fields: "id,message,created_time,from{id,name}",
      limit: 100,
      order: "chronological", // Get oldest first
    };

    if (after) {
      params.after = after;
    }

    return this.makeRequest(`/${videoId}/comments`, "GET", params);
  }

  /**
   * Post a comment/reply to a live video
   * @param videoId - Facebook video ID
   * @param message - Comment text
   */
  async postComment(videoId: string, message: string): Promise<{ id: string }> {
    return this.makeRequest(`/${videoId}/comments`, "POST", {
      message,
    });
  }

  /**
   * Reply to a specific comment
   * @param commentId - Facebook comment ID
   * @param message - Reply text
   */
  async replyToComment(
    commentId: string,
    message: string
  ): Promise<{ id: string }> {
    return this.makeRequest(`/${commentId}`, "POST", {
      message,
    });
  }

  /**
   * Get comment details
   */
  async getComment(commentId: string): Promise<FacebookComment> {
    return this.makeRequest(`/${commentId}`, "GET", {
      fields: "id,message,created_time,from{id,name}",
    });
  }

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/${commentId}`, "POST", {
      method: "delete",
    });
  }

  /**
   * Get page info
   */
  async getPageInfo(pageId: string): Promise<any> {
    return this.makeRequest(`/${pageId}`, "GET", {
      fields: "id,name,picture,fan_count",
    });
  }

  /**
   * Verify access token validity
   */
  async verifyToken(): Promise<{ is_valid: boolean; user_id: string }> {
    return this.makeRequest("/me", "GET", {
      fields: "id",
    });
  }
}

/**
 * Create a Facebook client instance
 */
export function createFacebookClient(accessToken: string): FacebookClient {
  return new FacebookClient(accessToken);
}
