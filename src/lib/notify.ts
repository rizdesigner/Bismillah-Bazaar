import type { SupabaseClient } from "@supabase/supabase-js";

type NotifyParams = {
  userId: string;
  orderId?: string | null;
  type: string;
  title: string;
  message: string;
};

/**
 * Inserts an in-app notification and immediately pushes it to the
 * recipient's browser over a Supabase Realtime broadcast channel
 * (`notif:<userId>`), so the bell badge + toast update without a refresh.
 */
export async function notifyUser(
  supabase: SupabaseClient,
  params: NotifyParams
) {
  const { userId, type, title, message } = params;
  const orderId = params.orderId ?? null;

  const { data: notif, error } = await supabase
    .from("notifications")
    .insert({ user_id: userId, order_id: orderId, type, title, message })
    .select("id, type, title, message, order_id, created_at")
    .single();

  if (error || !notif) {
    console.error("[notify] insert failed:", error);
    return;
  }

  // Fire-and-forget broadcast. Channel is not subscribed, so realtime-js
  // delivers over REST (fetch) — safe for the Edge runtime. Never blocks
  // the API response; if it fails the next poll catches up anyway.
  try {
    const channel = supabase.channel(`notif:${userId}`);
    await channel.send({
      type: "broadcast",
      event: "notification",
      payload: {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        orderId: notif.order_id,
        read: false,
        createdAt: notif.created_at,
      },
    });
    supabase.removeChannel(channel);
  } catch (e) {
    console.error("[notify] broadcast failed:", e);
  }
}