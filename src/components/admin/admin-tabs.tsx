"use client";

import { useState } from "react";
import { ResetLinkModal } from "./reset-link-modal";
import { ClientPricingManager } from "./client-pricing-manager";

type InventoryItem = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  inStock: boolean;
  imageUrl: string | null;
  availableChunkSizes?: string[];
};

type OrderItem = {
  id: string;
  requestedKg: number;
  fulfilledKg: number | null;
  requestedChunkSize: string | null;
  item: {
    itemName: string;
  };
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  originalTotal: number;
  finalTotal: number | null;
  requestedEta: string | null;
  adminEta: string | null;
  deliveredAt: string | null;
  dueDate: string | null;
  paymentStatus: string;
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  note: string | null;
  user: {
    id: string;
    restaurantName: string | null;
    phone: string | null;
    email: string;
  };
  items: OrderItem[];
};

type Customer = {
  id: string;
  email: string;
  restaurantName: string | null;
  phone: string | null;
  location: string | null;
  status: string;
  createdAt: string;
};

type Props = {
  inventory: InventoryItem[];
  orders: Order[];
  customers: Customer[];
  pendingCustomers: Customer[];
};

export function AdminTabs({ inventory, orders, customers, pendingCustomers }: Props) {
  const [activeTab, setActiveTab] = useState<"inventory" | "orders" | "users" | "pending" | "delivered" | "paid" | "pricing">("inventory");
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    email: string;
    restaurantName: string | null;
  } | null>(null);

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");

  const tabs = [
    { id: "inventory" as const, label: "Inventory", count: inventory.length },
    { id: "orders" as const, label: "Orders", count: activeOrders.length },
    { id: "delivered" as const, label: "Delivered", count: deliveredOrders.length },
    { id: "paid" as const, label: "Paid", count: paidOrders.length },
    { id: "users" as const, label: "Active", count: customers.length },
    { id: "pending" as const, label: "Pending", count: pendingCustomers.length },
    { id: "pricing" as const, label: "Pricing", count: null },
  ];

  return (
    <div className="mt-4 sm:mt-6">
      <div className="mb-4 border-b border-zinc-200 sm:mb-6">
        <nav className="-mb-px flex gap-1 overflow-x-auto pb-2 sm:gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap border-b-2 px-2 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                activeTab === tab.id
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] sm:ml-2 sm:px-2 sm:text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "inventory" && <InventoryTab inventory={inventory} />}
      {activeTab === "orders" && <OrdersTab orders={activeOrders} />}
      {activeTab === "delivered" && <DeliveredOrdersTab orders={deliveredOrders} />}
      {activeTab === "paid" && <PaidOrdersTab orders={paidOrders} />}
      {activeTab === "users" && <UsersTab customers={customers} onResetPassword={setResetTarget} />}
      {activeTab === "pending" && <PendingApprovalsTab customers={pendingCustomers} onResetPassword={setResetTarget} />}

      <div className={activeTab === "pricing" ? "block" : "hidden"}>
        <ClientPricingManager
          customers={customers}
          inventory={inventory.map((item) => ({
            id: item.id,
            itemName: item.itemName,
            category: item.category,
            basePriceKg: item.basePriceKg,
          }))}
        />
      </div>

      <ResetLinkModal user={resetTarget} onClose={() => setResetTarget(null)} />
    </div>
  );
}

