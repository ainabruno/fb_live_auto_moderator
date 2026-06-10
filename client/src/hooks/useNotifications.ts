import { useState, useCallback, useEffect } from "react";

export interface Notification {
  id: string;
  type: "high_priority" | "medium_priority" | "spam" | "info";
  title: string;
  message: string;
  priority?: number;
  timestamp: Date;
  read: boolean;
}

const NOTIFICATION_DURATION = 5000; // 5 seconds
const DEBOUNCE_DURATION = 2000; // 2 seconds

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play notification sound
  const playSound = useCallback(() => {
    if (!soundEnabled) return;

    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn("Could not play notification sound:", error);
    }
  }, [soundEnabled]);

  // Add notification with debouncing
  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const now = Date.now();

      // Debounce: don't show notifications too frequently
      if (now - lastNotificationTime < DEBOUNCE_DURATION) {
        return;
      }

      setLastNotificationTime(now);

      const newNotification: Notification = {
        ...notification,
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Play sound for high-priority notifications
      if (notification.type === "high_priority") {
        playSound();
      }

      // Auto-dismiss after duration
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== newNotification.id)
        );
      }, NOTIFICATION_DURATION);
    },
    [lastNotificationTime, playSound]
  );

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Get high-priority count
  const highPriorityCount = notifications.filter(
    (n) => n.type === "high_priority"
  ).length;

  return {
    notifications,
    addNotification,
    markAsRead,
    clearAll,
    unreadCount,
    highPriorityCount,
    soundEnabled,
    setSoundEnabled,
  };
}
