import { prisma } from "@/lib/prisma";

export async function generateOrderNumber(): Promise<string> {
  // Find the latest order and extract the number
  const latestOrder = await prisma.order.findFirst({
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true },
  });

  let nextNumber = 1001; // Starting number

  if (latestOrder?.orderNumber) {
    // Extract the numeric part from the order number (e.g., "ORD-1001" -> 1001)
    const match = latestOrder.orderNumber.match(/ORD-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  return `ORD-${nextNumber}`;
}
