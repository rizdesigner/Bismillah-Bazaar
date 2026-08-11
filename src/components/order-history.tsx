"use client";

import { useState } from "react";

type OrderItem = {
  id: string;
  requestedKg: number;
  fulfilledKg: number | null;
  item: {
    id: string;
    itemName: string;
    basePriceKg: number;
  };
};

type Order = {
  id: string;
  status: string;
  originalTotal: number;
  finalTotal: number | null;
  requestedEta: string | null;
  adminEta: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderItem[];
};

type InventoryItem = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  inStock: boolean;
};

type EditItem = {
  orderItemId?: string;
  itemId: string;
  itemName: string;
  requestedKg: number;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  modified: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  delivered: "bg-zinc-100 text-zinc-700",
};

export function OrderHistory({ orders, inventory }: { orders: Order[]; inventory: InventoryItem[] }) {
  const [activeTab, setActiveTab] = useState<"active" | "delivered">("active");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [newItemId, setNewItemId] = useState("");
  const [loading, setLoading] = useState(false);

  const activeOrders = orders.filter((o) => o.status !== "delivered");
  const deliveredOrders = orders.filter((o) => o.status === "delivered");

  const handleAccept = async (orderId: string) => {
    setAcceptingId(orderId);

    try {
      const res = await fetch(`/api/orders/${orderId}/accept`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to accept order");
        return;
      }

      window.location.reload();
    } catch {
      alert("An error occurred");
    } finally {
      setAcceptingId(null);
    }
  };

  const canEdit = (status: string) => status === "pending" || status === "confirmed";

  const openEdit = (order: Order) => {
    setEditingOrder(order);
    setEditItems(
      order.items.map((item) => ({
        orderItemId: item.id,
        itemId: item.item.id,
        itemName: item.item.itemName,
        requestedKg: item.requestedKg,
      }))
    );
    setNewItemId("");
  };

  const updateQty = (index: number, delta: number) => {
    setEditItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, requestedKg: Math.max(0.1, Math.round((item.requestedKg + delta) * 10) / 10) }
          : item
      )
    );
  };

  const removeItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const addItem = () => {
    const item = inventory.find((i) => i.id === newItemId);
    if (!item) return;
    setEditItems((prev) => [
      ...prev,
      { itemId: item.id, itemName: item.itemName, requestedKg: 1 },
    ]);
    setNewItemId("");
  };

  const availableItems = inventory.filter(
    (i) => i.inStock && !editItems.some((e) => e.itemId === i.id)
  );

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    if (editItems.length === 0) {
      alert("Order must contain at least one item");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`/api/orders/${editingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: editItems.map((item) => ({
            orderItemId: item.orderItemId,
            itemId: item.itemId,
            requestedKg: item.requestedKg,
          })),
        }),
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

  const tabs = [
    { id: "active" as const, label: "Active", count: activeOrders.length },
    { id: "delivered" as const, label: "Delivered", count: deliveredOrders.length },
  ];

  return (
    <div className="mt-6">
      <div className="mb-4 border-b border-zinc-200">
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

      {activeTab === "active" && (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-zinc-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[order.status] || "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {canEdit(order.status) && (
                    <button
                      onClick={() => openEdit(order)}
                      className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50"
                    >
                      Edit Order
                    </button>
                  )}
                  {order.status === "modified" && (
                    <button
                      onClick={() => handleAccept(order.id)}
                      disabled={acceptingId === order.id}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {acceptingId === order.id ? "Accepting..." : "Accept Order"}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2 text-sm"
                  >
                    <span className="font-medium text-zinc-900">
                      {item.item.itemName}
                    </span>
                    <div className="flex items-center gap-4 text-zinc-600">
                      <span>Requested: {item.requestedKg} kg</span>
                      {item.fulfilledKg !== null && item.fulfilledKg !== item.requestedKg && (
                        <span className="font-medium text-emerald-700">
                          Approved: {item.fulfilledKg} kg
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
                <div>
                  <p className="text-zinc-600">
                    Original: ${order.originalTotal.toFixed(2)}
                  </p>
                  {order.finalTotal && order.finalTotal !== order.originalTotal && (
                    <p className="mt-1 font-medium text-emerald-700">
                      Final: ${order.finalTotal.toFixed(2)}
                    </p>
                  )}
                </div>
                {(order.requestedEta || order.adminEta) && (
                  <div className="text-right">
                    {order.requestedEta && <p className="text-xs text-zinc-500">Requested: {new Date(order.requestedEta).toLocaleString()}</p>}
                    {order.adminEta && <p className="text-xs font-medium text-emerald-700">Admin: {new Date(order.adminEta).toLocaleString()}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}

          {activeOrders.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <p className="text-sm text-zinc-500">No active orders</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "delivered" && (
        <div className="space-y-4">
          {deliveredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-xs text-zinc-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      statusColors[order.status] || "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                {order.deliveredAt && (
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Delivered</p>
                    <p className="font-medium text-emerald-700">
                      {new Date(order.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2 text-sm"
                  >
                    <span className="font-medium text-zinc-900">
                      {item.item.itemName}
                    </span>
                    <div className="flex items-center gap-4 text-zinc-600">
                      <span>Requested: {item.requestedKg} kg</span>
                      {item.fulfilledKg !== null && item.fulfilledKg !== item.requestedKg && (
                        <span className="font-medium text-emerald-700">
                          Delivered: {item.fulfilledKg} kg
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
                <div>
                  <p className="text-zinc-600">
                    Original: ${order.originalTotal.toFixed(2)}
                  </p>
                  {order.finalTotal && order.finalTotal !== order.originalTotal && (
                    <p className="mt-1 font-medium text-emerald-700">
                      Final: ${order.finalTotal.toFixed(2)}
                    </p>
                  )}
                </div>
                {(order.requestedEta || order.adminEta) && (
                  <div className="text-right">
                    {order.requestedEta && <p className="text-xs text-zinc-500">Requested: {new Date(order.requestedEta).toLocaleString()}</p>}
                    {order.adminEta && <p className="text-xs font-medium text-emerald-700">Admin: {new Date(order.adminEta).toLocaleString()}</p>}
                  </div>
                )}
              </div>
            </div>
          ))}

          {deliveredOrders.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
              <p className="text-sm text-zinc-500">No delivered orders yet</p>
            </div>
          )}
        </div>
      )}

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

            <p className="mb-4 rounded-lg bg-amber-50 p-2 text-[10px] text-amber-700 sm:text-xs">
              Editing will revert this order to Pending for the admin to re-review. Final price and admin ETA will be reset.
            </p>

            <div className="space-y-2">
              {editItems.map((item, idx) => (
                <div
                  key={`${item.orderItemId || "new"}-${idx}`}
                  className="flex flex-col gap-2 rounded-lg bg-zinc-50 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3"
                >
                  <div className="flex-1">
                    <p className="text-xs font-medium text-zinc-900 sm:text-sm">
                      {item.itemName}
                    </p>
                    <p className="text-[10px] text-zinc-500 sm:text-xs">
                      ${(inventory.find((i) => i.id === item.itemId)?.basePriceKg ?? 0).toFixed(2)}/kg
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(idx, -0.5)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 text-sm hover:bg-zinc-50"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={item.requestedKg}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEditItems((prev) =>
                          prev.map((p, i) =>
                            i === idx
                              ? { ...p, requestedKg: Number.isFinite(val) && val > 0 ? val : 0.1 }
                              : p
                          )
                        );
                      }}
                      className="w-14 rounded border border-zinc-300 px-1.5 py-1 text-center text-xs sm:w-16 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(idx, 0.5)}
                      className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 text-sm hover:bg-zinc-50"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="ml-1 text-[10px] font-medium text-red-600 hover:text-red-500 sm:text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {availableItems.length > 0 && (
              <div className="mt-3 flex gap-2">
                <select
                  value={newItemId}
                  onChange={(e) => setNewItemId(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="">Add an item...</option>
                  {availableItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.itemName} — ${item.basePriceKg.toFixed(2)}/kg
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={!newItemId}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-xs text-zinc-500 sm:text-sm">New total (estimate)</p>
              <p className="font-semibold text-zinc-900 sm:text-lg">
                ${editItems
                  .reduce((sum, item) => {
                    const price = inventory.find((i) => i.id === item.itemId)?.basePriceKg ?? 0;
                    return sum + price * item.requestedKg;
                  }, 0)
                  .toFixed(2)}
              </p>
            </div>

            <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3 sm:mt-6 sm:gap-3 sm:pt-4">
              <button
                onClick={() => setEditingOrder(null)}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 sm:flex-none sm:px-4 sm:text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
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
