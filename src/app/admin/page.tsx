import { createClient } from "@/lib/supabase-server";
import { AdminTabs } from "@/components/admin/admin-tabs";

export const runtime = 'edge';
export const metadata = { title: "Admin Dashboard" };

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();

  const [inventoryRes, ordersRes, activeCustomersRes, pendingCustomersRes] = await Promise.all([
    supabase.from("inventory").select("*").order("category"),
    supabase
      .from("orders")
      .select("*, order_items(*, inventory(*)), users(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("*")
      .eq("role", "customer")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase
      .from("users")
      .select("*")
      .eq("role", "customer")
      .eq("status", "pending_approval")
      .order("created_at", { ascending: false }),
  ]);

  const inventory = inventoryRes.data ?? [];
  const orders = ordersRes.data ?? [];
  const activeCustomers = activeCustomersRes.data ?? [];
  const pendingCustomers = pendingCustomersRes.data ?? [];

  const serializedInventory = inventory.map((item) => ({
    id: item.id,
    itemName: item.item_name,
    category: item.category,
    unit: item.unit,
    basePriceKg: Number(item.base_price_kg),
    inStock: item.in_stock,
    imageUrl: item.image_url,
  }));

  const serializedOrders = orders.map((order) => ({
    id: order.id,
    userId: order.user_id,
    orderNumber: order.order_number,
    status: order.status,
    notes: order.notes,
    originalTotal: Number(order.original_total),
    finalTotal: order.final_total ? Number(order.final_total) : null,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    createdAt: order.created_at,
    requestedEta: order.requested_eta ?? null,
    adminEta: order.admin_eta ?? null,
    deliveredAt: order.delivered_at ?? null,
    dueDate: order.due_date ?? null,
    paidAt: order.paid_at ?? null,
    user: {
      id: order.users?.id ?? "",
      email: order.users?.email ?? "",
      restaurantName: order.users?.restaurant_name ?? null,
      phone: order.users?.phone ?? null,
    },
    items: (order.order_items ?? []).map((oi: any) => ({
      id: oi.id,
      orderId: oi.order_id,
      itemId: oi.item_id,
      requestedKg: Number(oi.requested_kg),
      fulfilledKg: oi.fulfilled_kg ? Number(oi.fulfilled_kg) : null,
      notes: oi.notes,
      item: {
        id: oi.inventory.id,
        itemName: oi.inventory.item_name,
        category: oi.inventory.category,
        unit: oi.inventory.unit,
        basePriceKg: Number(oi.inventory.base_price_kg),
        inStock: oi.inventory.in_stock,
        imageUrl: oi.inventory.image_url,
      },
    })),
  }));

  const serializedCustomers = activeCustomers.map((customer) => ({
    id: customer.id,
    email: customer.email,
    role: customer.role,
    restaurantName: customer.restaurant_name,
    phone: customer.phone,
    location: customer.location,
    status: customer.status,
    createdAt: customer.created_at,
  }));

  const serializedPendingCustomers = pendingCustomers.map((customer) => ({
    id: customer.id,
    email: customer.email,
    role: customer.role,
    restaurantName: customer.restaurant_name,
    phone: customer.phone,
    location: customer.location,
    status: customer.status,
    createdAt: customer.created_at,
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
