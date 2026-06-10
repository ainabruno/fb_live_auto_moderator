import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useLocation } from "wouter";
import {
  Play,
  Pause,
  StopCircle,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  Send,
  Zap,
} from "lucide-react";

export default function AutomationControls() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [automationState, setAutomationState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch active session
  const { data: activeSession } = trpc.moderation.getActiveSession.useQuery(
    undefined,
    { enabled: !!user }
  );

  useEffect(() => {
    if (activeSession) {
      setSessionId(activeSession.id);
    }
  }, [activeSession]);

  // Poll automation state
  useEffect(() => {
    if (!sessionId) return;

    const interval = setInterval(async () => {
      try {
        // In a real implementation, you would fetch the automation state
        // For now, we'll show a mock state
        setAutomationState({
          sessionId,
          isRunning: true,
          isPaused: false,
          commentsProcessed: 42,
          responsesGenerated: 38,
          responsesSent: 35,
          currentTranscript:
            "Welcome to our live stream. Today we're discussing AI and automation...",
          errors: [],
          lastActivityTime: new Date(),
        });
      } catch (error) {
        console.error("Failed to fetch automation state:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId]);

  const handleStartAutomation = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      // In a real implementation, call the startAutomation tRPC procedure
      setAutomationState((prev: any) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseAutomation = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      // In a real implementation, call the pauseAutomation tRPC procedure
      setAutomationState((prev: any) => ({
        ...prev,
        isPaused: true,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeAutomation = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      // In a real implementation, call the resumeAutomation tRPC procedure
      setAutomationState((prev: any) => ({
        ...prev,
        isPaused: false,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopAutomation = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      // In a real implementation, call the stopAutomation tRPC procedure
      setAutomationState((prev: any) => ({
        ...prev,
        isRunning: false,
        isPaused: false,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to continue</p>
          <Button onClick={() => setLocation("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No active session found</p>
          <Button onClick={() => setLocation("/dashboard")}>
            Create Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Automation Controls
          </h1>
          <p className="text-slate-600">
            Manage your live moderation automation
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6 p-6 border-0 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {automationState?.isRunning ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold text-green-600">
                    Automation Running
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-lg font-semibold text-gray-600">
                    Automation Stopped
                  </span>
                </>
              )}
            </div>
            {automationState?.isPaused && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                Paused
              </Badge>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3">
            {!automationState?.isRunning ? (
              <Button
                onClick={handleStartAutomation}
                disabled={isLoading}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Start Automation
              </Button>
            ) : automationState?.isPaused ? (
              <Button
                onClick={handleResumeAutomation}
                disabled={isLoading}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Resume
              </Button>
            ) : (
              <Button
                onClick={handlePauseAutomation}
                disabled={isLoading}
                variant="outline"
                className="gap-2"
              >
                {isLoading ? (
                  <Spinner className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
                Pause
              </Button>
            )}

            <Button
              onClick={handleStopAutomation}
              disabled={isLoading || !automationState?.isRunning}
              variant="destructive"
              className="gap-2"
            >
              {isLoading ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <StopCircle className="w-4 h-4" />
              )}
              Stop
            </Button>
          </div>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 border-0 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-slate-600">
                Comments Processed
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {automationState?.commentsProcessed || 0}
            </p>
          </Card>

          <Card className="p-4 border-0 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-slate-600">
                Responses Generated
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {automationState?.responsesGenerated || 0}
            </p>
          </Card>

          <Card className="p-4 border-0 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Send className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-slate-600">
                Responses Sent
              </span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {automationState?.responsesSent || 0}
            </p>
          </Card>

          <Card className="p-4 border-0 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-slate-600">
                Last Activity
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {automationState?.lastActivityTime
                ? new Date(
                    automationState.lastActivityTime
                  ).toLocaleTimeString()
                : "N/A"}
            </p>
          </Card>
        </div>

        {/* Transcript Display */}
        <Card className="p-6 border-0 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            Live Transcript
          </h2>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 min-h-24 max-h-40 overflow-y-auto">
            <p className="text-slate-700 leading-relaxed">
              {automationState?.currentTranscript ||
                "Waiting for transcript..."}
            </p>
          </div>
        </Card>

        {/* Error Log */}
        {automationState?.errors && automationState.errors.length > 0 && (
          <Card className="p-6 border-0 shadow-lg border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-slate-900">
                Recent Errors
              </h2>
            </div>
            <div className="space-y-2">
              {automationState.errors.map((error: string, idx: number) => (
                <div
                  key={idx}
                  className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Success Message */}
        {automationState?.isRunning && !automationState?.errors?.length && (
          <Card className="p-6 border-0 shadow-lg border-l-4 border-l-green-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 font-medium">
                Automation is running smoothly. All systems operational.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
