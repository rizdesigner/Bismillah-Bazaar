"use client";

import { useEffect, useRef } from "react";
import { useSession } from "./session-provider";
import { emitToast } from "@/lib/toast-events";
import { playNotificationSound } from "@/lib/sound";
import { createClient } from "@/lib/supabase-client";
import { isTier1 } from "@/lib/notification-tiers";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
};

function toastFor(n: Notification) {
  const urgentTypes = new Set(["order_modified", "order_cancelled", "amendment_requested", "amendment_accepted", "amendment_rejected"]);
  emitToast({
    title: n.title,
    message:
      n.message.length > 100 ? n.message.slice(0, 100) + "..." : n.message,
    type: urgentTypes.has(n.type) ? "warning" : "success",
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

    const isAdmin = profile.role === "admin";
    const supabase = createClient();

    const handleNew = (n: Notification) => {
      if (!n.id || lastIdsRef.current.has(n.id)) return;
      lastIdsRef.current.add(n.id);

      // Two-tier alert strategy: Tier 1 alerts get an audio chime + toast;
      // Tier 2 status updates are silent (the bell badge updates on its own
      // via its own realtime subscription).
      if (!isTier1(n.type, profile.role)) return;
      playNotificationSound();
      toastFor(n);
    };

    // Toasts should only fire for NEW real-time INSERT events pushed while
    // this page is open. Historical unread notifications are loaded separately
    // by the bell dropdown and must NOT trigger pop-up toasts.
    //
    // Admins receive notifications that belong to the role as a whole (new
    // registrations, new orders, etc.), so they subscribe WITHOUT a user_id
    // filter and get every INSERT on the notifications table. Restaurants
    // only get their own, so they keep the user_id filter.
    const realtimeChannel = supabase.channel(
      `notifications-insert-${profile.id}`
    );
    realtimeChannel
      .on(
        "postgres_changes",
        isAdmin
          ? { event: "INSERT", schema: "public", table: "notifications" }
          : {
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
  }, [profile?.id, profile?.role]);

  return null;
}