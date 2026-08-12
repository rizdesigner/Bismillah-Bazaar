"use client";

import { useState, useEffect } from "react";

type Customer = {
  id: string;
  email: string;
  restaurantName: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  finalTotal: number | null;
  originalTotal: number;
  paymentStatus: string;
  dueDate: string | null;
  paidAt: string | null;
  user: {
    id: string;
    restaurantName: string | null;
    email: string;
  };
};

type CustomerBalance = {
  customerId: string;
  restaurantName: string | null;
  email: string;
  totalUnpaid: number;
  overdueAmount: number;
  orderCount: number;
};

export function AccountsReceivable({ orders }: { orders: Order[] }) {
  const [customerBalances, setCustomerBalances] = useState<CustomerBalance[]>([]);

  useEffect(() => {
    const balances = new Map<string, CustomerBalance>();

    orders.forEach((order) => {
      if (order.paymentStatus === "paid") return;

      const customerId = order.user.id;
      const amount = Number(order.finalTotal ?? order.originalTotal);
      const isOverdue = order.dueDate && new Date(order.dueDate) < new Date();

      if (!balances.has(customerId)) {
        balances.set(customerId, {
          customerId,
          restaurantName: order.user.restaurantName,
          email: order.user.email,
          totalUnpaid: 0,
          overdueAmount: 0,
          orderCount: 0,
        });
      }

      const balance = balances.get(customerId)!;
      balance.totalUnpaid += amount;
      balance.orderCount += 1;
      if (isOverdue) {
        balance.overdueAmount += amount;
      }
    });

    const sorted = Array.from(balances.values()).sort(
      (a, b) => b.totalUnpaid - a.totalUnpaid
    );

    setCustomerBalances(sorted);
  }, [orders]);

  const totalReceivable = customerBalances.reduce(
    (sum, b) => sum + b.totalUnpaid,
    0
  );
  const totalOverdue = customerBalances.reduce(
    (sum, b) => sum + b.overdueAmount,
    0
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total Receivable
          </p>
          <p className="mt-1 text-2xl font-bold text-zinc-900">
            ${totalReceivable.toFixed(2)}
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-red-600">
            Total Overdue
          </p>
          <p className="mt-1 text-2xl font-bold text-red-900">
            ${totalOverdue.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            Customer Balances
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Sorted by total unpaid amount
          </p>
        </div>

        {customerBalances.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            No outstanding balances
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {customerBalances.map((balance) => (
              <div key={balance.customerId} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">
                      {balance.restaurantName || balance.email}
                    </p>
                    <p className="text-xs text-zinc-500">{balance.email}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {balance.orderCount} unpaid order{balance.orderCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-zinc-900">
                      ${balance.totalUnpaid.toFixed(2)}
                    </p>
                    {balance.overdueAmount > 0 && (
                      <p className="text-xs font-medium text-red-600">
                        ${balance.overdueAmount.toFixed(2)} overdue
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