function InventoryTab({ inventory }: { inventory: InventoryItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({
    itemName: "",
    category: "Chicken",
    basePriceKg: "",
    imageUrl: "",
    inStock: true,
    availableChunkSizes: [] as string[],
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingItem
        ? `/api/admin/inventory/${editingItem.id}`
        : "/api/admin/inventory";
      const method = editingItem ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          basePriceKg: parseFloat(form.basePriceKg),
          imageUrl: form.imageUrl || null,
          availableChunkSizes: form.availableChunkSizes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to save item");
        return;
      }

      setShowForm(false);
      setEditingItem(null);
      setForm({
        itemName: "",
        category: "Chicken",
        basePriceKg: "",
        imageUrl: "",
        inStock: true,
        availableChunkSizes: [],
      });
      window.location.reload();
    } catch {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;

    try {
      const res = await fetch(`/api/admin/inventory/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("Failed to delete item");
        return;
      }

      window.location.reload();
    } catch {
      alert("An error occurred");
    }
  };

  const startEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setForm({
      itemName: item.itemName,
      category: item.category,
      basePriceKg: item.basePriceKg.toString(),
      imageUrl: item.imageUrl || "",
      inStock: item.inStock,
      availableChunkSizes: item.availableChunkSizes ?? [],
    });
    setShowForm(true);
  };

  return (
    <div>
      <button
        onClick={() => {
          setShowForm(true);
          setEditingItem(null);
          setForm({
            itemName: "",
            category: "Chicken",
            basePriceKg: "",
            imageUrl: "",
            inStock: true,
            availableChunkSizes: [],
          });
        }}
        className="mb-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 sm:mb-4 sm:w-auto sm:px-4 sm:py-2 sm:text-sm"
      >
        + Add Item
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900 sm:text-lg">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={form.itemName}
                    onChange={(e) =>
                      setForm({ ...form, itemName: e.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="Chicken">Chicken</option>
                    <option value="Beef">Beef</option>
                    <option value="Goat">Goat</option>
                    <option value="Lamb">Lamb</option>
                    <option value="Fish">Fish</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Base Price ($/lb)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.basePriceKg}
                    onChange={(e) =>
                      setForm({ ...form, basePriceKg: e.target.value })
                    }
                    required
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm({ ...form, imageUrl: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={form.inStock}
                  onChange={(e) =>
                    setForm({ ...form, inStock: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <label htmlFor="inStock" className="text-xs text-zinc-700 sm:text-sm">
                  In Stock
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 sm:text-sm mb-1">
                  Chunk Sizes
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="chunkSizeInput"
                    placeholder="e.g. 2 pcs, 20g, South Indian cut"
                    className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const input = e.currentTarget;
                        const val = input.value.trim();
                        if (val && !form.availableChunkSizes.includes(val)) {
                          setForm({ ...form, availableChunkSizes: [...form.availableChunkSizes, val] });
                        }
                        input.value = "";
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("chunkSizeInput") as HTMLInputElement;
                      const val = input?.value.trim();
                      if (val && !form.availableChunkSizes.includes(val)) {
                        setForm({ ...form, availableChunkSizes: [...form.availableChunkSizes, val] });
                        input.value = "";
                      }
                    }}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Add
                  </button>
                </div>
                {form.availableChunkSizes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {form.availableChunkSizes.map((size) => (
                      <span
                        key={size}
                        className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => {
                            setForm({ ...form, availableChunkSizes: form.availableChunkSizes.filter((s) => s !== size) });
                          }}
                          className="ml-0.5 rounded-full p-0.5 text-zinc-400 hover:text-zinc-600"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 sm:gap-3 sm:pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 sm:flex-none sm:px-4 sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile: Card Layout */}
      <div className="space-y-2 sm:hidden">
        {inventory.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-zinc-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium">
                    {item.category}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      item.inStock
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.inStock ? "In Stock" : "Out"}
                  </span>
                </div>
                <h4 className="mt-1.5 text-sm font-medium text-zinc-900">
                  {item.itemName}
                </h4>
                <p className="mt-0.5 text-xs text-emerald-600 font-medium">
                  ${item.basePriceKg.toFixed(2)}/lb
                </p>
                {item.availableChunkSizes && item.availableChunkSizes.length > 0 && (
                  <p className="mt-0.5 text-[10px] text-zinc-500">Sizes: {item.availableChunkSizes.join(', ')}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(item)}
                  className="rounded px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="rounded px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full min-w-[500px]">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Product Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Sizes
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Price/lb
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600">
                In Stock
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {inventory.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-sm text-zinc-900">
                  <span className="inline-flex rounded bg-zinc-100 px-2 py-1 text-xs font-medium">
                    {item.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                  {item.itemName}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  {item.availableChunkSizes && item.availableChunkSizes.length > 0
                    ? item.availableChunkSizes.join(", ")
                    : "—"}
                </td>
                <td className="px-4 py-3 text-right text-sm text-zinc-900">
                  ${item.basePriceKg.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      item.inStock
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.inStock ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => startEdit(item)}
                    className="mr-2 text-xs font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersTab({ orders }: { orders: Order[] }) {
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    items: [] as { id: string; fulfilledKg: number }[],
    finalTotal: 0,
    adminEta: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(false);

  const handleConfirmOrder = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      items: order.items.map((item) => ({
        id: item.id,
        fulfilledKg: item.fulfilledKg ?? item.requestedKg,
      })),
      finalTotal: order.finalTotal ?? order.originalTotal,
      adminEta: order.adminEta ? new Date(order.adminEta).toISOString().slice(0, 16) : "",
      status: "confirmed",
    });
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      items: order.items.map((item) => ({
        id: item.id,
        fulfilledKg: item.fulfilledKg ?? item.requestedKg,
      })),
      finalTotal: order.finalTotal ?? order.originalTotal,
      adminEta: order.adminEta ? new Date(order.adminEta).toISOString().slice(0, 16) : "",
      status: order.status,
    });
  };

  const handleDeliver = async (orderId: string) => {
    if (!confirm("Mark this order as delivered?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (res.ok) window.location.reload();
      else {
        const data = await res.json();
        alert(data.error || "Failed to mark as delivered");
      }
    } catch {
      alert("An error occurred");
    }
  };

  const handleSave = async () => {
    if (!editingOrder) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update order");
        return;
      }

      setEditingOrder(null);
      window.location.reload();
    } catch {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Mobile: Card Layout */}
      <div className="space-y-2 sm:hidden">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-lg border border-zinc-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      order.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : order.status === "modified"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-zinc-500">
                  {order.orderNumber}
                </p>
                <h4 className="mt-0.5 text-sm font-medium text-zinc-900">
                  {order.user.restaurantName || "N/A"}
                </h4>
                {order.items.map((item, i) => (
                  <p key={i} className="mt-0.5 text-xs text-zinc-600">
                    {item.item.itemName}{item.requestedChunkSize ? ` (${item.requestedChunkSize})` : ""} — {item.requestedKg}lb
                  </p>
                ))}
                <div className="mt-2 space-y-0.5 text-[10px] text-zinc-600">
                  {order.requestedEta && <p>Req: {new Date(order.requestedEta).toLocaleString()}</p>}
                  {order.adminEta && <p className="font-medium text-emerald-700">Admin: {new Date(order.adminEta).toLocaleString()}</p>}
                  {order.note && <p className="mt-1 italic text-zinc-500">Note: {order.note}</p>}
                  <p className="mt-1 font-semibold text-zinc-900">Total: {order.finalTotal ? `$${order.finalTotal.toFixed(2)}` : `$${order.originalTotal.toFixed(2)}`}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {order.status === "pending" ? (
                  <button
                    onClick={() => handleConfirmOrder(order)}
                    className="rounded bg-emerald-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-emerald-500"
                  >
                    Confirm
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(order)}
                    className="rounded px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50"
                  >
                    Edit
                  </button>
                )}
                {order.status === "confirmed" && (
                  <button
                    onClick={() => handleDeliver(order.id)}
                    className="rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-medium text-white hover:bg-emerald-500"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full min-w-[800px]">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Order #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Restaurant
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Item
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Qty (lb)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Delivery
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {orders.map((order) =>
              order.items.map((item, i) => (
                <tr
                  key={`${order.id}-${i}`}
                  className="hover:bg-zinc-50"
                >
                  {i === 0 ? (
                    <>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900" rowSpan={order.items.length}>
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900" rowSpan={order.items.length}>
                        {order.user.restaurantName || "N/A"}
                      </td>
                    </>
                  ) : null}
                  <td className="px-4 py-3 text-sm text-zinc-900">
                    {item.item.itemName}{item.requestedChunkSize ? ` (${item.requestedChunkSize})` : ""}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-zinc-900">
                    {item.requestedKg}
                    {item.fulfilledKg != null && item.fulfilledKg !== item.requestedKg && (
                      <span className="ml-1 text-xs text-emerald-600">→ {item.fulfilledKg}</span>
                    )}
                  </td>
                  {i === 0 ? (
                    <>
                      <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900" rowSpan={order.items.length}>
                        {order.finalTotal ? `$${order.finalTotal.toFixed(2)}` : `$${order.originalTotal.toFixed(2)}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600" rowSpan={order.items.length}>
                        {order.requestedEta && <div className="text-xs">Req: {new Date(order.requestedEta).toLocaleDateString()}</div>}
                        {order.adminEta && <div className="text-xs font-medium text-emerald-700">Admin: {new Date(order.adminEta).toLocaleDateString()}</div>}
                        {order.note && <div className="mt-1 text-xs italic text-zinc-500">Note: {order.note}</div>}
                        {!order.requestedEta && !order.adminEta && !order.note && "—"}
                      </td>
                      <td className="px-4 py-3 text-center" rowSpan={order.items.length}>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            order.status === "pending"
                              ? "bg-amber-100 text-amber-700"
                              : order.status === "modified"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" rowSpan={order.items.length}>
                        <div className="flex justify-end gap-2">
                          {order.status === "pending" ? (
                            <button
                              onClick={() => handleConfirmOrder(order)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                            >
                              Confirm
                            </button>
                          ) : (
                            <button
                              onClick={() => handleEdit(order)}
                              className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                            >
                              Edit
                            </button>
                          )}
                          {order.status === "confirmed" && (
                            <button
                              onClick={() => handleDeliver(order.id)}
                              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                            >
                              Mark Delivered
                            </button>
                          )}
                        </div>
                      </td>
                    </>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <h2 className="text-base font-bold text-zinc-900 sm:text-xl">
                {editForm.status === "confirmed" ? "Confirm Order" : "Edit Order"}
              </h2>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="mb-2 text-xs font-semibold text-zinc-900 sm:text-sm">
                  Line Items
                </h3>
                <div className="space-y-2">
                  {editingOrder.items.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-zinc-900 sm:text-sm">
                          {item.item.itemName}
                        </p>
                        <p className="text-[10px] text-zinc-500 sm:text-xs">
                           Requested: {item.requestedKg} lb{item.requestedChunkSize ? ` (${item.requestedChunkSize})` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-zinc-600 sm:text-xs">Fulfilled:</label>
                        <button
                          type="button"
                          onClick={() => {
                            const current = editForm.items[idx]?.fulfilledKg ?? item.requestedKg;
                            const newVal = Math.max(0, Math.round((current - 0.5) * 10) / 10);
                            const newItems = [...editForm.items];
                            newItems[idx] = { id: item.id, fulfilledKg: newVal };
                            setEditForm({ ...editForm, items: newItems });
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded border border-zinc-300 text-xs hover:bg-zinc-50"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max={item.requestedKg}
                          value={editForm.items[idx]?.fulfilledKg ?? item.requestedKg}
                          onChange={(e) => {
                            const newItems = [...editForm.items];
                            newItems[idx] = {
                              id: item.id,
                              fulfilledKg: parseFloat(e.target.value) || 0,
                            };
                            setEditForm({ ...editForm, items: newItems });
                          }}
                          className="w-14 rounded border border-zinc-300 px-1.5 py-1 text-center text-xs sm:w-16 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const current = editForm.items[idx]?.fulfilledKg ?? item.requestedKg;
                            const newVal = Math.min(item.requestedKg, Math.round((current + 0.5) * 10) / 10);
                            const newItems = [...editForm.items];
                            newItems[idx] = { id: item.id, fulfilledKg: newVal };
                            setEditForm({ ...editForm, items: newItems });
                          }}
                          className="flex h-6 w-6 items-center justify-center rounded border border-zinc-300 text-xs hover:bg-zinc-50"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-zinc-500 sm:text-xs">lb</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Final Total ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.finalTotal}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        finalTotal: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Admin ETA (Date & Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.adminEta}
                    onChange={(e) =>
                      setEditForm({ ...editForm, adminEta: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm({ ...editForm, status: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="modified">Modified</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3 sm:mt-6 sm:gap-3 sm:pt-4">
              <button
                onClick={() => setEditingOrder(null)}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 sm:flex-none sm:px-4 sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:flex-none sm:px-4 sm:text-sm"
              >
                {loading ? "Saving..." : editForm.status === "confirmed" ? "Confirm Order" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveredOrdersTab({ orders }: { orders: Order[] }) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const filteredOrders = deliveredOrders.filter((order) => {
    const d = new Date(order.deliveredAt || order.createdAt);
    const orderMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return orderMonth === selectedMonth;
  });

  const orderGroups = filteredOrders.map((order) => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    restaurantName: order.user.restaurantName || "N/A",
    deliveredAt: order.deliveredAt,
    paymentStatus: order.paymentStatus,
    total: order.finalTotal || order.originalTotal,
    items: order.items.map((item) => ({
      itemName: item.item.itemName,
      chunkSize: item.requestedChunkSize || "",
      quantity: item.requestedKg,
      unitPrice: order.finalTotal && order.items.length > 0 ? order.finalTotal / order.items.length : order.originalTotal / order.items.length,
    })),
  }));

  const totalItems = orderGroups.reduce((sum, g) => sum + g.items.length, 0);

  const handleUndo = async (orderId: string) => {
    if (!confirm("Move this order back to active?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "confirmed" }),
      });
      if (res.ok) window.location.reload();
      else {
        const data = await res.json();
        alert(data.error || "Failed to undo");
      }
    } catch {
      alert("An error occurred");
    }
  };

  const handleMarkPaid = async (orderId: string) => {
    if (!confirm("Mark this order as paid?")) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      if (res.ok) window.location.reload();
      else {
        const data = await res.json();
        alert(data.error || "Failed to mark as paid");
      }
    } catch {
      alert("An error occurred");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "Order #",
      "Restaurant",
      "Item",
      "Chunk Size",
      "Qty (lb)",
      "Final Price",
      "Delivered",
    ];

    const rows = orderGroups.flatMap((group) =>
      group.items.map((item) => [
        group.orderNumber,
        group.restaurantName,
        item.itemName,
        item.chunkSize,
        item.quantity.toString(),
        item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "—",
        group.deliveredAt ? new Date(group.deliveredAt).toLocaleDateString() : "—",
      ])
    );

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `delivered-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const monthOptions: { value: string; label: string }[] = [];
  const deliveredMonths = new Set(
    deliveredOrders.map((o) => {
      const d = new Date(o.deliveredAt || o.createdAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })
  );
  deliveredMonths.forEach((m) => {
    const [year, month] = m.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    monthOptions.push({
      value: m,
      label: date.toLocaleDateString("en-US", { year: "numeric", month: "long" }),
    });
  });
  monthOptions.sort((a, b) => b.value.localeCompare(a.value));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          {monthOptions.length === 0 ? (
            <option value={selectedMonth}>No data</option>
          ) : (
            monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          )}
        </select>

        <button
          onClick={handleExportCSV}
          disabled={totalItems === 0}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>

        <span className="text-xs text-zinc-500">
          {orderGroups.length} order{orderGroups.length !== 1 ? "s" : ""} · {totalItems} item{totalItems !== 1 ? "s" : ""}
        </span>
      </div>

      {orderGroups.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center sm:p-12">
          <p className="text-xs text-zinc-500 sm:text-sm">No delivered orders for this month</p>
        </div>
      )}

      {/* Mobile: Card Layout */}
      <div className="space-y-3 sm:hidden">
        {orderGroups.map((group) => (
          <div
            key={group.orderNumber}
            className="overflow-hidden rounded-lg border border-zinc-200 bg-white"
          >
            <div className="border-b border-zinc-100 bg-zinc-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                    {group.orderNumber}
                  </span>
                  <span className="text-xs font-medium text-zinc-900">
                    {group.restaurantName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {group.paymentStatus !== "paid" && (
                    <button
                      onClick={() => handleMarkPaid(group.orderId)}
                      className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-emerald-500"
                    >
                      Mark Paid
                    </button>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    {group.deliveredAt ? new Date(group.deliveredAt).toLocaleDateString() : "—"}
                  </span>
                  <button
                    onClick={() => handleUndo(group.orderId)}
                    className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 hover:bg-zinc-300"
                  >
                    Undo
                  </button>
                </div>
              </div>
            </div>
            <div className="divide-y divide-zinc-50">
              {group.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-zinc-900">{item.itemName}</p>
                    {item.chunkSize && (
                      <p className="text-[10px] text-zinc-500">Chunk: {item.chunkSize}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                    <span>{item.quantity} lb</span>
                    <span>{item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "—"}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500">Total</span>
                <span className="text-xs font-semibold text-zinc-900">
                  {group.total ? `$${Number(group.total).toFixed(2)}` : "—"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Grouped Table */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Order #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Restaurant
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Item
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Chunk Size
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Qty (lb)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Final Price
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Delivered
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {orderGroups.map((group) =>
              group.items.map((item, i) => (
                <tr
                  key={`${group.orderNumber}-${i}`}
                  className={`border-b border-zinc-50 hover:bg-zinc-50 ${i > 0 ? "bg-zinc-25" : ""}`}
                >
                  {i === 0 ? (
                    <>
                      <td className="px-4 py-3 text-sm font-semibold text-zinc-900" rowSpan={group.items.length}>
                        {group.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900" rowSpan={group.items.length}>
                        {group.restaurantName}
                      </td>
                    </>
                  ) : null}
                  <td className="px-4 py-3 text-sm text-zinc-900">{item.itemName}</td>
                  <td className="px-4 py-3 text-sm text-zinc-600">{item.chunkSize || "—"}</td>
                  <td className="px-4 py-3 text-right text-sm text-zinc-900">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                    {item.unitPrice ? `$${item.unitPrice.toFixed(2)}` : "—"}
                  </td>
                  {i === 0 ? (
                    <>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-zinc-900" rowSpan={group.items.length}>
                        {group.total ? `$${Number(group.total).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-900" rowSpan={group.items.length}>
                        {group.deliveredAt ? new Date(group.deliveredAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-right" rowSpan={group.items.length}>
                        <div className="flex items-center justify-end gap-2">
                          {group.paymentStatus !== "paid" && (
                            <button
                              onClick={() => handleMarkPaid(group.orderId)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-500"
                            >
                              Mark Paid
                            </button>
                          )}
                          <button
                            onClick={() => handleUndo(group.orderId)}
                            className="rounded bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-300"
                          >
                            Undo
                          </button>
                        </div>
                      </td>
                    </>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaidOrdersTab({ orders }: { orders: Order[] }) {
  const sorted = [...orders].sort(
    (a, b) => new Date(b.paidAt || b.createdAt).getTime() - new Date(a.paidAt || a.createdAt).getTime()
  );

  const grandTotal = sorted.reduce(
    (sum, o) => sum + Number(o.finalTotal || o.originalTotal || 0),
    0
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          {sorted.length} paid order{sorted.length !== 1 ? "s" : ""} · ${grandTotal.toFixed(2)} received
        </span>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center sm:p-12">
          <p className="text-xs text-zinc-500 sm:text-sm">No paid orders yet</p>
        </div>
      )}

      {/* Mobile: Card Layout */}
      <div className="space-y-3 sm:hidden">
        {sorted.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  {order.orderNumber}
                </span>
                <span className="text-xs font-medium text-zinc-900">
                  {order.user.restaurantName || "N/A"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">
                Paid {new Date(order.paidAt || order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="divide-y divide-zinc-50">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-zinc-900">{item.item.itemName}</p>
                    {item.requestedChunkSize && (
                      <p className="text-[10px] text-zinc-500">Chunk: {item.requestedChunkSize}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-600">{item.requestedKg} lb</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50 px-3 py-2">
              <span className="text-[10px] text-zinc-500">Paid Total</span>
              <span className="text-xs font-semibold text-emerald-700">
                ${Number(order.finalTotal || order.originalTotal).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Order #</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Restaurant</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Items</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">Paid On</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((order) => (
              <tr key={order.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-4 py-3 text-sm font-semibold text-zinc-900">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm font-medium text-zinc-900">{order.user.restaurantName || "N/A"}</td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {order.items.map((i) => i.item.itemName).join(", ")}
                </td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">
                  ${Number(order.finalTotal || order.originalTotal).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-900">
                  {new Date(order.paidAt || order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersTab({
  customers,
  onResetPassword,
}: {
  customers: Customer[];
  onResetPassword: (user: { id: string; email: string; restaurantName: string | null }) => void;
}) {
  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="space-y-2 sm:hidden">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-lg border border-zinc-200 bg-white p-3"
          >
            <h4 className="text-sm font-medium text-zinc-900">
              {customer.restaurantName || "N/A"}
            </h4>
            <div className="mt-1.5 space-y-0.5 text-xs text-zinc-600">
              <p>{customer.email}</p>
              {customer.phone && <p>{customer.phone}</p>}
              {customer.location && <p>{customer.location}</p>}
              <p className="text-[10px] text-zinc-500">
                Joined: {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="mt-2 flex gap-1">
              <button
                onClick={() =>
                  onResetPassword({
                    id: customer.id,
                    email: customer.email,
                    restaurantName: customer.restaurantName,
                  })
                }
                className="rounded px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50"
              >
                Reset Password
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${customer.restaurantName || customer.email}? This cannot be undone.`)) {
                    fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" })
                      .then((r) => {
                        if (r.ok) window.location.reload();
                        else r.json().then((d) => alert(d.error || "Failed to delete"));
                      })
                      .catch(() => alert("An error occurred"));
                  }
                }}
                className="rounded px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full min-w-[600px]">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Restaurant Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                  {customer.restaurantName || "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">{customer.email}</td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {customer.phone || "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {customer.location || "N/A"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() =>
                        onResetPassword({
                          id: customer.id,
                          email: customer.email,
                          restaurantName: customer.restaurantName,
                        })
                      }
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete ${customer.restaurantName || customer.email}? This cannot be undone.`)) {
                          fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" })
                            .then((r) => {
                              if (r.ok) window.location.reload();
                              else r.json().then((d) => alert(d.error || "Failed to delete"));
                            })
                            .catch(() => alert("An error occurred"));
                        }
                      }}
                      className="text-xs font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PendingApprovalsTab({
  customers,
  onResetPassword,
}: {
  customers: Customer[];
  onResetPassword: (user: { id: string; email: string; restaurantName: string | null }) => void;
}) {
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to approve customer");
        return;
      }

      window.location.reload();
    } catch {
      alert("An error occurred");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this customer?")) return;

    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended" }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to reject customer");
        return;
      }

      window.location.reload();
    } catch {
      alert("An error occurred");
    }
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      {customers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center sm:p-12">
          <p className="text-xs text-zinc-500 sm:text-sm">No pending approvals</p>
        </div>
      ) : (
        customers.map((customer) => (
          <div
            key={customer.id}
            className="rounded-lg border border-zinc-200 bg-white p-3 sm:p-6"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-zinc-900 sm:text-lg">
                  {customer.restaurantName || "Unnamed Restaurant"}
                </h3>
                <p className="mt-1 text-xs text-zinc-600 sm:text-sm">{customer.email}</p>
                {customer.phone && (
                  <p className="mt-1 text-xs text-zinc-600 sm:text-sm">{customer.phone}</p>
                )}
                {customer.location && (
                  <p className="mt-1 text-xs text-zinc-600 sm:text-sm">{customer.location}</p>
                )}
                <p className="mt-2 text-[10px] text-zinc-500 sm:text-xs">
                  Registered: {new Date(customer.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onResetPassword({
                      id: customer.id,
                      email: customer.email,
                      restaurantName: customer.restaurantName,
                    })
                  }
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                >
                  Reset
                </button>
                <button
                  onClick={() => handleApprove(customer.id)}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(customer.id)}
                  className="flex-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete ${customer.restaurantName || customer.email}? This cannot be undone.`)) {
                      fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" })
                        .then((r) => {
                          if (r.ok) window.location.reload();
                          else r.json().then((d) => alert(d.error || "Failed to delete"));
                        })
                        .catch(() => alert("An error occurred"));
                    }
                  }}
                  className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 sm:flex-none sm:px-4 sm:py-2 sm:text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
