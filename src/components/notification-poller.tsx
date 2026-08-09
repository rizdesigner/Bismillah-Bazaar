"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { emitToast } from "@/lib/toast-events";

export function NotificationPoller() {
  const { data: session } = useSession();
  const lastCountRef = useRef<number>(0);
  const lastIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const notifications = await res.json();
        const unread = notifications.filter((n: { read: boolean }) => !n.read);

        // Only toast for NEW notifications (not ones we've already seen)
        const newNotifications = unread.filter(
          (n: { id: string }) => !lastIdsRef.current.has(n.id)
        );

        if (newNotifications.length > 0) {
          newNotifications.forEach((n: {
            id: string;
            title: string;
            message: string;
            type: string;
          }) => {
            lastIdsRef.current.add(n.id);
            emitToast({
              title: n.title,
              message: n.message.length > 100
                ? n.message.slice(0, 100) + "..."
                : n.message,
              type: n.type === "order_modified" ? "warning" : "success",
            });
          });
        }

        lastCountRef.current = unread.length;
      } catch (error) {
        console.error("Notification poll error:", error);
      }
    };

    // Initial fetch
    fetchNotifications();

    // Poll every 3 seconds
    const interval = setInterval(fetchNotifications, 3000);

    return () => clearInterval(interval);
  }, [session?.user?.id]);

  return null;
}
