import { Bell, CheckCheck } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useNotifications } from "../context/NotificationContext";
import { timeAgo } from "../utils/dateTime";

export default function Notifications() {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  return (
    <>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification(s).`}
        action={<Button variant="secondary" onClick={markAllAsRead} disabled={unreadCount === 0}><CheckCheck size={16} /> Mark all as read</Button>}
      />
      <Card>
        {loading && notifications.length === 0 ? (
          <div className="flex justify-center p-12"><LoadingSpinner /></div>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.is_read && markAsRead(item.id)}
                className={`flex w-full gap-4 p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!item.is_read ? "bg-blue-50/50 dark:bg-blue-950/10" : ""}`}
              >
                <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/50"><Bell size={19} /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-slate-800 dark:text-white">{item.title}</p>
                    <span className="shrink-0 text-xs text-slate-400">{timeAgo(item.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                </div>
                {!item.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
