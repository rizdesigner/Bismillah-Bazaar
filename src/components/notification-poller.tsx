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
    notificationId: n.id,
  });
}

function mapInsert(payload: { new: any }) {
  const row = payload.new;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.message,
    read: row.read ?? false,
  };
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

    // Toasts should only fire for NEW real-time INSERT events pushed while
    // this page is open. Historical unread notifications are loaded separately
    // by the bell dropdown and must NOT trigger pop-up toasts.
    const realtimeChannel = supabase.channel(
      `notifications-insert-${profile.id}`
    );
    realtimeChannel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          handleNew(mapInsert(payload));
        }
      )
      .subscribe();

    // Fallback channel in case the notifications table isn't added to the
    // realtime publication: the server still broadcasts on notif:<userId>.
    const fallbackChannel = supabase.channel(`notif:${profile.id}`);
    fallbackChannel
      .on("broadcast", { event: "notification" }, (payload) => {
        handleNew(payload.payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realtimeChannel);
      supabase.removeChannel(fallbackChannel);
    };
  }, [profile?.id]);

  return null;
}