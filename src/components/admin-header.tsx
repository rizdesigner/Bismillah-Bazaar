"use client";

import Link from "next/link";
import { useSession } from "./session-provider";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase-client";
import { NotificationSoundToggle } from "./notification-sound-toggle";

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
  const { profile } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const lastIdsRef = useRef<Set<string>>(new Set());
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMenu]);

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

      const supabase = createClient();
      const realtimeChannel = supabase
        .channel(`notifications-insert-admin-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            const row = payload.new as any;
            if (!row?.id) return;
            const n: Notification = {
              id: row.id,
              type: row.type ?? "",
              title: row.title ?? "",
              message: row.message ?? "",
              read: false,
              createdAt: row.created_at,
              orderId: row.order_id ?? "",
            };
            setNotifications((prev) => [
              n,
              ...prev.filter((x) => x.id !== n.id),
            ]);
          }
        )
        .subscribe();

      return () => {
        clearInterval(interval);
        supabase.removeChannel(realtimeChannel);
      };
    }
  }, [profile?.id]);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const dismiss = async (id: string) => {
    await markAsRead(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Sign out error:", err);
    }
    window.location.href = "/login";
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3">
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
        </Link>

        <div className="flex items-center gap-3">
          <NotificationSoundToggle />
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
                        onClick={() => {
                          if (!notification.read) markAsRead(notification.id);
                        }}
                        className={`cursor-pointer border-b border-zinc-100 px-3 py-2 sm:px-4 sm:py-3 ${
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
                              onClick={(e) => {
                                e.stopPropagation();
                                dismiss(notification.id);
                              }}
                              aria-label="Dismiss notification"
                              title="Dismiss"
                              className="ml-1.5 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 sm:ml-2"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
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

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Account menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 sm:h-10 sm:w-10"
            >
              {profile?.email?.charAt(0)?.toUpperCase() || "A"}
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-100 px-3.5 py-3">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    Admin Panel
                  </p>
                  {profile?.email && (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {profile.email}
                    </p>
                  )}
                </div>

                <nav className="p-1.5">
                  <Link
                    href="/admin/settings"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <svg
                      className="h-4 w-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Settings
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <svg
                      className="h-4 w-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M10 17l5-5-5-5" />
                      <path d="M15 12H3" />
                      <path d="M21 21V3" />
                    </svg>
                    View Site
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg
                      className="h-4 w-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    Logout
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
