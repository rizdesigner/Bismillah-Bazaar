export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";
import { generateOrderNumber } from "@/lib/order-number";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || profile.status !== "active") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    const { items, requestedEta, note } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    const userId = user.id;

    const { data: clientOverrides } = await supabase
      .from('client_product_overrides')
      .select('*')
      .eq('user_id', userId);

    const overridesMap = new Map(
      (clientOverrides || []).map((o: any) => [o.item_id, o])
    );

    const { data: allPieceSizes } = await supabase
      .from('piece_sizes')
      .select('id, size_value');

    const pieceSizeMap = new Map(
      (allPieceSizes || []).map((ps: any) => [ps.id, ps])
    );

    let originalTotal = 0;
    const validatedItems: {
      itemId: string;
      pieceSizeId?: string;
      requestedKg: number;
      basePriceKg: number;
    }[] = [];

    for (const item of items) {
      const { data: inventory } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', item.itemId)
        .single();

      if (!inventory || !inventory.in_stock) {
        return NextResponse.json(
          { error: `Item not available: ${inventory?.item_name ?? item.itemId}` },
          { status: 400 }
        );
      }

      const override = overridesMap.get(item.itemId);

      if (override && override.is_available === false) {
        return NextResponse.json(
          { error: `Item not available for your account: ${inventory.item_name}` },
          { status: 400 }
        );
      }

      const price = override?.custom_price_kg
        ? Number(override.custom_price_kg)
        : Number(inventory.base_price_kg);

      let weightKg = Number(item.requestedKg);
      if (item.pieceSizeId) {
        const ps = pieceSizeMap.get(item.pieceSizeId);
        if (ps) {
          weightKg = (Number(item.requestedKg) * ps.size_value) / 453.592;
        }
      }

      originalTotal += price * weightKg;
      validatedItems.push({
        itemId: item.itemId,
        pieceSizeId: item.pieceSizeId || undefined,
        requestedKg: Number(item.requestedKg),
        basePriceKg: price,
      });
    }

    const orderNumber = await generateOrderNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        original_total: originalTotal,
        requested_eta: requestedEta ? new Date(requestedEta).toISOString() : null,
        due_date: dueDate.toISOString(),
        status: "pending",
        note: note || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      item_id: item.itemId,
      piece_size_id: item.pieceSizeId || null,
      requested_kg: item.requestedKg,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
