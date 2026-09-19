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

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
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

    if (!order.amendment_pending || !order.proposed_changes) {
      return NextResponse.json(
        { error: "No pending amendment" },
        { status: 400 }
      );
    }

    await supabase
      .from('orders')
      .update({
        amendment_pending: false,
        proposed_changes: null,
        amendment_requested_by: null,
      })
      .eq('id', id);

    await notifyUser(supabase, {
      userId: order.user_id,
      orderId: id,
      type: "amendment_rejected",
      title: "Amendment Rejected",
      message: `Your amendment to order #${order.order_number} has been rejected by the admin.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Amendment reject error:", error);
    return NextResponse.json(
      { error: "Failed to reject amendment" },
      { status: 500 }
    );
  }
}
