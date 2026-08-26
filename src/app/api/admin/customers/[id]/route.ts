export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const { status } = await req.json();

    if (!["active", "suspended", "pending_approval"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const { data: customer, error } = await supabase
      .from('users')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const statusMessages: Record<string, { title: string; message: string }> = {
      active: {
        title: "Account Approved!",
        message: `Your account has been approved. You can now browse the catalog and place orders.`,
      },
      suspended: {
        title: "Account Suspended",
        message: `Your account has been suspended. Please contact support for more information.`,
      },
      pending_approval: {
        title: "Account Status Updated",
        message: `Your account status has been changed to pending approval.`,
      },
    };

    const notification = statusMessages[status];
    if (notification) {
      await supabase.from('notifications').insert({
        user_id: id,
        order_id: null,
        type: "account_update",
        title: notification.title,
        message: notification.message,
      });
    }

    if (status === "active") {
      import('@/lib/email').then(m => m.sendAccountApprovedEmail(customer.email, customer.restaurant_name));
    } else if (status === "suspended") {
      import('@/lib/email').then(m => m.sendAccountRejectedEmail(customer.email, customer.restaurant_name));
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Customer update error:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
