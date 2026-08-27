export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { sendNewRegistrationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { email, password, restaurantName, phone, location } = await req.json();

    if (!email || !password || !restaurantName) {
      return NextResponse.json(
        { error: 'Email, password, and restaurant name are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Registration failed' },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      restaurant_name: restaurantName,
      phone: phone || null,
      location: location || null,
      role: 'customer',
      status: 'pending_approval',
    });

    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to create profile' },
        { status: 500 }
      );
    }

    const { data: admins } = await supabase
      .from('users')
      .select('email')
      .eq('role', 'admin');

    const adminEmails = (admins || []).map((a) => a.email).filter(Boolean);
    if (adminEmails.length > 0) {
      sendNewRegistrationEmail(adminEmails, restaurantName, email, phone || null, location || null);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
