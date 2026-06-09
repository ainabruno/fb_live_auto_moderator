import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Plus, Settings, History, Sliders } from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [showNewSession, setShowNewSession] = useState(false);
  const [formData, setFormData] = useState({
    facebookPageId: "",
    facebookAccessToken: "",
    liveVideoId: "",
  });

  // Queries
  const activeSessionQuery = trpc.moderation.getActiveSession.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const settingsQuery = trpc.moderation.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createSessionMutation = trpc.moderation.createSession.useMutation({
    onSuccess: () => {
      toast.success("Session created successfully!");
      setFormData({ facebookPageId: "", facebookAccessToken: "", liveVideoId: "" });
      setShowNewSession(false);
      activeSessionQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create session: ${error.message}`);
    },
  });

  const endSessionMutation = trpc.moderation.endSession.useMutation({
    onSuccess: () => {
      toast.success("Session ended");
      activeSessionQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to end session: ${error.message}`);
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <Button onClick={() => setLocation("/" as any)}>Go Home</Button>
        </div>
      </div>
    );
  }

  const activeSession = activeSessionQuery.data;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-600">Welcome, {user?.name || "User"}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/settings" as any)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Session Card */}
        {activeSession ? (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Active Moderation Session</CardTitle>
              <CardDescription className="text-blue-800">
                Page ID: {activeSession.facebookPageId}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">
                    Started: {new Date(activeSession.createdAt).toLocaleString()}
                  </p>
                  {activeSession.liveVideoId && (
                    <p className="text-sm text-slate-600">
                      Video ID: {activeSession.liveVideoId}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setLocation("/settings" as any)}
                    className="gap-2"
                  >
                    <Sliders className="w-4 h-4" />
                    Go to Settings
                  </Button>
                  <Button
                    onClick={() => endSessionMutation.mutate({ sessionId: activeSession.id })}
                    variant="destructive"
                    disabled={endSessionMutation.isPending}
                  >
                    {endSessionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "End Session"
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Tabs */}
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Moderation Sessions</CardTitle>
                    <CardDescription>
                      Create and manage your live moderation sessions
                    </CardDescription>
                  </div>
                  {!activeSession && (
                    <Button
                      onClick={() => setShowNewSession(!showNewSession)}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      New Session
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {showNewSession && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-slate-900 mb-4">
                      Create New Session
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="pageId">Facebook Page ID *</Label>
                        <Input
                          id="pageId"
                          placeholder="Your Facebook Page ID"
                          value={formData.facebookPageId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              facebookPageId: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="token">Facebook Access Token *</Label>
                        <Input
                          id="token"
                          type="password"
                          placeholder="Your access token"
                          value={formData.facebookAccessToken}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              facebookAccessToken: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="videoId">Live Video ID (Optional)</Label>
                        <Input
                          id="videoId"
                          placeholder="Your live video ID"
                          value={formData.liveVideoId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              liveVideoId: e.target.value,
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2 pt-4">
                        <Button
                          onClick={() => {
                            createSessionMutation.mutate({
                              facebookPageId: formData.facebookPageId,
                              facebookAccessToken: formData.facebookAccessToken,
                              liveVideoId: formData.liveVideoId || undefined,
                            });
                          }}
                          disabled={
                            !formData.facebookPageId ||
                            !formData.facebookAccessToken ||
                            createSessionMutation.isPending
                          }
                        >
                          {createSessionMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : null}
                          Create Session
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowNewSession(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {activeSessionQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                  </div>
                ) : activeSession ? (
                  <div className="text-center py-8 text-slate-600">
                    You have an active session. End it to create a new one.
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-600">
                    No active sessions. Create one to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Moderation Settings</CardTitle>
                <CardDescription>
                  Configure your moderation preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-slate-600 mb-4">
                    Access the full settings panel to customize your AI moderation rules.
                  </p>
                  <Button onClick={() => setLocation("/settings" as any)}>
                    Go to Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Response History</CardTitle>
                <CardDescription>
                  View all sent responses and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-slate-600">
                  Start a session to view response history.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
