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

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .in('key', ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"]);

    const settingsMap = (settings || []).reduce((acc: Record<string, string>, s: any) => {
      let value = s.value;
      if (s.key === "smtp_pass" && value) {
        // Mask the password for display
        value = "••••••••" + value.slice(-4);
      }
      acc[s.key] = value;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("SMTP settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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

    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from } = await req.json();

    const updates = [
      { key: "smtp_host", value: smtp_host || "" },
      { key: "smtp_port", value: smtp_port || "587" },
      { key: "smtp_secure", value: smtp_secure ? "true" : "false" },
      { key: "smtp_user", value: smtp_user || "" },
      { key: "smtp_from", value: smtp_from || smtp_user || "" },
    ];

    // Only update password if a new one was provided (not masked)
    if (smtp_pass && !smtp_pass.startsWith("••••••••")) {
      updates.push({ key: "smtp_pass", value: smtp_pass });
    }

    for (const update of updates) {
      const { data: existing } = await supabase
        .from('settings')
        .select('id')
        .eq('key', update.key)
        .maybeSingle();

      if (existing) {
        await supabase.from('settings').update({ value: update.value }).eq('key', update.key);
      } else {
        await supabase.from('settings').insert({ key: update.key, value: update.value });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SMTP settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
