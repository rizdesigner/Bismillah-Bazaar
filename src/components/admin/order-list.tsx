"use client";

import { useState } from "react";
import { OrderEditModal } from "./order-edit-modal";

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
  createdAt: string;
  user: {
    id: string;
    email: string;
    restaurantName: string | null;
  };
  items: OrderItem[];
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  modified: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  delivered: "bg-zinc-100 text-zinc-700",
};

export function OrderList({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const statuses = ["all", "pending", "modified", "confirmed", "delivered"];

  return (
    <div className="mt-6">
      <div className="mb-4 flex gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === s
                ? "bg-emerald-600 text-white"
                : "bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((order) => (
          <div
            key={order.id}
            className="rounded-xl border border-zinc-200 bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {order.user.restaurantName || order.user.email}
                </p>
                <p className="text-xs text-zinc-500">{order.user.email}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusColors[order.status] || "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {order.status}
                </span>
                <button
                  onClick={() => setEditingOrder(order)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-zinc-50 px-4 py-2 text-sm"
                >
                  <span className="font-medium text-zinc-900">
                    {item.item.itemName}
                  </span>
                  <div className="flex items-center gap-4 text-zinc-600">
                    <span>
                      Requested: {item.requestedKg} kg
                    </span>
                    <span className="font-medium text-emerald-700">
                      Fulfilled: {item.fulfilledKg ?? "—"} kg
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4 text-sm">
              <div>
                <p className="text-zinc-600">
                  Original: ${order.originalTotal.toFixed(2)}
                </p>
                {order.finalTotal && (
                  <p className="font-medium text-emerald-700">
                    Final: ${order.finalTotal.toFixed(2)}
                  </p>
                )}
              </div>
              {order.requestedEta && (
                <p className="text-zinc-600">
                  Requested: {new Date(order.requestedEta).toLocaleString()}
                </p>
              )}
              {order.adminEta && (
                <p className="font-medium text-emerald-700">
                  Admin ETA: {new Date(order.adminEta).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
            <p className="text-sm text-zinc-500">No orders found</p>
          </div>
        )}
      </div>

      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onUpdate={() => {
            setEditingOrder(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
