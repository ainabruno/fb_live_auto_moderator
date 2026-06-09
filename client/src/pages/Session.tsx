import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import {
  Loader2,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Zap,
} from "lucide-react";

export default function Session() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/session/:id");
  const sessionId = params?.id ? parseInt(params.id) : null;

  const [liveContext, setLiveContext] = useState("");
  const [contextUpdating, setContextUpdating] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "approve" | "reject" | "send" | null;
    responseId?: number;
  }>({ open: false, type: null });

  // Queries
  const sessionQuery = trpc.moderation.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: isAuthenticated && !!sessionId }
  );

  const pendingCommentsQuery = trpc.moderation.getPendingComments.useQuery(
    { sessionId: sessionId! },
    { enabled: isAuthenticated && !!sessionId, refetchInterval: 3000 }
  );

  const pendingResponsesQuery = trpc.moderation.getPendingResponses.useQuery(
    { sessionId: sessionId! },
    { enabled: isAuthenticated && !!sessionId, refetchInterval: 3000 }
  );

  // Mutations
  const updateContextMutation = trpc.moderation.updateContext.useMutation({
    onSuccess: () => {
      toast.success("Context updated successfully!");
      setContextUpdating(false);
    },
    onError: (error) => {
      toast.error(`Failed to update context: ${error.message}`);
      setContextUpdating(false);
    },
  });

  const generateResponseMutation = trpc.moderation.generateCommentResponse.useMutation({
    onSuccess: () => {
      toast.success("Response generated!");
      pendingResponsesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to generate response: ${error.message}`);
    },
  });

  const approveResponseMutation = trpc.moderation.approveResponse.useMutation({
    onSuccess: () => {
      toast.success("Response approved!");
      pendingResponsesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to approve response: ${error.message}`);
    },
  });

  const rejectResponseMutation = trpc.moderation.rejectResponse.useMutation({
    onSuccess: () => {
      toast.success("Response rejected");
      pendingResponsesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to reject response: ${error.message}`);
    },
  });

  const sendResponseMutation = trpc.moderation.sendResponse.useMutation({
    onSuccess: () => {
      toast.success("Response sent!");
      pendingResponsesQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to send response: ${error.message}`);
    },
  });

  useEffect(() => {
    if (sessionQuery.data && !liveContext) {
      setLiveContext(sessionQuery.data.liveContext || "");
    }
  }, [sessionQuery.data]);

  if (!isAuthenticated || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <Button onClick={() => setLocation("/dashboard" as any)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const session = sessionQuery.data;
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Session not found</h1>
          <Button onClick={() => setLocation("/dashboard" as any)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const classificationColors: Record<string, string> = {
    question: "bg-blue-100 text-blue-800",
    gratitude: "bg-green-100 text-green-800",
    spam: "bg-red-100 text-red-800",
    off_topic: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/dashboard" as any)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Live Moderation Session
              </h1>
              <p className="text-sm text-slate-600">
                Page: {session.facebookPageId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Context Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Live Context</CardTitle>
                <CardDescription>
                  Paste your live topic or transcript
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter the current live topic, transcript, or key points..."
                  value={liveContext}
                  onChange={(e) => setLiveContext(e.target.value)}
                  className="min-h-40 resize-none"
                />
                <Button
                  onClick={() => {
                    setContextUpdating(true);
                    updateContextMutation.mutate({
                      sessionId: session.id,
                      liveContext,
                    });
                  }}
                  disabled={contextUpdating || updateContextMutation.isPending}
                  className="w-full"
                >
                  {contextUpdating || updateContextMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Update Context
                </Button>
                <p className="text-xs text-slate-500">
                  {liveContext.length} characters
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Comments & Responses */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="comments" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="comments">
                  Comments ({pendingCommentsQuery.data?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="responses">
                  Responses ({pendingResponsesQuery.data?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Comments Tab */}
              <TabsContent value="comments">
                <div className="space-y-4">
                  {pendingCommentsQuery.isLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </CardContent>
                    </Card>
                  ) : pendingCommentsQuery.data?.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8 text-slate-600">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        No pending comments
                      </CardContent>
                    </Card>
                  ) : (
                    pendingCommentsQuery.data?.map((comment) => (
                      <Card key={comment.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {comment.userName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(comment.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={classificationColors[comment.classification] || ""}>
                                {comment.classification}
                              </Badge>
                              <Badge variant="outline">
                                Priority: {comment.priority}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-slate-700 mb-4">{comment.message}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                generateResponseMutation.mutate({
                                  commentId: comment.id,
                                  sessionId: session.id,
                                });
                              }}
                              disabled={generateResponseMutation.isPending}
                              className="gap-2"
                            >
                              {generateResponseMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                              Generate Response
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Responses Tab */}
              <TabsContent value="responses">
                <div className="space-y-4">
                  {pendingResponsesQuery.isLoading ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </CardContent>
                    </Card>
                  ) : pendingResponsesQuery.data?.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8 text-slate-600">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        No pending responses
                      </CardContent>
                    </Card>
                  ) : (
                    pendingResponsesQuery.data?.map((response) => (
                      <Card
                        key={response.id}
                        className={`border-l-4 ${
                          response.status === "approved"
                            ? "border-l-green-500"
                            : "border-l-yellow-500"
                        }`}
                      >
                        <CardContent className="pt-6">
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge
                                variant={
                                  response.status === "approved"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {response.status}
                              </Badge>
                              <Badge variant="outline">
                                {response.responseLanguage}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">
                              Grounded in context:{" "}
                              {response.isGroundedInContext ? (
                                <CheckCircle className="w-4 h-4 inline text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 inline text-yellow-600" />
                              )}
                            </p>
                          </div>
                          <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-1">
                              Generated Response:
                            </p>
                            <p className="text-slate-700">{response.responseText}</p>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {response.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      type: "approve",
                                      responseId: response.id,
                                    });
                                  }}
                                  disabled={approveResponseMutation.isPending}
                                  className="gap-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setConfirmDialog({
                                      open: true,
                                      type: "reject",
                                      responseId: response.id,
                                    });
                                  }}
                                  disabled={rejectResponseMutation.isPending}
                                  className="gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {response.status === "approved" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setConfirmDialog({
                                    open: true,
                                    type: "send",
                                    responseId: response.id,
                                  });
                                }}
                                disabled={sendResponseMutation.isPending}
                                className="gap-2"
                              >
                                {sendResponseMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MessageSquare className="w-4 h-4" />
                                )}
                                Send to Facebook
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === "approve"}
        title="Approve Response?"
        description="This response will be marked as approved and ready to send to Facebook."
        actionLabel="Approve"
        onConfirm={() => {
          if (confirmDialog.responseId) {
            approveResponseMutation.mutate({
              responseId: confirmDialog.responseId,
            });
          }
          setConfirmDialog({ open: false, type: null });
        }}
        onCancel={() => setConfirmDialog({ open: false, type: null })}
        isLoading={approveResponseMutation.isPending}
      />

      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === "reject"}
        title="Reject Response?"
        description="This response will be discarded and not sent to Facebook."
        actionLabel="Reject"
        isDestructive
        onConfirm={() => {
          if (confirmDialog.responseId) {
            rejectResponseMutation.mutate({
              responseId: confirmDialog.responseId,
            });
          }
          setConfirmDialog({ open: false, type: null });
        }}
        onCancel={() => setConfirmDialog({ open: false, type: null })}
        isLoading={rejectResponseMutation.isPending}
      />

      <ConfirmDialog
        open={confirmDialog.open && confirmDialog.type === "send"}
        title="Send to Facebook?"
        description="This response will be posted as a comment on the Facebook Live video."
        actionLabel="Send"
        onConfirm={() => {
          if (confirmDialog.responseId) {
            sendResponseMutation.mutate({
              responseId: confirmDialog.responseId,
            });
          }
          setConfirmDialog({ open: false, type: null });
        }}
        onCancel={() => setConfirmDialog({ open: false, type: null })}
        isLoading={sendResponseMutation.isPending}
      />
    </div>
  );
}
