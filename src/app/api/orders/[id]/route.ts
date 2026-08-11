import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

    if (order.status !== "pending" && order.status !== "confirmed") {
      return NextResponse.json(
        { error: "Orders can only be edited while pending or ongoing" },
        { status: 400 }
      );
    }

    const { items } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    const normalized = items.map((item: { itemId?: string; orderItemId?: string; requestedKg?: number }) => ({
      itemId: item.itemId as string,
      orderItemId: (item.orderItemId as string) || undefined,
      requestedKg: Number(item.requestedKg),
    }));

    if (normalized.some((i) => !i.itemId || !Number.isFinite(i.requestedKg) || i.requestedKg <= 0)) {
      return NextResponse.json(
        { error: "Invalid item data" },
        { status: 400 }
      );
    }

    const itemIds = normalized.map((i) => i.itemId);

    const inventoryItems = await prisma.inventory.findMany({
      where: { id: { in: itemIds } },
    });

    const inventoryById = new Map(inventoryItems.map((i) => [i.id, i]));

    for (const item of normalized) {
      const inventory = inventoryById.get(item.itemId);
      if (!inventory || !inventory.inStock) {
        return NextResponse.json(
          { error: `Item not available: ${inventory?.itemName ?? item.itemId}` },
          { status: 400 }
        );
      }
    }

    const existingItemsById = new Map(order.items.map((i) => [i.id, i]));
    const existingItemsByItemId = new Map(order.items.map((i) => [i.itemId, i]));
    const usedExistingIds = new Set<string>();

    let originalTotal = 0;

    for (const item of normalized) {
      const inventory = inventoryById.get(item.itemId)!;
      originalTotal += Number(inventory.basePriceKg) * item.requestedKg;

      let existing: (typeof order.items)[number] | undefined;

      if (item.orderItemId) {
        existing = existingItemsById.get(item.orderItemId);
      } else {
        const match = existingItemsByItemId.get(item.itemId);
        if (match && !usedExistingIds.has(match.id)) {
          existing = match;
        }
      }

      if (existing) {
        usedExistingIds.add(existing.id);
        await prisma.orderItem.update({
          where: { id: existing.id },
          data: { requestedKg: item.requestedKg, fulfilledKg: null },
        });
      } else {
        await prisma.orderItem.create({
          data: {
            orderId: id,
            itemId: item.itemId,
            requestedKg: item.requestedKg,
          },
        });
      }
    }

    const itemsToDelete = order.items.filter((i) => !usedExistingIds.has(i.id));

    if (itemsToDelete.length > 0) {
      await prisma.orderItem.deleteMany({
        where: { id: { in: itemsToDelete.map((i) => i.id) } },
      });
    }

    await prisma.order.update({
      where: { id },
      data: {
        originalTotal,
        finalTotal: null,
        adminEta: null,
        status: "pending",
        deliveredAt: null,
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "admin" },
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          orderId: id,
          type: "order_edited",
          title: "Order Edited by Restaurant",
          message: `${order.user.restaurantName || order.user.email} updated order #${id.slice(0, 8)}. Please re-review the requested quantities.`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order edit error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
