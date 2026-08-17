export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (user.role === 'admin') {
      const { data: conversations } = await supabase
        .from('conversations')
        .select(`
          id,
          admin_unread_count,
          customer_unread_count,
          created_at,
          updated_at,
          user:users!user_id(id, restaurant_name, email)
        `)
        .order('updated_at', { ascending: false });

      return NextResponse.json(conversations ?? []);
    } else {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      return NextResponse.json(conversations ? [conversations] : []);
    }
  } catch (error) {
    console.error("Conversations GET error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== 'customer') {
      return NextResponse.json({ error: "Only customers can create conversations" }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(existing);
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(conversation, { status: 201 });
  } catch (error) {
    console.error("Conversations POST error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
