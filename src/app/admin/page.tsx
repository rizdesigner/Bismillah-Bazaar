import { prisma } from "@/lib/prisma";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminPage() {
  const [inventory, orders, activeCustomers, pendingCustomers] = await Promise.all([
    prisma.inventory.findMany({
      orderBy: { category: "asc" },
    }),
    prisma.order.findMany({
      include: {
        items: {
          include: {
            item: true,
          },
        },
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: "customer",
        status: "active",
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.user.findMany({
      where: {
        role: "customer",
        status: "pending_approval",
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const serializedInventory = inventory.map((item) => ({
    ...item,
    basePriceKg: Number(item.basePriceKg),
  }));

  const serializedOrders = orders.map((order) => ({
    ...order,
    originalTotal: Number(order.originalTotal),
    finalTotal: order.finalTotal ? Number(order.finalTotal) : null,
    createdAt: order.createdAt.toISOString(),
    eta: order.eta ? order.eta.toISOString() : null,
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

  const serializedCustomers = activeCustomers.map((customer) => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
  }));

  const serializedPendingCustomers = pendingCustomers.map((customer) => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Admin Dashboard</h1>
      <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
        Manage inventory, orders, and customer accounts.
      </p>

      <AdminTabs
        inventory={serializedInventory}
        orders={serializedOrders}
        customers={serializedCustomers}
        pendingCustomers={serializedPendingCustomers}
      />
    </div>
  );
}
