import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();

    if (!["active", "suspended", "pending_approval"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const customer = await prisma.user.update({
      where: { id },
      data: { status },
    });

    // Notify customer about status change
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
      await prisma.notification.create({
        data: {
          userId: id,
          orderId: null, // No order associated
          type: "account_update",
          title: notification.title,
          message: notification.message,
        },
      });
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
