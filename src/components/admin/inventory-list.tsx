"use client";

import { useState } from "react";

type InventoryItem = {
  id: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  inStock: boolean;
  imageUrl: string | null;
};

export function InventoryList({ items }: { items: InventoryItem[] }) {
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
    } catch (err) {
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
    } catch (err) {
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
    <div className="mt-6">
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
        className="mb-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
      >
        Add Item
      </button>

      {showForm && (
        <div className="mb-6 rounded-xl border border-zinc-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-bold text-zinc-900">
            {editingItem ? "Edit Item" : "Add New Item"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
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
                <label className="block text-sm font-medium text-zinc-700">
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
                <label className="block text-sm font-medium text-zinc-700">
                  Base Price ($/lb)
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
                <label className="block text-sm font-medium text-zinc-700">
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
              <label htmlFor="inStock" className="text-sm text-zinc-700">
                In Stock
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <table className="w-full">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-600">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-600">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-600">
                Price/lb
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-zinc-600">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-zinc-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50">
                <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                  {item.itemName}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600">
                  {item.category}
                </td>
                <td className="px-6 py-4 text-sm text-zinc-600">
                  ${item.basePriceKg.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      item.inStock
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {item.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => startEdit(item)}
                    className="mr-2 text-sm font-medium text-emerald-600 hover:text-emerald-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
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
