export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";
import { createPasswordResetToken } from "@/lib/reset-token";

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

    const { data: targetUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const resetToken = await createPasswordResetToken(targetUser.id);
    const resetUrl = `${req.nextUrl.origin}/reset-password?token=${resetToken}`;

    return NextResponse.json({ resetUrl });
  } catch (error) {
    console.error("Generate reset link error:", error);
    return NextResponse.json(
      { error: "Failed to generate reset link" },
      { status: 500 }
    );
  }
}
