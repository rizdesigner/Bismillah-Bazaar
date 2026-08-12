import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { OrderHistory } from "@/components/order-history";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const [orders, inventory] = await Promise.all([
    prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            item: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.inventory.findMany({
      orderBy: { category: "asc" },
    }),
  ]);

  const serializedOrders = orders.map((order) => ({
    ...order,
    originalTotal: Number(order.originalTotal),
    finalTotal: order.finalTotal ? Number(order.finalTotal) : null,
    createdAt: order.createdAt.toISOString(),
    requestedEta: order.requestedEta ? order.requestedEta.toISOString() : null,
    adminEta: order.adminEta ? order.adminEta.toISOString() : null,
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    dueDate: order.dueDate ? order.dueDate.toISOString() : null,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    items: order.items.map((item) => ({
      ...item,
      requestedKg: Number(item.requestedKg),
      fulfilledKg: item.fulfilledKg ? Number(item.fulfilledKg) : null,
      item: {
        ...item.item,
        basePriceKg: Number(item.item.basePriceKg),
      },
    })),
  }));

  const serializedInventory = inventory.map((item) => ({
    ...item,
    basePriceKg: Number(item.basePriceKg),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Orders</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Track purchase orders and confirm quotes.
      </p>

      <OrderHistory orders={serializedOrders} inventory={serializedInventory} />
    </div>
  );
}
