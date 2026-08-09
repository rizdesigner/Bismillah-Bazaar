import { getToken } from "next-auth/jwt";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemName, category, basePriceKg, imageUrl, inStock } =
      await req.json();

    const item = await prisma.inventory.create({
      data: {
        itemName,
        category,
        basePriceKg,
        imageUrl: imageUrl || null,
        inStock: inStock ?? true,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Inventory create error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

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

    const { itemName, category, basePriceKg, imageUrl, inStock } =
      await req.json();

    const item = await prisma.inventory.update({
      where: { id },
      data: {
        itemName,
        category,
        basePriceKg,
        imageUrl: imageUrl || null,
        inStock,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Inventory update error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });

    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.inventory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inventory delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
