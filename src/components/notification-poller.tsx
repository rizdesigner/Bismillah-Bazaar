"use client";

import { useEffect, useRef } from "react";
import { useSession } from "./session-provider";
import { emitToast } from "@/lib/toast-events";
import { playNotificationSound } from "@/lib/sound";
import { createClient } from "@/lib/supabase-client";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
};

function toastFor(n: Notification) {
  emitToast({
    title: n.title,
    message:
      n.message.length > 100 ? n.message.slice(0, 100) + "..." : n.message,
    type: n.type === "order_modified" ? "warning" : "success",
  });
}

export function NotificationPoller() {
  const { profile } = useSession();
  const lastIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.id) return;

    const supabase = createClient();

    const handleNew = (n: Notification) => {
      if (!n.id || lastIdsRef.current.has(n.id)) return;
      lastIdsRef.current.add(n.id);
      playNotificationSound();
      toastFor(n);
    };

    // Real-time push: server broadcasts to notif:<userId> on every action.
    const realtimeChannel = supabase.channel(`notif:${profile.id}`);
    realtimeChannel
      .on("broadcast", { event: "notification" }, (payload) => {
        handleNew(payload.payload);
      })
      .subscribe();

    // Fallback so nothing is missed across reconnects / background tabs.
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
        });

        if (!res.ok) return;

        const notifications = await res.json();
        notifications
          .filter((n: Notification) => !n.read)
          .forEach(handleNew);
      } catch (error) {
        console.error("Notification poll error:", error);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(realtimeChannel);
    };
  }, [profile?.id]);

  return null;
}