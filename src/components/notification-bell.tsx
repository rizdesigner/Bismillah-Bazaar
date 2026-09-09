"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "./session-provider";
import { createClient } from "@/lib/supabase-client";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  orderId: string;
};

export function NotificationBell() {
  const { profile } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    if (!profile?.id) {
      return;
    }
    
    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("NotificationBell: Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();

      // Real-time push: server broadcasts to notif:<userId> on every action.
      const supabase = createClient();
      const realtimeChannel = supabase.channel(`notif:${profile.id}`);
      realtimeChannel
        .on("broadcast", { event: "notification" }, (payload) => {
          const n = payload.payload as Notification;
          setNotifications((prev) => [
            n,
            ...prev.filter((x) => x.id !== n.id),
          ]);
        })
        .subscribe();

      intervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        supabase.removeChannel(realtimeChannel);
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [profile?.id]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  console.log('[NotificationBell] Component loaded, profile:', profile);

  if (!profile) {
    return (
      <div className="bg-yellow-400 text-black px-3 py-1 text-sm font-bold border-2 border-black">
        BELL: NO PROFILE
      </div>
    );
  }

  console.log('[NotificationBell] Rendering for profile:', profile.id, 'unread:', unreadCount);

  return (
    <div className="relative flex items-center gap-1 bg-yellow-200 px-2 py-1 border-2 border-red-500">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-2 border-red-500 bg-white shadow-sm"
        title="Notifications"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      <span className="text-xs font-bold text-red-600">BELL</span>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 sm:px-4 sm:py-3">
            <h3 className="text-xs font-semibold text-zinc-900 sm:text-sm">
              Notifications
            </h3>
            <div className="flex gap-2">
              <button
                onClick={fetchNotifications}
                className="text-[10px] text-zinc-600 hover:text-zinc-900 sm:text-xs"
                title="Refresh"
              >
                Refresh
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-emerald-600 hover:text-emerald-500 sm:text-xs"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto sm:max-h-96">
            {loading ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-500 sm:px-4 sm:py-8 sm:text-sm">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-500 sm:px-4 sm:py-8 sm:text-sm">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-zinc-100 px-3 py-2 sm:px-4 sm:py-3 ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-zinc-900 sm:text-sm">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 whitespace-pre-line text-[10px] text-zinc-600 sm:mt-1 sm:text-xs">
                        {notification.message}
                      </p>
                      <p className="mt-0.5 text-[9px] text-zinc-400 sm:mt-1 sm:text-xs">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="ml-1.5 text-[9px] text-emerald-600 hover:text-emerald-500 sm:ml-2 sm:text-xs"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
