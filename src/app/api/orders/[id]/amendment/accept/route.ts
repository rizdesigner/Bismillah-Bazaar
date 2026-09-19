export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";
import { notifyUser } from "@/lib/notify";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data: order } = await supabase
      .from('orders')
      .select('*, user:users(*)')
      .eq('id', id)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.user_id !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (!order.amendment_pending || !order.proposed_changes) {
      return NextResponse.json(
        { error: "No pending amendment" },
        { status: 400 }
      );
    }

    const proposedChanges = order.proposed_changes as any[];

    for (const change of proposedChanges) {
      if (change.orderItemId) {
        await supabase
          .from('order_items')
          .update({ fulfilled_kg: change.fulfilledKg })
          .eq('id', change.orderItemId);
      }
    }

    await supabase
      .from('orders')
      .update({
        amendment_pending: false,
        proposed_changes: null,
        amendment_requested_by: null,
      })
      .eq('id', id);

    const { data: admins } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    for (const admin of (admins || [])) {
      await notifyUser(supabase, {
        userId: admin.id,
        orderId: id,
        type: "amendment_accepted",
        title: "Amendment Accepted",
        message: `${order.user.restaurant_name || order.user.email} accepted your amendment to order #${id.slice(0, 8)}.`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Amendment accept error:", error);
    return NextResponse.json(
      { error: "Failed to accept amendment" },
      { status: 500 }
    );
  }
}
