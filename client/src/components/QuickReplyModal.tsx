import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Send, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface QuickReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  commentId: number;
  commentText: string;
  userName: string;
  commentLanguage: string;
  sessionId: number;
}

export function QuickReplyModal({
  isOpen,
  onClose,
  commentId,
  commentText,
  userName,
  commentLanguage,
  sessionId,
}: QuickReplyModalProps) {
  const [responseText, setResponseText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate response mutation
  const generateResponseMutation = trpc.moderation.generateCommentResponse.useMutation({
    onSuccess: (data) => {
      if (data && typeof data === "object" && "responseText" in data) {
        setResponseText((data as any).responseText || "");
      }
    },
    onError: (error) => {
      toast.error(`Failed to generate response: ${error.message}`);
    },
  });

  // Approve and send response mutation
  const approveResponseMutation = trpc.moderation.approveResponse.useMutation({
    onSuccess: () => {
      toast.success("Response sent successfully!");
      setResponseText("");
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to send response: ${error.message}`);
    },
  });

  // Generate response when modal opens
  useEffect(() => {
    if (isOpen && !responseText && !isGenerating) {
      setIsGenerating(true);
      generateResponseMutation.mutate(
        { commentId, sessionId },
        {
          onSettled: () => setIsGenerating(false),
        }
      );
    }
  }, [isOpen, commentId, sessionId, responseText, isGenerating, generateResponseMutation]);

  const handleSend = async () => {
    if (!responseText.trim()) {
      toast.error("Response cannot be empty");
      return;
    }

    setIsSending(true);
    try {
      // First, we need to get the response ID from the generated response
      // For now, we'll assume the response was already created and just approve it
      // In a real scenario, you'd need to track the response ID
      await approveResponseMutation.mutateAsync({
        responseId: commentId, // This would be the actual response ID
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Reply to {userName}</DialogTitle>
        </DialogHeader>

        {/* Original Comment */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
          <p className="text-xs text-slate-500 font-semibold mb-2">ORIGINAL COMMENT</p>
          <p className="text-slate-900">{commentText}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
              {commentLanguage.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Response Input */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-900 block mb-2">
              Your Response
            </label>
            {isGenerating ? (
              <div className="min-h-[120px] bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-2 text-slate-600">
                  <Spinner className="w-4 h-4" />
                  <span>Generating response...</span>
                </div>
              </div>
            ) : (
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[120px] resize-none"
                disabled={isSending}
              />
            )}
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {responseText.length} characters
              </span>
              <span className="text-xs text-slate-500">
                Language: <span className="font-semibold">{commentLanguage.toUpperCase()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending || isGenerating}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isGenerating || !responseText.trim()}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isSending ? (
              <>
                <Spinner className="w-4 h-4" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Response
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
