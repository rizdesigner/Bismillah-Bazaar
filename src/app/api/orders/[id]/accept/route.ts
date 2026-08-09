import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.userId !== token.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (order.status !== "modified") {
      return NextResponse.json(
        { error: "Order is not in modified status" },
        { status: 400 }
      );
    }

    await prisma.order.update({
      where: { id },
      data: {
        status: "confirmed",
      },
    });

    // Notify customer (confirmation record)
    await prisma.notification.create({
      data: {
        userId: order.userId,
        orderId: id,
        type: "order_confirmed",
        title: "Order Confirmed",
        message: `Your order has been confirmed and will be delivered as scheduled.`,
      },
    });

    // Notify admin that customer confirmed
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
    });

    if (admin) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          orderId: id,
          type: "order_confirmed",
          title: "Order Confirmed by Customer",
          message: `${order.user.restaurantName || order.user.email} has confirmed order #${id.slice(0, 8)}.`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order accept error:", error);
    return NextResponse.json(
      { error: "Failed to accept order" },
      { status: 500 }
    );
  }
}
