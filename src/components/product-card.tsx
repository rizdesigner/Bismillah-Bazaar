"use client";

import { useCart } from "./cart-provider";

type Product = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  imageUrl: string | null;
};

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, updateQty, removeItem } = useCart();
  const cartItem = items.find((i) => i.itemId === product.id);
  const qty = cartItem?.quantity ?? 0;

  const handleDecrease = () => {
    if (qty >= 0.5) {
      updateQty(product.id, qty - 0.5);
    } else if (qty > 0) {
      removeItem(product.id);
    }
  };

  const handleIncrease = () => {
    addItem(
      {
        itemId: product.id,
        itemName: product.itemName,
        category: product.category,
        basePriceKg: product.basePriceKg,
      },
      0.5
    );
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
        ${product.basePriceKg.toFixed(2)}
        <span className="text-xs font-normal text-zinc-500 sm:text-sm">/kg</span>
      </p>
      <div className="mt-2 flex items-center justify-between sm:mt-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleDecrease}
            disabled={qty === 0}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 sm:h-8 sm:w-8"
          >
            −
          </button>
          <span className="w-12 text-center text-xs font-medium sm:w-14 sm:text-sm">
            {qty > 0 ? `${qty} kg` : "0 kg"}
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
            onClick={() => removeItem(product.id)}
            className="text-[10px] text-red-600 hover:text-red-500 sm:text-xs"
          >
            Remove
          </button>
        )}
      </div>
      {qty > 0 && (
        <p className="mt-1.5 text-right text-xs font-medium text-emerald-700 sm:mt-2 sm:text-sm">
          ${(qty * product.basePriceKg).toFixed(2)}
        </p>
      )}
    </div>
  );
}
