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
