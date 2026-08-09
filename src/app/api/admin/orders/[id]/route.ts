import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token || token.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { items, finalTotal, eta, status } = await req.json();

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: true,
        items: {
          include: { item: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const changes: string[] = [];

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const orderItem = order.items.find((oi) => oi.id === item.id);
        if (orderItem && Number(orderItem.fulfilledKg ?? orderItem.requestedKg) !== item.fulfilledKg) {
          changes.push(`${orderItem.item.itemName}: ${Number(orderItem.requestedKg)}kg → ${item.fulfilledKg}kg`);
        }
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { fulfilledKg: item.fulfilledKg },
        });
      }
    }

    if (finalTotal !== undefined && Number(order.finalTotal ?? order.originalTotal) !== finalTotal) {
      changes.push(`Price: $${Number(order.originalTotal).toFixed(2)} → $${finalTotal.toFixed(2)}`);
    }

    if (eta) {
      const newEta = new Date(eta);
      if (!order.eta || newEta.getTime() !== order.eta.getTime()) {
        changes.push(`ETA: ${newEta.toLocaleDateString()}`);
      }
    }

    if (status && status !== order.status) {
      changes.push(`Status: ${order.status} → ${status}`);
    }

    await prisma.order.update({
      where: { id },
      data: {
        finalTotal: finalTotal !== undefined ? finalTotal : undefined,
        eta: eta ? new Date(eta) : null,
        status: status || undefined,
      },
    });

    // Always create a notification when admin updates an order
    const messageParts = ["Your order has been updated by the admin."];
    
    if (changes.length > 0) {
      messageParts.push("Changes:", ...changes.map((c) => `• ${c}`));
    }

    await prisma.notification.create({
      data: {
        userId: order.userId,
        orderId: id,
        type: "order_modified",
        title: "Order Updated",
        message: messageParts.join("\n"),
      },
    });

    console.log("Notification created for user:", order.userId, "order:", id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
