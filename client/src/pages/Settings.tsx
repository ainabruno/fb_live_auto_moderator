import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  ArrowLeft,
  Trash2,
  Plus,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

export default function Settings() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [formData, setFormData] = useState({
    autoApproveResponses: false,
    responseDelaySeconds: 0,
    maxRepliesPerMinute: 10,
    spamFilterEnabled: true,
    blockedKeywords: [] as string[],
    enableMalagasy: true,
    enableFrench: true,
    enableEnglish: true,
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const settingsQuery = trpc.moderation.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const updateSettingsMutation = trpc.moderation.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved successfully!");
      setIsSaving(false);
      settingsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
      setIsSaving(false);
    },
  });

  // Load settings when query completes
  useEffect(() => {
    if (settingsQuery.data) {
      setFormData({
        autoApproveResponses: settingsQuery.data.autoApproveResponses || false,
        responseDelaySeconds: settingsQuery.data.responseDelaySeconds || 0,
        maxRepliesPerMinute: settingsQuery.data.maxRepliesPerMinute || 10,
        spamFilterEnabled: settingsQuery.data.spamFilterEnabled !== false,
        blockedKeywords: settingsQuery.data.blockedKeywords
          ? JSON.parse(settingsQuery.data.blockedKeywords)
          : [],
        enableMalagasy: settingsQuery.data.enableMalagasy !== false,
        enableFrench: settingsQuery.data.enableFrench !== false,
        enableEnglish: settingsQuery.data.enableEnglish !== false,
      });
    }
  }, [settingsQuery.data]);

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

  const handleSaveSettings = () => {
    setIsSaving(true);
    updateSettingsMutation.mutate({
      autoApproveResponses: formData.autoApproveResponses,
      responseDelaySeconds: formData.responseDelaySeconds,
      maxRepliesPerMinute: formData.maxRepliesPerMinute,
      spamFilterEnabled: formData.spamFilterEnabled,
      blockedKeywords: formData.blockedKeywords,
      enableMalagasy: formData.enableMalagasy,
      enableFrench: formData.enableFrench,
      enableEnglish: formData.enableEnglish,
    });
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      setFormData({
        ...formData,
        blockedKeywords: [...formData.blockedKeywords, newKeyword.trim()],
      });
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setFormData({
      ...formData,
      blockedKeywords: formData.blockedKeywords.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                Moderation Settings
              </h1>
              <p className="text-sm text-slate-600">
                Customize your AI moderation rules and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {settingsQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <Tabs defaultValue="approval" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="approval" className="gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Approval</span>
              </TabsTrigger>
              <TabsTrigger value="spam" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Spam</span>
              </TabsTrigger>
              <TabsTrigger value="languages" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Languages</span>
              </TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* Approval Tab */}
            <TabsContent value="approval">
              <Card>
                <CardHeader>
                  <CardTitle>Auto-Approval Settings</CardTitle>
                  <CardDescription>
                    Configure how responses are automatically approved and sent
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Auto-Approve Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <Label className="text-base font-semibold text-slate-900">
                        Enable Auto-Approval
                      </Label>
                      <p className="text-sm text-slate-600 mt-1">
                        Automatically approve and send responses that are grounded in your live context with high confidence
                      </p>
                    </div>
                    <Switch
                      checked={formData.autoApproveResponses}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          autoApproveResponses: checked,
                        })
                      }
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>How it works:</strong> When enabled, responses will be automatically approved if they are grounded in your live context and have a confidence score of 70% or higher. You can still manually review and reject responses before they're sent.
                    </p>
                  </div>

                  {/* Response Delay */}
                  <div className="space-y-2">
                    <Label htmlFor="delay" className="text-base font-semibold">
                      Response Delay
                    </Label>
                    <p className="text-sm text-slate-600">
                      Wait this many seconds before sending responses (0 = immediate)
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        id="delay"
                        type="number"
                        min="0"
                        max="300"
                        value={formData.responseDelaySeconds}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            responseDelaySeconds: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-slate-600">seconds</span>
                    </div>
                  </div>

                  {/* Max Replies Per Minute */}
                  <div className="space-y-2">
                    <Label htmlFor="maxReplies" className="text-base font-semibold">
                      Maximum Replies Per Minute
                    </Label>
                    <p className="text-sm text-slate-600">
                      Limit the number of responses sent per minute to avoid overwhelming your audience
                    </p>
                    <div className="flex items-center gap-4">
                      <Input
                        id="maxReplies"
                        type="number"
                        min="1"
                        max="60"
                        value={formData.maxRepliesPerMinute}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxRepliesPerMinute: parseInt(e.target.value) || 10,
                          })
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-slate-600">responses/min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Spam Tab */}
            <TabsContent value="spam">
              <Card>
                <CardHeader>
                  <CardTitle>Spam Filtering</CardTitle>
                  <CardDescription>
                    Configure spam detection and blocked keywords
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Spam Filter Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <Label className="text-base font-semibold text-slate-900">
                        Enable Spam Filter
                      </Label>
                      <p className="text-sm text-slate-600 mt-1">
                        Automatically detect and flag comments containing blocked keywords
                      </p>
                    </div>
                    <Switch
                      checked={formData.spamFilterEnabled}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          spamFilterEnabled: checked,
                        })
                      }
                    />
                  </div>

                  {/* Blocked Keywords */}
                  {formData.spamFilterEnabled && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-semibold">
                          Blocked Keywords
                        </Label>
                        <p className="text-sm text-slate-600 mt-1 mb-4">
                          Comments containing these keywords will be marked as spam
                        </p>

                        {/* Add Keyword Form */}
                        <div className="flex gap-2 mb-4">
                          <Input
                            placeholder="Enter a keyword to block (e.g., 'buy now', 'click here')"
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                handleAddKeyword();
                              }
                            }}
                          />
                          <Button
                            onClick={handleAddKeyword}
                            disabled={!newKeyword.trim()}
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                        </div>

                        {/* Keywords List */}
                        {formData.blockedKeywords.length > 0 ? (
                          <div className="space-y-2">
                            {formData.blockedKeywords.map((keyword, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                              >
                                <span className="text-sm font-medium text-slate-900">
                                  {keyword}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveKeyword(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 text-center">
                            <p className="text-sm text-slate-600">
                              No blocked keywords yet. Add some to filter spam.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info Box */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-900">
                      <strong>Tip:</strong> Keywords are case-insensitive and match partial text. For example, "buy" will match "buy now", "buying", etc.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Languages Tab */}
            <TabsContent value="languages">
              <Card>
                <CardHeader>
                  <CardTitle>Language Settings</CardTitle>
                  <CardDescription>
                    Enable or disable language support for comment detection and responses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Language Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          Malagasy (mg)
                        </Label>
                        <p className="text-sm text-slate-600 mt-1">
                          Detect and respond to Malagasy comments
                        </p>
                      </div>
                      <Switch
                        checked={formData.enableMalagasy}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            enableMalagasy: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          French (fr)
                        </Label>
                        <p className="text-sm text-slate-600 mt-1">
                          Detect and respond to French comments
                        </p>
                      </div>
                      <Switch
                        checked={formData.enableFrench}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            enableFrench: checked,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <Label className="text-base font-semibold text-slate-900">
                          English (en)
                        </Label>
                        <p className="text-sm text-slate-600 mt-1">
                          Detect and respond to English comments
                        </p>
                      </div>
                      <Switch
                        checked={formData.enableEnglish}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            enableEnglish: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> The AI will automatically detect the language of each comment. Disabling a language will prevent responses from being generated for comments in that language.
                    </p>
                  </div>

                  {/* Active Languages Display */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">
                      Active Languages
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.enableMalagasy && (
                        <Badge variant="default">Malagasy</Badge>
                      )}
                      {formData.enableFrench && (
                        <Badge variant="default">French</Badge>
                      )}
                      {formData.enableEnglish && (
                        <Badge variant="default">English</Badge>
                      )}
                      {!formData.enableMalagasy &&
                        !formData.enableFrench &&
                        !formData.enableEnglish && (
                          <Badge variant="secondary">No languages enabled</Badge>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Additional configuration options for power users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">
                      Advanced settings will be available in future updates. Current settings include:
                    </p>
                    <ul className="text-sm text-slate-600 mt-3 space-y-1 ml-4">
                      <li>• Response confidence thresholds</li>
                      <li>• Custom AI model selection</li>
                      <li>• Webhook integrations</li>
                      <li>• API rate limiting</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Save Button */}
        <div className="mt-8 flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setLocation("/dashboard" as any)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving || updateSettingsMutation.isPending}
            className="gap-2"
          >
            {isSaving || updateSettingsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
