"use client";

import { useState } from "react";

type OrderItem = {
  id: string;
  requestedKg: number;
  fulfilledKg: number | null;
  requestedChunkSize: number | null;
  item: {
    id: string;
    itemName: string;
  };
};

type Order = {
  id: string;
  status: string;
  originalTotal: number;
  finalTotal: number | null;
  requestedEta: string | null;
  adminEta: string | null;
  items: OrderItem[];
};

export function OrderEditModal({
  order,
  onClose,
  onUpdate,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [items, setItems] = useState(
    order.items.map((item) => ({
      id: item.id,
      fulfilledKg: item.fulfilledKg ?? item.requestedKg,
    }))
  );
  const [finalTotal, setFinalTotal] = useState(
    order.finalTotal ?? order.originalTotal
  );
  const [adminEta, setAdminEta] = useState(
    order.adminEta ? new Date(order.adminEta).toISOString().slice(0, 16) : ""
  );
  const [status, setStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            fulfilledKg: item.fulfilledKg,
          })),
          finalTotal,
          adminEta: adminEta || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update order");
        return;
      }

      onUpdate();
    } catch (err) {
      alert("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">Edit Order</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {order.requestedEta && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                Customer Requested Delivery
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-900">
                {new Date(order.requestedEta).toLocaleString()}
              </p>
            </div>
          )}

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-900">
              Line Items
            </h3>
            <div className="space-y-3">
              {items.map((item, idx) => {
                const orderItem = order.items[idx];
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {orderItem.item.itemName}{orderItem.requestedChunkSize ? ` (${orderItem.requestedChunkSize}g)` : ""}
                      </p>
                      <p className="text-xs text-zinc-500">
                         Requested: {orderItem.requestedKg} lb
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-zinc-600">Fulfilled:</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={orderItem.requestedKg}
                        value={item.fulfilledKg}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[idx] = {
                            ...item,
                            fulfilledKg: parseFloat(e.target.value) || 0,
                          };
                          setItems(newItems);
                        }}
                        className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm"
                      />
                      <span className="text-xs text-zinc-500">lb</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Final Total ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={finalTotal}
                onChange={(e) =>
                  setFinalTotal(parseFloat(e.target.value) || 0)
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Admin ETA
              </label>
              <input
                type="datetime-local"
                value={adminEta}
                onChange={(e) => setAdminEta(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="modified">Modified</option>
                <option value="confirmed">Confirmed</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
