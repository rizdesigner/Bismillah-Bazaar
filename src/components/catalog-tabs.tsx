"use client";

import { useState } from "react";
import { ProductCard } from "./product-card";

type InventoryItem = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  priceKg: number;
  hasCustomPrice: boolean;
  imageUrl: string | null;
  availableChunkSizes?: string[];
};

const categories = ["Chicken", "Beef", "Goat", "Lamb", "Mixed"] as const;

export function CatalogTabs({ inventory }: { inventory: InventoryItem[] }) {
  const [activeCategory, setActiveCategory] = useState<string>("Chicken");

  const filtered = inventory.filter((item) => item.category === activeCategory);

  return (
    <div className="mt-4 sm:mt-6">
      <div className="mb-4 flex gap-2 overflow-x-auto sm:mb-6">
        {categories.map((category) => {
          const count = inventory.filter((i) => i.category === category).length;
          if (count === 0) return null;
          return (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                activeCategory === category
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center sm:p-12">
          <p className="text-sm font-medium text-zinc-500">
            No items available in this category
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          {filtered.map((item) => (
            <ProductCard key={item.id} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}
