import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const overrides = await prisma.clientProductOverride.findMany({
      where: { userId },
      include: {
        item: {
          select: {
            id: true,
            itemName: true,
            category: true,
            basePriceKg: true,
            inStock: true,
          },
        },
      },
      orderBy: {
        item: {
          itemName: "asc",
        },
      },
    });

    const serialized = overrides.map((o) => ({
      ...o,
      customPriceKg: o.customPriceKg ? Number(o.customPriceKg) : null,
      item: {
        ...o.item,
        basePriceKg: Number(o.item.basePriceKg),
      },
    }));

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error fetching client overrides:", error);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, itemId, customPriceKg, isAvailable } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: "userId and itemId are required" }, { status: 400 });
    }

    const override = await prisma.clientProductOverride.upsert({
      where: {
        userId_itemId: { userId, itemId },
      },
      update: {
        customPriceKg: customPriceKg !== null && customPriceKg !== undefined ? customPriceKg : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
      create: {
        userId,
        itemId,
        customPriceKg: customPriceKg !== null && customPriceKg !== undefined ? customPriceKg : null,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
      },
      include: {
        item: {
          select: {
            id: true,
            itemName: true,
            category: true,
            basePriceKg: true,
            inStock: true,
          },
        },
      },
    });

    const serialized = {
      ...override,
      customPriceKg: override.customPriceKg ? Number(override.customPriceKg) : null,
      item: {
        ...override.item,
        basePriceKg: Number(override.item.basePriceKg),
      },
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("Error creating/updating client override:", error);
    return NextResponse.json({ error: "Failed to save override" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.clientProductOverride.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client override:", error);
    return NextResponse.json({ error: "Failed to delete override" }, { status: 500 });
  }
}
