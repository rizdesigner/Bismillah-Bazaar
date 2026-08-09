"use client";

type Customer = {
  id: string;
  email: string;
  restaurantName: string | null;
  phone: string | null;
  location: string | null;
  status: string;
  createdAt: string;
};

const statusColors: Record<string, string> = {
  pending_approval: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-red-100 text-red-700",
};

export function CustomerList({ customers }: { customers: Customer[] }) {
  const handleStatusChange = async (
    id: string,
    newStatus: "active" | "suspended"
  ) => {
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update customer");
        return;
      }

      window.location.reload();
    } catch (err) {
      alert("An error occurred");
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {customers.map((customer) => (
        <div
          key={customer.id}
          className="rounded-xl border border-zinc-200 bg-white p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-zinc-900">
                {customer.restaurantName || "Unnamed Restaurant"}
              </p>
              <p className="text-sm text-zinc-600">{customer.email}</p>
              {customer.phone && (
                <p className="mt-1 text-sm text-zinc-600">
                  {customer.phone}
                </p>
              )}
              {customer.location && (
                <p className="mt-1 text-sm text-zinc-600">
                  {customer.location}
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500">
                Registered: {new Date(customer.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  statusColors[customer.status] || "bg-zinc-100 text-zinc-700"
                }`}
              >
                {customer.status.replace("_", " ")}
              </span>

              {customer.status === "pending_approval" && (
                <button
                  onClick={() => handleStatusChange(customer.id, "active")}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Approve
                </button>
              )}

              {customer.status === "active" && (
                <button
                  onClick={() =>
                    handleStatusChange(customer.id, "suspended")
                  }
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500"
                >
                  Suspend
                </button>
              )}

              {customer.status === "suspended" && (
                <button
                  onClick={() => handleStatusChange(customer.id, "active")}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Reactivate
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {customers.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">No customers found</p>
        </div>
      )}
    </div>
  );
}
