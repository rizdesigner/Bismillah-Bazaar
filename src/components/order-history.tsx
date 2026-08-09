"use client";

import { useState } from "react";

type OrderItem = {
  id: string;
  requestedKg: number;
  fulfilledKg: number | null;
  item: {
    itemName: string;
    basePriceKg: number;
  };
};

type Order = {
  id: string;
  status: string;
  originalTotal: number;
  finalTotal: number | null;
  eta: string | null;
  createdAt: string;
  items: OrderItem[];
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  modified: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  delivered: "bg-zinc-100 text-zinc-700",
};

export function OrderHistory({ orders }: { orders: Order[] }) {
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

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

  return (
    <div className="mt-6 space-y-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="rounded-xl border border-zinc-200 bg-white p-6"
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
            {order.eta && (
              <div className="text-right">
                <p className="text-xs text-zinc-500">ETA</p>
                <p className="font-medium text-zinc-900">
                  {new Date(order.eta).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No orders yet</p>
        </div>
      )}
    </div>
  );
}
