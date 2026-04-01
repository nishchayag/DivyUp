"use client";

import { useEffect, useState } from "react";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  kind: "comment" | "payment" | "settled" | "reminder" | "system";
  readAt?: string;
  link?: string;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    load();
  };

  if (loading) {
    return (
      <div className="text-sm text-slate-500">Loading notifications...</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Notifications
        </h1>
        <button
          onClick={markAllRead}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
        >
          Mark all read
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="surface-card rounded-xl p-4 text-sm text-slate-500">
            No notifications yet.
          </div>
        ) : (
          notifications.map((item) => (
            <div key={item._id} className="surface-card rounded-xl p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-slate-900 dark:text-white">
                  {item.title}
                </p>
                {!item.readAt && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                    New
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {item.message}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {new Date(item.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
