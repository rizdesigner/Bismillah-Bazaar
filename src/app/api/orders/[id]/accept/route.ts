export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";

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
      .select('*, items:order_items(*), user:users(*)')
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

    if (order.status !== "modified") {
      return NextResponse.json(
        { error: "Order is not in modified status" },
        { status: 400 }
      );
    }

    await supabase
      .from('orders')
      .update({ status: "confirmed" })
      .eq('id', id);

    await supabase
      .from('notifications')
      .insert({
        user_id: order.user_id,
        order_id: id,
        type: "order_confirmed",
        title: "Order Confirmed",
        message: `Your order has been confirmed and will be delivered as scheduled.`,
      });

    const { data: admin } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (admin) {
      await supabase
        .from('notifications')
        .insert({
          user_id: admin.id,
          order_id: id,
          type: "order_confirmed",
          title: "Order Confirmed by Customer",
          message: `${order.user.restaurant_name || order.user.email} has confirmed order #${id.slice(0, 8)}.`,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order accept error:", error);
    return NextResponse.json(
      { error: "Failed to accept order" },
      { status: 500 }
    );
  }
}
