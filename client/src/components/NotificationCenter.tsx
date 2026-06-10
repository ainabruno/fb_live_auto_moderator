import { Bell, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  highPriorityCount: number;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function NotificationCenter({
  notifications,
  unreadCount,
  highPriorityCount,
  onMarkAsRead,
  onClearAll,
  onClose,
}: NotificationCenterProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "high_priority":
        return "bg-red-100 text-red-800";
      case "medium_priority":
        return "bg-orange-100 text-orange-800";
      case "spam":
        return "bg-red-100 text-red-800";
      case "info":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "high_priority":
        return "🔴 High Priority";
      case "medium_priority":
        return "🟠 Medium Priority";
      case "spam":
        return "⛔ Spam";
      case "info":
        return "ℹ️ Info";
      default:
        return "Info";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center sm:justify-end">
      <Card className="w-full sm:w-96 h-screen sm:h-auto sm:max-h-[600px] rounded-none sm:rounded-lg flex flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {highPriorityCount > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-900">
                🔴 {highPriorityCount} High-Priority Question
                {highPriorityCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  notification.read
                    ? "bg-slate-50 border-slate-200"
                    : "bg-blue-50 border-blue-200"
                }`}
                onClick={() => onMarkAsRead(notification.id)}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(notification.type)}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">
                  {notification.title}
                </h3>
                <p className="text-sm text-slate-700 mt-1">
                  {notification.message}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-slate-200 p-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onClearAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
