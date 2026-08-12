export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";
import { createPasswordResetToken } from "@/lib/reset-token";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalized = email.trim().toLowerCase();
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', normalized)
      .single();

    if (profile && profile.status === "active") {
      const token = await createPasswordResetToken(profile.id);
      const resetUrl = `${req.nextUrl.origin}/reset-password?token=${token}`;
      await sendPasswordResetEmail(profile.email, resetUrl);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
