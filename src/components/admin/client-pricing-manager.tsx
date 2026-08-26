"use client";

import { useState, useEffect } from "react";

type Customer = {
  id: string;
  email: string;
  restaurantName: string | null;
};

type InventoryItem = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
};

type ClientOverride = {
  id: string;
  userId: string;
  itemId: string;
  customPriceKg: number | null;
  isAvailable: boolean;
  item: InventoryItem;
};

export function ClientPricingManager({
  customers,
  inventory,
}: {
  customers: Customer[];
  inventory: InventoryItem[];
}) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [overrides, setOverrides] = useState<ClientOverride[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchOverrides(selectedCustomerId);
    } else {
      setOverrides([]);
    }
  }, [selectedCustomerId]);

  async function fetchOverrides(userId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/client-overrides?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setOverrides(data);
      }
    } catch (error) {
      console.error("Failed to fetch overrides:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveOverride(
    itemId: string,
    customPriceKg: number | null,
    isAvailable: boolean
  ) {
    if (!selectedCustomerId) return;

    setSaving(itemId);
    try {
      const res = await fetch("/api/admin/client-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedCustomerId,
          itemId,
          customPriceKg,
          isAvailable,
        }),
      });

      if (res.ok) {
        await fetchOverrides(selectedCustomerId);
      }
    } catch (error) {
      console.error("Failed to save override:", error);
    } finally {
      setSaving(null);
    }
  }

  const overridesMap = new Map(overrides.map((o) => [o.itemId, o]));

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Select Customer
        </label>
        <select
          value={selectedCustomerId}
          onChange={(e) => setSelectedCustomerId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Choose a customer...</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.restaurantName || customer.email}
            </option>
          ))}
        </select>
      </div>

      {selectedCustomerId && (
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-900">
              Product Pricing & Visibility
            </h3>
            <p className="mt-1 text-xs text-zinc-500">
              Set custom prices or hide items for this customer
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {inventory.map((item) => {
                const override = overridesMap.get(item.id);
                const customPrice = override?.customPriceKg;
                const isAvailable = override?.isAvailable ?? true;

                return (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zinc-900">
                          {item.itemName}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Base price: ${item.basePriceKg.toFixed(2)}/lb
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-zinc-600">
                            Custom Price:
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={item.basePriceKg.toFixed(2)}
                            value={customPrice ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              const newPrice = value ? parseFloat(value) : null;
                              handleSaveOverride(
                                item.id,
                                newPrice,
                                isAvailable
                              );
                            }}
                            disabled={saving === item.id}
                            className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
                          />
                        </div>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={isAvailable}
                            onChange={(e) => {
                              handleSaveOverride(
                                item.id,
                                customPrice ?? null,
                                e.target.checked
                              );
                            }}
                            disabled={saving === item.id}
                            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-xs text-zinc-600">Visible</span>
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
