import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import notificationService from "../services/notificationService";

const NotificationContext = createContext(null);
const POLL_MS = 60000; // refresh once a minute

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setNotifications(await notificationService.getNotifications());
    } catch {
      /* keep the previous list; the bell just won't update this round */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      return undefined;
    }
    setLoading(true);
    refresh();
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
  }, [userId, refresh]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    try {
      await notificationService.markAsRead(id);
    } catch {
      refresh();
    }
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((items) => items.map((item) => ({ ...item, is_read: true })));
    try {
      await notificationService.markAllAsRead();
    } catch {
      refresh();
    }
  }, [refresh]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  const value = useMemo(
    () => ({ notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh }),
    [notifications, unreadCount, loading, markAsRead, markAllAsRead, refresh],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications must be used inside NotificationProvider");
  return context;
}
