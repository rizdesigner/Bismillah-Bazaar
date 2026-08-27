export const runtime = 'edge';

import { createClient } from '@/lib/supabase-server';
import { NextResponse, NextRequest } from "next/server";
import { sendDeliveryReceipt, sendOrderConfirmedEmail, sendOrderModifiedEmail } from "@/lib/email";

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

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { items, finalTotal, adminEta, status, paymentStatus, paymentMethod } = await req.json();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, items:order_items(*, item:inventory(*)), user:users(*)')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const changes: string[] = [];

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const orderItem = order.items.find((oi: any) => oi.id === item.id);
        if (orderItem && Number(orderItem.fulfilled_kg ?? orderItem.requested_kg) !== item.fulfilledKg) {
          changes.push(`${orderItem.item.item_name}: ${Number(orderItem.requested_kg)}lb → ${item.fulfilledKg}kg`);
        }
        await supabase.from('order_items').update({ fulfilled_kg: item.fulfilledKg }).eq('id', item.id);
      }
    }

    if (finalTotal !== undefined && Number(order.final_total ?? order.original_total) !== finalTotal) {
      changes.push(`Price: $${Number(order.original_total).toFixed(2)} → $${finalTotal.toFixed(2)}`);
    }

    if (adminEta) {
      const newEta = new Date(adminEta);
      if (!order.admin_eta || newEta.getTime() !== new Date(order.admin_eta).getTime()) {
        changes.push(`Admin ETA: ${newEta.toLocaleDateString()}`);
      }
    }

    if (status && status !== order.status) {
      changes.push(`Status: ${order.status} → ${status}`);
    }

    if (paymentStatus && paymentStatus !== order.payment_status) {
      changes.push(`Payment: ${order.payment_status} → ${paymentStatus}`);
    }

    const updateData: Record<string, any> = {};
    if (finalTotal !== undefined) updateData.final_total = finalTotal;
    if (adminEta) updateData.admin_eta = new Date(adminEta).toISOString();
    else updateData.admin_eta = null;
    if (status) updateData.status = status;
    if (paymentStatus) updateData.payment_status = paymentStatus;
    if (paymentMethod) updateData.payment_method = paymentMethod;
    if (paymentStatus === "paid") updateData.paid_at = new Date().toISOString();
    if (status === "delivered") {
      updateData.delivered_at = order.delivered_at ?? new Date().toISOString();
    } else if (status && status !== "delivered") {
      updateData.delivered_at = null;
    }

    const { data: updatedOrder } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select('*, items:order_items(*, item:inventory(*)), user:users(*)')
      .single();

    const messageParts = ["Your order has been updated by the admin."];

    if (changes.length > 0) {
      messageParts.push("Changes:", ...changes.map((c) => `• ${c}`));
    }

    await supabase.from('notifications').insert({
      user_id: order.user_id,
      order_id: id,
      type: "order_modified",
      title: "Order Updated",
      message: messageParts.join("\n"),
    });

    const customerEmail = order.user?.email;
    const restaurantName = order.user?.restaurant_name || '';

    if (status && status !== order.status && status === "confirmed" && customerEmail) {
      sendOrderConfirmedEmail(customerEmail, restaurantName, updatedOrder.order_number, Number(updateData.final_total ?? updatedOrder.final_total ?? updatedOrder.original_total));
    }

    if (changes.length > 0 && customerEmail && !(status === "confirmed" && status !== order.status)) {
      sendOrderModifiedEmail(customerEmail, restaurantName, updatedOrder.order_number, changes, Number(updateData.final_total ?? updatedOrder.final_total ?? updatedOrder.original_total));
    }

    if (status === "delivered" && customerEmail) {
      await sendDeliveryReceipt(
        order.user.email,
        updatedOrder.order_number,
        updatedOrder,
        updatedOrder.items
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
