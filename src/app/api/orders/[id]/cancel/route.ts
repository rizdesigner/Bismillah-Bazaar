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

    if (order.status !== "pending" && order.status !== "modified" && order.status !== "confirmed") {
      return NextResponse.json(
        { error: "This order can no longer be cancelled" },
        { status: 400 }
      );
    }

    await supabase
      .from('orders')
      .update({ status: "cancelled", delivered_at: null })
      .eq('id', id);

    // Tier 1 alert for every admin: order cancelled by the restaurant.
    const { data: admins } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');

    for (const admin of (admins || [])) {
      await notifyUser(supabase, {
        userId: admin.id,
        orderId: id,
        type: "order_cancelled",
        title: "Order Cancelled by Restaurant",
        message: `${order.user.restaurant_name || order.user.email} cancelled order #${id.slice(0, 8)}.`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel order" },
      { status: 500 }
    );
  }
}