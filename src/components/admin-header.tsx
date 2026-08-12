"use client";

import Link from "next/link";
import { useSession } from "./session-provider";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  orderId: string;
};

export function AdminHeader() {
  const router = useRouter();
  const { profile } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const lastIdsRef = useRef<Set<string>>(new Set());

  const fetchNotifications = async () => {
    if (!profile?.id) return;

    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      const newOnes = data.filter(
        (n: { id: string; read: boolean }) => !lastIdsRef.current.has(n.id) && !n.read
      );

      newOnes.forEach((n: { id: string }) => {
        lastIdsRef.current.add(n.id);
      });

      setNotifications(data);
    } catch (error) {
      console.error("Admin notification fetch error:", error);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 3000);
      return () => clearInterval(interval);
    }
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-base font-bold text-white sm:h-9 sm:w-9 sm:text-lg">
            B
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900 sm:text-sm">
              Bismillah Bazaar
            </p>
            <p className="text-[10px] font-medium text-emerald-700 sm:text-xs">
              Admin Panel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
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
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white sm:h-5 sm:w-5 sm:text-[10px]">
                  {unreadCount}
                </span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg sm:w-96">
                <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 sm:px-4 sm:py-3">
                  <h3 className="text-xs font-semibold text-zinc-900 sm:text-sm">
                    Notifications
                  </h3>
                  <button
                    onClick={fetchNotifications}
                    className="text-[10px] text-zinc-600 hover:text-zinc-900 sm:text-xs"
                  >
                    Refresh
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto sm:max-h-96">
                  {notifications.length === 0 ? (
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

          <nav className="flex items-center gap-2 text-xs sm:gap-4 sm:text-sm">
            <span className="text-zinc-600">
              {profile?.email}
            </span>
            <Link
              href="/admin/settings"
              className="text-zinc-600 hover:text-emerald-600"
            >
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="text-zinc-600 hover:text-emerald-600"
            >
              Logout
            </button>
            <Link
              href="/"
              className="text-zinc-600 hover:text-emerald-600"
            >
              View Site
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
