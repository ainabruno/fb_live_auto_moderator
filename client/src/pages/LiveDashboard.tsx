import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";
import {
  BarChart3,
  MessageSquare,
  Send,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  Settings,
  TrendingUp,
} from "lucide-react";

interface CommentData {
  id: number;
  message: string;
  userName: string;
  classification: string;
  priority: number;
  isSpam: boolean;
  detectedLanguage: string;
  createdAt: Date;
}

interface ResponseData {
  id: number;
  responseText: string;
  status: string;
  responseLanguage: string;
  sentAt?: Date;
}

/**
 * Live Dashboard for monitoring incoming comments and AI-generated responses
 */
export default function LiveDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Get active session
  const { data: session, isLoading: sessionLoading } =
    trpc.moderation.getActiveSession.useQuery(undefined, { enabled: !!user?.id });

  // Get session comments
  const { data: comments = [], isLoading: commentsLoading } =
    trpc.moderation.getComments.useQuery(
      { sessionId: session?.id || 0, limit: 100 },
      { enabled: !!session?.id, refetchInterval: 2000 } // Refetch every 2 seconds
    );

  // Get session responses
  const { data: responses = [], isLoading: responsesLoading } =
    trpc.moderation.getSessionResponses.useQuery(
      { sessionId: session?.id || 0, limit: 50 },
      { enabled: !!session?.id, refetchInterval: 2000 }
    );

  const [isPaused, setIsPaused] = useState(false);
  const commentsFeedRef = useRef<HTMLDivElement>(null);
  const responsesFeedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest items
  useEffect(() => {
    if (!isPaused && commentsFeedRef.current) {
      commentsFeedRef.current.scrollTop = 0;
    }
  }, [comments, isPaused]);

  useEffect(() => {
    if (!isPaused && responsesFeedRef.current) {
      responsesFeedRef.current.scrollTop = 0;
    }
  }, [responses, isPaused]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold mb-4">Please sign in to continue</p>
          <Button onClick={() => setLocation("/")}>Go to Home</Button>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold mb-4">No active moderation session</p>
          <Button onClick={() => setLocation("/dashboard")}>Create Session</Button>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalComments = comments.length;
  const totalResponses = responses.filter((r) => r.status === "sent").length;
  const pendingComments = comments.filter((c) => c.status === "pending").length;
  const spamComments = comments.filter((c) => c.isSpam).length;
  const autoApprovedCount = responses.filter(
    (r) => r.status === "sent"
  ).length;
  const approvalRate =
    totalComments > 0 ? ((autoApprovedCount / totalComments) * 100).toFixed(1) : "0";

  // Get language distribution
  const languageCount = {
    en: (comments as any[]).filter((c) => c.detectedLanguage === "en").length,
    fr: (comments as any[]).filter((c) => c.detectedLanguage === "fr").length,
    mg: (comments as any[]).filter((c) => c.detectedLanguage === "mg").length,
  };

  // Get classification distribution
  const classificationCount = {
    question: (comments as any[]).filter((c) => c.classification === "question").length,
    gratitude: (comments as any[]).filter((c) => c.classification === "gratitude").length,
    spam: (comments as any[]).filter((c) => c.classification === "spam").length,
    off_topic: (comments as any[]).filter((c) => c.classification === "off_topic").length,
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "question":
        return "bg-blue-100 text-blue-800";
      case "gratitude":
        return "bg-green-100 text-green-800";
      case "spam":
        return "bg-red-100 text-red-800";
      case "off_topic":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLanguageBadge = (language: string) => {
    const badges: Record<string, string> = {
      en: "EN",
      fr: "FR",
      mg: "MG",
    };
    return badges[language] || language.toUpperCase();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return "bg-red-500";
    if (priority >= 50) return "bg-orange-500";
    if (priority >= 20) return "bg-yellow-500";
    return "bg-gray-400";
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Live Dashboard
              </h1>
              <p className="text-slate-600 mt-1">
                Real-time monitoring of comments and AI responses
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className="gap-2"
              >
                {isPaused ? (
                  <>
                    <Play className="w-4 h-4" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/settings")}
                className="gap-2"
              >
                <Settings className="w-4 h-4" /> Settings
              </Button>
            </div>
          </div>

          {/* Session Info */}
          <Card className="p-4 bg-white border-l-4 border-l-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Session Active
                </p>
                <p className="text-lg font-bold text-slate-900">
                  Page ID: {session.facebookPageId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Live</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Total Comments
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalComments}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Responses Sent
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {totalResponses}
                </p>
              </div>
              <Send className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Pending Queue
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {pendingComments}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 font-medium">
                  Approval Rate
                </p>
                <p className="text-3xl font-bold text-slate-900 mt-1">
                  {approvalRate}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Incoming Comments */}
          <Card className="bg-white flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Incoming Comments
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {commentsLoading ? "Loading..." : `${totalComments} total`}
              </p>
            </div>

            <div
              ref={commentsFeedRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {commentsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p>No comments yet. Waiting for live activity...</p>
                </div>
              ) : (
                (comments as any[]).map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors animate-in fade-in duration-300"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {comment.userName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTime(comment.createdAt)}
                        </p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${getPriorityColor(
                          comment.priority
                        )}`}
                      />
                    </div>

                    <p className="text-sm text-slate-700 mb-2 line-clamp-2">
                      {comment.message}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Badge className={getClassificationColor(comment.classification)}>
                        {comment.classification}
                      </Badge>
                      <Badge variant="outline">
                        {getLanguageBadge(comment.detectedLanguage)}
                      </Badge>
                      {comment.isSpam && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertCircle className="w-3 h-3" /> Spam
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Right: Sent Responses */}
          <Card className="bg-white flex flex-col h-[600px]">
            <div className="p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-green-600" />
                Sent Responses
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {responsesLoading ? "Loading..." : `${totalResponses} sent`}
              </p>
            </div>

            <div
              ref={responsesFeedRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {responsesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Spinner />
                </div>
              ) : responses.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p>No responses sent yet...</p>
                </div>
              ) : (
                responses
                  .filter((r) => r.status === "sent")
                  .map((response) => (
                    <div
                      key={response.id}
                      className="p-3 bg-green-50 rounded-lg border border-green-200 animate-in fade-in duration-300"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-green-600 text-white">
                          {response.status}
                        </Badge>
                        <Badge variant="outline">
                          {getLanguageBadge(response.responseLanguage)}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-700 line-clamp-3">
                        {response.responseText}
                      </p>

                      {response.sentAt && (
                        <p className="text-xs text-slate-500 mt-2">
                          Sent {formatTime(response.sentAt)}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        {/* Bottom: Statistics Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Language Distribution */}
          <Card className="p-4 bg-white">
            <h3 className="font-bold text-slate-900 mb-4">Language Distribution</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">English (EN)</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-blue-200 rounded flex-1 w-24">
                    <div
                      className="h-full bg-blue-600 rounded"
                      style={{
                        width: `${
                          totalComments > 0
                            ? (languageCount.en / totalComments) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">
                    {languageCount.en}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">French (FR)</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-amber-200 rounded flex-1 w-24">
                    <div
                      className="h-full bg-amber-600 rounded"
                      style={{
                        width: `${
                          totalComments > 0
                            ? (languageCount.fr / totalComments) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">
                    {languageCount.fr}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Malagasy (MG)</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-pink-200 rounded flex-1 w-24">
                    <div
                      className="h-full bg-pink-600 rounded"
                      style={{
                        width: `${
                          totalComments > 0
                            ? (languageCount.mg / totalComments) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">
                    {languageCount.mg}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Classification Distribution */}
          <Card className="p-4 bg-white">
            <h3 className="font-bold text-slate-900 mb-4">Comment Classification</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Questions</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-blue-200 rounded flex-1 w-24">
                    <div
                      className="h-full bg-blue-600 rounded"
                      style={{
                        width: `${
                          totalComments > 0
                            ? (classificationCount.question / totalComments) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">
                    {classificationCount.question}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Gratitude</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-green-200 rounded flex-1 w-24">
                    <div
                      className="h-full bg-green-600 rounded"
                      style={{
                        width: `${
                          totalComments > 0
                            ? (classificationCount.gratitude / totalComments) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">
                    {classificationCount.gratitude}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Spam</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-red-200 rounded flex-1 w-24">
                    <div
                      className="h-full bg-red-600 rounded"
                      style={{
                        width: `${
                          totalComments > 0
                            ? (classificationCount.spam / totalComments) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">
                    {spamComments}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Off-Topic</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-yellow-200 rounded flex-1 w-24">
                    <div
                      className="h-full bg-yellow-600 rounded"
                      style={{
                        width: `${
                          totalComments > 0
                            ? (classificationCount.off_topic / totalComments) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-8">
                    {classificationCount.off_topic}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
