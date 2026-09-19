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

    const proposedChanges = order.proposed_changes as any[];

    let originalTotal = 0;
    const existingItemsById = new Map<string, any>();
    const { data: existingItems } = await supabase
      .from('order_items')
      .select('*, item:inventory(*)')
      .eq('order_id', id);

    for (const item of existingItems || []) {
      existingItemsById.set(item.id, item);
    }

    const usedExistingIds = new Set<string>();

    for (const change of proposedChanges) {
      if (change.orderItemId) {
        const existing = existingItemsById.get(change.orderItemId);
        if (existing) {
          usedExistingIds.add(change.orderItemId);
          await supabase
            .from('order_items')
            .update({ requested_kg: change.requestedKg, fulfilled_kg: null })
            .eq('id', change.orderItemId);

          originalTotal += Number(existing.item.base_price_kg) * change.requestedKg;
        }
      } else if (change.itemId) {
        const { data: inventory } = await supabase
          .from('inventory')
          .select('*')
          .eq('id', change.itemId)
          .single();

        if (inventory) {
          await supabase
            .from('order_items')
            .insert({
              order_id: id,
              item_id: change.itemId,
              requested_kg: change.requestedKg,
            });

          originalTotal += Number(inventory.base_price_kg) * change.requestedKg;
        }
      }
    }

    const itemsToDelete = (existingItems || []).filter((i: any) => !usedExistingIds.has(i.id));
    if (itemsToDelete.length > 0) {
      await supabase
        .from('order_items')
        .delete()
        .in('id', itemsToDelete.map((i: any) => i.id));
    }

    await supabase
      .from('orders')
      .update({
        amendment_pending: false,
        proposed_changes: null,
        amendment_requested_by: null,
        original_total: originalTotal,
        final_total: null,
        status: "modified",
      })
      .eq('id', id);

    await notifyUser(supabase, {
      userId: order.user_id,
      orderId: id,
      type: "amendment_accepted",
      title: "Amendment Accepted",
      message: `Your amendment to order #${order.order_number} has been accepted by the admin.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Amendment accept error:", error);
    return NextResponse.json(
      { error: "Failed to accept amendment" },
      { status: 500 }
    );
  }
}
