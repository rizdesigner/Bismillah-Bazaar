import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (token.status !== "active") {
      return NextResponse.json(
        { error: "Account not approved" },
        { status: 403 }
      );
    }

    const { items, requestedEta } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    let originalTotal = 0;
    const validatedItems: { itemId: string; requestedKg: number; basePriceKg: number }[] = [];

    for (const item of items) {
      const inventory = await prisma.inventory.findUnique({
        where: { id: item.itemId },
      });

      if (!inventory || !inventory.inStock) {
        return NextResponse.json(
          { error: `Item not available: ${inventory?.itemName ?? item.itemId}` },
          { status: 400 }
        );
      }

      const price = Number(inventory.basePriceKg);
      originalTotal += price * item.requestedKg;
      validatedItems.push({
        itemId: item.itemId,
        requestedKg: item.requestedKg,
        basePriceKg: price,
      });
    }

    const order = await prisma.order.create({
      data: {
        userId: token.id as string,
        originalTotal,
        requestedEta: requestedEta ? new Date(requestedEta) : null,
        status: "pending",
        items: {
          create: validatedItems.map((item) => ({
            itemId: item.itemId,
            requestedKg: item.requestedKg,
          })),
        },
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 }
    );
  }
}
