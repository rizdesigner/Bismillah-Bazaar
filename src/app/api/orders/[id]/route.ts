export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";

export async function PATCH(
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

    if (order.status !== "pending" && order.status !== "confirmed") {
      return NextResponse.json(
        { error: "Orders can only be edited while pending or ongoing" },
        { status: 400 }
      );
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const normalized = items.map((item: { itemId?: string; orderItemId?: string; requestedKg?: number }) => ({
      itemId: item.itemId as string,
      orderItemId: (item.orderItemId as string) || undefined,
      requestedKg: Number(item.requestedKg),
    }));

    if (normalized.some((i) => !i.itemId || !Number.isFinite(i.requestedKg) || i.requestedKg <= 0)) {
      return NextResponse.json(
        { error: "Invalid item data" },
        { status: 400 }
      );
    }

    const itemIds = normalized.map((i) => i.itemId);

    const { data: inventoryItems } = await supabase
      .from('inventory')
      .select('*')
      .in('id', itemIds);

    const inventoryById = new Map((inventoryItems || []).map((i: any) => [i.id, i]));

    for (const item of normalized) {
      const inventory = inventoryById.get(item.itemId);
      if (!inventory || !inventory.in_stock) {
        return NextResponse.json(
          { error: `Item not available: ${inventory?.item_name ?? item.itemId}` },
          { status: 400 }
        );
      }
    }

    const existingItemsById = new Map<string, any>(order.items.map((i: any) => [i.id, i]));
    const existingItemsByItemId = new Map<string, any>(order.items.map((i: any) => [i.item_id, i]));
    const usedExistingIds = new Set<string>();

    let originalTotal = 0;

    for (const item of normalized) {
      const inventory = inventoryById.get(item.itemId)!;
      originalTotal += Number(inventory.base_price_kg) * item.requestedKg;

      let existing: any | undefined;

      if (item.orderItemId) {
        existing = existingItemsById.get(item.orderItemId);
      } else {
        const match = existingItemsByItemId.get(item.itemId);
        if (match && !usedExistingIds.has(match.id)) {
          existing = match;
        }
      }

      if (existing) {
        usedExistingIds.add(existing.id);
        await supabase
          .from('order_items')
          .update({ requested_kg: item.requestedKg, fulfilled_kg: null })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('order_items')
          .insert({
            order_id: id,
            item_id: item.itemId,
            requested_kg: item.requestedKg,
          });
      }
    }

    const itemsToDelete = order.items.filter((i: any) => !usedExistingIds.has(i.id));

    if (itemsToDelete.length > 0) {
      await supabase
        .from('order_items')
        .delete()
        .in('id', itemsToDelete.map((i: any) => i.id));
    }

    await supabase
      .from('orders')
      .update({
        original_total: originalTotal,
        final_total: null,
        admin_eta: null,
        status: "pending",
        delivered_at: null,
      })
      .eq('id', id);

    const { data: admins } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');

    for (const admin of (admins || [])) {
      await supabase
        .from('notifications')
        .insert({
          user_id: admin.id,
          order_id: id,
          type: "order_edited",
          title: "Order Edited by Restaurant",
          message: `${order.user.restaurant_name || order.user.email} updated order #${id.slice(0, 8)}. Please re-review the requested quantities.`,
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order edit error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
