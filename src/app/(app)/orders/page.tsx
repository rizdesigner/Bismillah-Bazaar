import { createClient } from "@/lib/supabase-server";
import { OrderHistory } from "@/components/order-history";

export const runtime = 'edge';
export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [ordersRes, inventoryRes] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(*, inventory(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory")
      .select("*")
      .order("category"),
  ]);

  const orders = ordersRes.data ?? [];
  const inventory = inventoryRes.data ?? [];

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

  const serializedInventory = inventory.map((item) => ({
    id: item.id,
    itemName: item.item_name,
    category: item.category,
    unit: item.unit,
    basePriceKg: Number(item.base_price_kg),
    inStock: item.in_stock,
    imageUrl: item.image_url,
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
