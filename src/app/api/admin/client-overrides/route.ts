export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { data: overrides, error } = await supabase
      .from('client_product_overrides')
      .select('*, item:inventory(id, item_name, category, base_price_kg, in_stock)')
      .eq('user_id', userId);

    if (error) throw error;

    const sorted = (overrides || []).sort((a: any, b: any) =>
      (a.item?.item_name ?? '').localeCompare(b.item?.item_name ?? '')
    );

    const serialized = sorted.map((o: any) => ({
      id: o.id,
      userId: o.user_id,
      itemId: o.item_id,
      customPriceKg: o.custom_price_kg ? Number(o.custom_price_kg) : null,
      isAvailable: o.is_available,
      item: o.item
        ? {
            id: o.item.id,
            itemName: o.item.item_name,
            category: o.item.category,
            basePriceKg: Number(o.item.base_price_kg),
          }
        : null,
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching client overrides:", error);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, itemId, customPriceKg, isAvailable } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: "userId and itemId are required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('client_product_overrides')
      .select('id')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .maybeSingle();

    const payload = {
      user_id: userId,
      item_id: itemId,
      custom_price_kg: customPriceKg !== null && customPriceKg !== undefined ? customPriceKg : null,
      is_available: isAvailable !== undefined ? isAvailable : true,
    };

    let result;
    if (existing) {
      const { data } = await supabase
        .from('client_product_overrides')
        .update(payload)
        .eq('id', existing.id)
        .select('*, item:inventory(id, item_name, category, base_price_kg, in_stock)')
        .single();
      result = data;
    } else {
      const { data } = await supabase
        .from('client_product_overrides')
        .insert(payload)
        .select('*, item:inventory(id, item_name, category, base_price_kg, in_stock)')
        .single();
      result = data;
    }

    const serialized = {
      id: result?.id,
      userId: result?.user_id,
      itemId: result?.item_id,
      customPriceKg: result?.custom_price_kg ? Number(result.custom_price_kg) : null,
      isAvailable: result?.is_available,
      item: result?.item
        ? {
            id: result.item.id,
            itemName: result.item.item_name,
            category: result.item.category,
            basePriceKg: Number(result.item.base_price_kg),
          }
        : null,
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error creating/updating client override:", error);
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { error } = await supabase.from('client_product_overrides').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client override:", error);
    return NextResponse.json({ error: "Failed to delete override" }, { status: 500 });
  }
}
