import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

export function NotificationToast({
  notification,
  onDismiss,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(notification.id), 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case "high_priority":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "medium_priority":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case "spam":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case "high_priority":
        return "bg-red-50 border-red-200";
      case "medium_priority":
        return "bg-orange-50 border-orange-200";
      case "spam":
        return "bg-red-50 border-red-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-green-50 border-green-200";
    }
  };

  const getTextColor = () => {
    switch (notification.type) {
      case "high_priority":
        return "text-red-900";
      case "medium_priority":
        return "text-orange-900";
      case "spam":
        return "text-red-900";
      case "info":
        return "text-blue-900";
      default:
        return "text-green-900";
    }
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      }`}
    >
      <div
        className={`flex items-start gap-3 p-4 rounded-lg border ${getBackgroundColor()} shadow-lg animate-in slide-in-from-right`}
      >
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${getTextColor()}`}>
            {notification.title}
          </h3>
          <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
            {notification.message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onDismiss(notification.id), 300);
          }}
          className={`flex-shrink-0 ${getTextColor()} hover:opacity-70 transition-opacity`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
