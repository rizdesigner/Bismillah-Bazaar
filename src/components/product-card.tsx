"use client";

import { useCart } from "./cart-provider";
import { useState } from "react";

type Product = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  priceKg: number;
  hasCustomPrice: boolean;
  imageUrl: string | null;
  availableChunkSizes?: number[];
};

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQty, removeItem } = useCart();
  const chunkSizes = product.availableChunkSizes ?? [];
  const hasSizes = chunkSizes.length > 0;
  const [selectedChunk, setSelectedChunk] = useState<number | null>(hasSizes ? chunkSizes[0] : null);

  const cartItem = items.find((i) =>
    hasSizes
      ? i.itemId === product.id && i.chunkSize === selectedChunk
      : i.itemId === product.id && i.chunkSize == null
  );
  const qty = cartItem?.quantity ?? 0;

  const effectivePrice = selectedChunk != null
    ? product.priceKg * (selectedChunk / 453.592)
    : product.priceKg;

  const handleDecrease = () => {
    if (qty >= 1) {
      updateQty(product.id, selectedChunk ?? undefined, qty - 1);
    } else if (qty > 0) {
      removeItem(product.id, selectedChunk ?? undefined);
    }
  };

  const handleIncrease = () => {
    addItem(
      {
        itemId: product.id,
        itemName: product.itemName,
        category: product.category,
        basePriceKg: product.priceKg,
        chunkSize: selectedChunk ?? undefined,
      },
      1
    );
  };

  const handleSizeChange = (chunkSize: number) => {
    setSelectedChunk(chunkSize);
    const existing = items.find(
      (i) => i.itemId === product.id && i.chunkSize === chunkSize
    );
    if (!existing) {
      removeItem(product.id, selectedChunk ?? undefined);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
      <div className="mb-2 flex h-24 items-center justify-center rounded-lg bg-zinc-100 sm:mb-3 sm:h-32">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.itemName}
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <svg
            className="h-10 w-10 text-zinc-400 sm:h-12 sm:w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>
      <h3 className="text-sm font-semibold text-zinc-900 sm:text-base">{product.itemName}</h3>
      <p className="mt-1 text-base font-bold text-emerald-600 sm:text-lg">
        ${effectivePrice.toFixed(2)}
        <span className="text-xs font-normal text-zinc-500 sm:text-sm">
          {selectedChunk != null ? `/ ${selectedChunk}g chunk` : "/lb"}
        </span>
      </p>
      {product.hasCustomPrice && (
        <p className="mt-0.5 text-[10px] text-zinc-500 sm:text-xs">
          Custom price
        </p>
      )}

      {hasSizes && (
        <select
          value={selectedChunk ?? ""}
          onChange={(e) => {
            const val = Number(e.target.value);
            if (val) handleSizeChange(val);
          }}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs sm:text-sm"
        >
          {chunkSizes.map((size) => (
            <option key={size} value={size}>
              {size}g chunks
            </option>
          ))}
        </select>
      )}

      <div className="mt-2 flex items-center justify-between sm:mt-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleDecrease}
            disabled={qty === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 sm:h-8 sm:w-8"
          >
            −
          </button>
          <span className="w-16 text-center text-xs font-medium sm:w-20 sm:text-sm">
            {qty > 0 && selectedChunk != null
              ? `${qty} × ${selectedChunk}g`
              : qty > 0
              ? `${qty} lb`
              : "0"}
          </span>
          <button
            onClick={handleIncrease}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 sm:h-8 sm:w-8"
          >
            +
          </button>
        </div>
        {qty > 0 && (
          <button
            onClick={() => removeItem(product.id, selectedChunk ?? undefined)}
            className="text-[10px] text-red-600 hover:text-red-500 sm:text-xs"
          >
            Remove
          </button>
        )}
      </div>
      {qty > 0 && (
        <p className="mt-1.5 text-right text-xs font-medium text-emerald-700 sm:mt-2 sm:text-sm">
          ${(qty * effectivePrice).toFixed(2)}
        </p>
      )}
    </div>
  );
}
