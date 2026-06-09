import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap, AlertCircle, CheckCircle, MessageSquare, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface TestResult {
  sampleComment: string;
  detectedLanguage: string;
  languageEnabled: boolean;
  classification: {
    type: string;
    confidence: number;
  };
  isSpam?: boolean;
  priority: {
    score: number;
    level: string;
  };
  response: string | null;
  responseConfidence: number;
  wouldAutoApprove?: boolean;
  settings: {
    autoApproveEnabled: boolean;
    spamFilterEnabled: boolean;
    responseDelaySeconds: number;
    maxRepliesPerMinute: number;
  };
}

export function TestModerationTab() {
  const [sampleComment, setSampleComment] = useState("");
  const [liveContext, setLiveContext] = useState("");
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const testModerationQuery = trpc.moderation.testModeration.useQuery(
    {
      sampleComment,
      liveContext: liveContext || undefined,
    },
    {
      enabled: false,
    }
  );

  const handleTest = async () => {
    if (!sampleComment.trim()) {
      toast.error("Please enter a sample comment");
      return;
    }

    setIsLoading(true);
    try {
      const result = await testModerationQuery.refetch();
      if (result.data) {
        setTestResult(result.data);
        toast.success("Moderation test completed!");
      }
    } catch (error: any) {
      toast.error(`Test failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSampleComment("");
    setLiveContext("");
    setTestResult(null);
    toast.success("Test cleared");
  };

  const getClassificationColor = (type: string) => {
    switch (type) {
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

  const getPriorityColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case "mg":
        return "Malagasy";
      case "fr":
        return "French";
      case "en":
        return "English";
      default:
        return code;
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Test Comment</CardTitle>
          <CardDescription>
            Enter a sample comment to see how your current moderation rules would handle it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sample Comment Input */}
          <div className="space-y-2">
            <Label htmlFor="sample-comment" className="font-semibold">
              Sample Comment
            </Label>
            <Textarea
              id="sample-comment"
              placeholder="Enter a sample comment to test (e.g., 'How much does this cost?')"
              value={sampleComment}
              onChange={(e) => setSampleComment(e.target.value)}
              rows={3}
            />
          </div>

          {/* Live Context Input (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="live-context" className="font-semibold">
              Live Context (Optional)
            </Label>
            <Textarea
              id="live-context"
              placeholder="Enter the current live topic or transcript (helps with more accurate classification)"
              value={liveContext}
              onChange={(e) => setLiveContext(e.target.value)}
              rows={2}
            />
          </div>

          {/* Test Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              disabled={isLoading || !sampleComment.trim()}
              className="flex-1 gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Test Moderation
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isLoading || (!sampleComment && !liveContext && !testResult)}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {testResult && (
        <div className="space-y-4">
          {/* Test Result Header */}
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                How your current settings would handle this comment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Detection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Detected Language
                </Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {getLanguageName(testResult.detectedLanguage)}
                  </Badge>
                  {!testResult.languageEnabled && (
                    <Badge variant="destructive">Not Enabled</Badge>
                  )}
                </div>
              </div>

              {/* Classification */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Classification
                </Label>
                <div className="flex items-center gap-3">
                  <Badge className={getClassificationColor(testResult.classification.type)}>
                    {testResult.classification.type.replace("_", " ")}
                  </Badge>
                  <div className="text-sm text-slate-600">
                    Confidence:{" "}
                    <span className="font-semibold">
                      {(testResult.classification.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Spam Detection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Spam Detection
                </Label>
                <div className="flex items-center gap-2">
                  {testResult.isSpam ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <Badge variant="destructive">Flagged as Spam</Badge>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <Badge variant="outline">Not Spam</Badge>
                    </>
                  )}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">
                  Priority
                </Label>
                <div className="flex items-center gap-3">
                  <Badge className={getPriorityColor(testResult.priority.level)}>
                    {testResult.priority.level.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-slate-600">
                    Score:{" "}
                    <span className="font-semibold">
                      {testResult.priority.score}/100
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Section */}
          {testResult.response && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Generated Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="text-slate-900">{testResult.response}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">
                      Response Confidence
                    </Label>
                    <p className="text-lg font-semibold text-slate-900">
                      {(testResult.responseConfidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600">
                      Auto-Approval
                    </Label>
                    <p className="text-lg font-semibold">
                      {testResult.wouldAutoApprove ? (
                        <span className="text-green-600">✓ Would Approve</span>
                      ) : (
                        <span className="text-yellow-600">✗ Needs Review</span>
                      )}
                    </p>
                  </div>
                </div>

                {testResult.wouldAutoApprove && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      This response would be automatically approved and sent based on your current settings.
                    </AlertDescription>
                  </Alert>
                )}

                {!testResult.wouldAutoApprove && testResult.response && (
                  <Alert className="bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      This response would require manual review before sending.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Response Section */}
          {!testResult.response && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-900">No Response Generated</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      {testResult.isSpam
                        ? "This comment was flagged as spam, so no response would be generated."
                        : !testResult.languageEnabled
                          ? `Language (${getLanguageName(testResult.detectedLanguage)}) is not enabled in your settings.`
                          : "The AI could not generate a confident response for this comment."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Settings Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-semibold text-slate-600">
                    Auto-Approval
                  </Label>
                  <p className="text-slate-900">
                    {testResult.settings.autoApproveEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">
                    Spam Filter
                  </Label>
                  <p className="text-slate-900">
                    {testResult.settings.spamFilterEnabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">
                    Response Delay
                  </Label>
                  <p className="text-slate-900">
                    {testResult.settings.responseDelaySeconds}s
                  </p>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600">
                    Max Replies/Min
                  </Label>
                  <p className="text-slate-900">
                    {testResult.settings.maxRepliesPerMinute}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!testResult && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="pt-12 pb-12 text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">
              Enter a sample comment above and click "Test Moderation" to see how your current rules would handle it.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
