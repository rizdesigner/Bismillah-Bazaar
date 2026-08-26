"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart-provider";
import { useState } from "react";

export default function CartPage() {
  const router = useRouter();
  const { items, total, updateQty, removeItem, clear } = useCart();
  const [placing, setPlacing] = useState(false);
  const [requestedEta, setRequestedEta] = useState("");
  const [note, setNote] = useState("");
  const [minDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const handlePlaceOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            itemId: i.itemId,
            chunkSize: i.chunkSize ?? null,
            requestedLb: i.quantity,
          })),
          requestedEta: requestedEta || null,
          note: note.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to place order");
        return;
      }

      clear();
      router.push("/orders");
    } catch {
      alert("An error occurred");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Cart</h1>
        <p className="mt-1 text-sm text-zinc-600">Your cart is empty.</p>
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center sm:mt-8 sm:p-12">
          <p className="text-sm text-zinc-500">
            Add items from the catalog to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Cart</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Review your order before submitting.
      </p>

      <div className="mt-4 space-y-2 sm:mt-6 sm:space-y-3">
        {items.map((item) => {
          const hasChunk = item.chunkSize != null;
          const weightLb = hasChunk
            ? (item.quantity * item.chunkSize!) / 453.592
            : item.quantity;
          const itemTotal = weightLb * item.basePriceKg;
          const increment = hasChunk ? 1 : 0.5;

          return (
            <div
              key={hasChunk ? `${item.itemId}::${item.chunkSize}` : item.itemId}
              className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-zinc-900 sm:text-base">{item.itemName}</p>
                  <p className="text-xs text-zinc-500 sm:text-sm">
                    ${item.basePriceKg.toFixed(2)}/lb
                    {hasChunk && ` · ${item.chunkSize}g chunk`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => updateQty(item.itemId, item.chunkSize, item.quantity - increment)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-sm sm:h-8 sm:w-8"
                  >
                    −
                  </button>
                  <span className="w-16 text-center text-xs font-medium sm:w-20 sm:text-sm">
                    {hasChunk
                      ? `${item.quantity} × ${item.chunkSize}g`
                      : `${item.quantity} lb`}
                  </span>
                  <button
                    onClick={() => updateQty(item.itemId, item.chunkSize, item.quantity + increment)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-sm sm:h-8 sm:w-8"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.itemId, item.chunkSize)}
                    className="ml-1 text-xs text-red-600 sm:ml-2 sm:text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <p className="mt-2 text-right text-xs font-medium text-emerald-700 sm:text-sm">
                ${itemTotal.toFixed(2)}
                <span className="ml-1 text-zinc-400">
                  ({weightLb.toFixed(3)} lb)
                </span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 sm:mt-6 sm:p-4">
        <label className="block text-sm font-semibold text-zinc-900">
          Order Note (Optional)
        </label>
        <p className="mt-1 text-xs text-zinc-500">
          Any special instructions for this order.
        </p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Extra frozen, deliver to back entrance..."
          rows={3}
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:px-4 sm:py-2.5"
        />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 sm:mt-6 sm:p-4">
        <label className="block text-sm font-semibold text-zinc-900">
          Preferred Delivery Time
        </label>
        <p className="mt-1 text-xs text-zinc-500">
          Select when you&apos;d like this order delivered (admin may adjust).
        </p>
        <input
          type="datetime-local"
          value={requestedEta}
          onChange={(e) => setRequestedEta(e.target.value)}
          min={minDate}
          className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:px-4 sm:py-2.5"
        />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 sm:mt-6 sm:p-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-zinc-900 sm:text-lg">
            Estimated Total
          </span>
          <span className="text-base font-bold text-emerald-600 sm:text-lg">
            ${total.toFixed(2)}
          </span>
        </div>
        <p className="mt-1 text-[10px] text-zinc-500 sm:text-xs">
          Final price may be adjusted by admin based on availability
        </p>
      </div>

      <div className="mt-4 flex gap-2 sm:mt-6 sm:gap-3">
        <button
          onClick={clear}
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 sm:px-4 sm:py-3 sm:text-sm"
        >
          Clear Cart
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
        >
          {placing ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
