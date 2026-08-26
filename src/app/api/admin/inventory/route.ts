export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";

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

    const { itemName, category, basePriceKg, imageUrl, inStock, availableChunkSizes } =
      await req.json();

    const { data: item, error } = await supabase
      .from('inventory')
      .insert({
        item_name: itemName,
        category,
        base_price_kg: basePriceKg,
        image_url: imageUrl || null,
        in_stock: inStock ?? true,
        available_chunk_sizes: availableChunkSizes ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(item);
  } catch (error) {
    console.error("Inventory create error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
