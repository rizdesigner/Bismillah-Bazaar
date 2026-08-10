"use client";

import { useState } from "react";
import { ResetLinkModal } from "./reset-link-modal";

type InventoryItem = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  inStock: boolean;
  imageUrl: string | null;
};

type OrderItem = {
  id: string;
  requestedKg: number;
  fulfilledKg: number | null;
  item: {
    itemName: string;
  };
};

type Order = {
  id: string;
  status: string;
  originalTotal: number;
  finalTotal: number | null;
  eta: string | null;
  deliveredAt: string | null;
  createdAt: string;
  user: {
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
  const [activeTab, setActiveTab] = useState<"inventory" | "orders" | "users" | "pending" | "delivered">("inventory");
  const [resetTarget, setResetTarget] = useState<{
    id: string;
    email: string;
    restaurantName: string | null;
  } | null>(null);

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const tabs = [
    { id: "inventory" as const, label: "Inventory", count: inventory.length },
    { id: "orders" as const, label: "Orders", count: activeOrders.length },
    { id: "delivered" as const, label: "Delivered", count: deliveredOrders.length },
    { id: "users" as const, label: "Active", count: customers.length },
    { id: "pending" as const, label: "Pending", count: pendingCustomers.length },
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
              <span className="ml-1 rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] sm:ml-2 sm:px-2 sm:text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "inventory" && <InventoryTab inventory={inventory} />}
      {activeTab === "orders" && <OrdersTab orders={activeOrders} />}
      {activeTab === "delivered" && <DeliveredOrdersTab orders={deliveredOrders} />}
      {activeTab === "users" && <UsersTab customers={customers} onResetPassword={setResetTarget} />}
      {activeTab === "pending" && <PendingApprovalsTab customers={pendingCustomers} onResetPassword={setResetTarget} />}

      <ResetLinkModal user={resetTarget} onClose={() => setResetTarget(null)} />
    </div>
  );
}

function InventoryTab({ inventory }: { inventory: InventoryItem[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({
    itemName: "",
    category: "Poultry",
    basePriceKg: "",
    imageUrl: "",
    inStock: true,
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
        category: "Poultry",
        basePriceKg: "",
        imageUrl: "",
        inStock: true,
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
            category: "Poultry",
            basePriceKg: "",
            imageUrl: "",
            inStock: true,
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
                    <option value="Poultry">Poultry</option>
                    <option value="Meat">Meat</option>
                    <option value="Dried">Dried</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 sm:text-sm">
                    Base Price ($/kg)
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
                  ${item.basePriceKg.toFixed(2)}/kg
                </p>
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
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Price/kg
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
    eta: "",
    status: "pending",
  });
  const [loading, setLoading] = useState(false);

  const flattenedOrders = orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId: order.id,
      restaurantName: order.user.restaurantName || "N/A",
      phone: order.user.phone || "N/A",
      email: order.user.email,
      itemName: item.item.itemName,
      quantity: item.requestedKg,
      fulfilledQty: item.fulfilledKg,
      finalPrice: order.finalTotal ? order.finalTotal / order.items.length : null,
      eta: order.eta,
      createdAt: order.createdAt,
      status: order.status,
    }))
  );

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      items: order.items.map((item) => ({
        id: item.id,
        fulfilledKg: item.fulfilledKg ?? item.requestedKg,
      })),
      finalTotal: order.finalTotal ?? order.originalTotal,
      eta: order.eta ? new Date(order.eta).toISOString().slice(0, 16) : "",
      status: order.status,
    });
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
        {flattenedOrders.map((row, idx) => (
          <div
            key={`${row.orderId}-${row.itemName}-${idx}`}
            className="rounded-lg border border-zinc-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      row.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : row.status === "modified"
                        ? "bg-blue-100 text-blue-700"
                        : row.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </div>
                <h4 className="mt-1.5 text-sm font-medium text-zinc-900">
                  {row.restaurantName}
                </h4>
                <p className="mt-0.5 text-xs text-zinc-600">{row.itemName}</p>
                <div className="mt-2 space-y-0.5 text-[10px] text-zinc-600">
                  <p>Qty: {row.quantity}kg {row.fulfilledQty !== row.quantity && `→ ${row.fulfilledQty}kg`}</p>
                  <p>Price: {row.finalPrice ? `$${row.finalPrice.toFixed(2)}` : "—"}</p>
                  <p>ETA: {row.eta ? new Date(row.eta).toLocaleString() : "—"}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  const order = orders.find((o) => o.id === row.orderId);
                  if (order) handleEdit(order);
                }}
                className="rounded px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Restaurant
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Item
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Qty (kg)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Final Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                ETA
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Order Date
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
            {flattenedOrders.map((row, idx) => (
              <tr key={`${row.orderId}-${row.itemName}-${idx}`} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                  {row.restaurantName}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">{row.phone}</td>
                <td className="px-4 py-3 text-sm text-zinc-600">{row.email}</td>
                <td className="px-4 py-3 text-sm text-zinc-900">{row.itemName}</td>
                <td className="px-4 py-3 text-right text-sm text-zinc-900">
                  {row.quantity}
                  {row.fulfilledQty !== row.quantity && (
                    <span className="ml-1 text-xs text-emerald-600">
                      → {row.fulfilledQty}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                  {row.finalPrice ? `$${row.finalPrice.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {row.eta ? new Date(row.eta).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      row.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : row.status === "modified"
                        ? "bg-blue-100 text-blue-700"
                        : row.status === "confirmed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      const order = orders.find((o) => o.id === row.orderId);
                      if (order) handleEdit(order);
                    }}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="w-full max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between sm:mb-6">
              <h2 className="text-base font-bold text-zinc-900 sm:text-xl">Edit Order</h2>
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
                          Requested: {item.requestedKg} kg
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
                        <span className="text-[10px] text-zinc-500 sm:text-xs">kg</span>
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
                    ETA (Date & Time)
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.eta}
                    onChange={(e) =>
                      setEditForm({ ...editForm, eta: e.target.value })
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
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveredOrdersTab({ orders }: { orders: Order[] }) {
  const flattenedOrders = orders.flatMap((order) =>
    order.items.map((item) => ({
      orderId: order.id,
      restaurantName: order.user.restaurantName || "N/A",
      itemName: item.item.itemName,
      quantity: item.requestedKg,
      fulfilledQty: item.fulfilledKg,
      finalPrice: order.finalTotal ? order.finalTotal / order.items.length : null,
      eta: order.eta,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
    }))
  );

  return (
    <div>
      {flattenedOrders.length === 0 && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center sm:p-12">
          <p className="text-xs text-zinc-500 sm:text-sm">No delivered orders yet</p>
        </div>
      )}

      {/* Mobile: Card Layout */}
      <div className="space-y-2 sm:hidden">
        {flattenedOrders.map((row, idx) => (
          <div
            key={`${row.orderId}-${row.itemName}-${idx}`}
            className="rounded-lg border border-zinc-200 bg-white p-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <span className="inline-flex rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700">
                  delivered
                </span>
                <h4 className="mt-1.5 text-sm font-medium text-zinc-900">
                  {row.restaurantName}
                </h4>
                <p className="mt-0.5 text-xs text-zinc-600">{row.itemName}</p>
                <div className="mt-2 space-y-0.5 text-[10px] text-zinc-600">
                  <p>Qty: {row.quantity}kg{row.fulfilledQty !== row.quantity && ` → ${row.fulfilledQty}kg`}</p>
                  <p>Price: {row.finalPrice ? `$${row.finalPrice.toFixed(2)}` : "—"}</p>
                  <p>Delivered: {row.deliveredAt ? new Date(row.deliveredAt).toLocaleString() : "—"}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Table Layout */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 bg-white sm:block">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Restaurant
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Item
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Qty (kg)
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Final Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Order Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-zinc-600">
                Delivered
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {flattenedOrders.map((row, idx) => (
              <tr key={`${row.orderId}-${row.itemName}-${idx}`} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                  {row.restaurantName}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-900">{row.itemName}</td>
                <td className="px-4 py-3 text-right text-sm text-zinc-900">
                  {row.quantity}
                  {row.fulfilledQty !== row.quantity && (
                    <span className="ml-1 text-xs text-emerald-600">
                      → {row.fulfilledQty}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900">
                  {row.finalPrice ? `$${row.finalPrice.toFixed(2)}` : "—"}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                  {row.deliveredAt ? new Date(row.deliveredAt).toLocaleString() : "—"}
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
            <button
              onClick={() =>
                onResetPassword({
                  id: customer.id,
                  email: customer.email,
                  restaurantName: customer.restaurantName,
                })
              }
              className="mt-2 rounded px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-50"
            >
              Reset Password
            </button>
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
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
