"use client";

import { useState, useEffect } from "react";
import { onToast, type ToastMessage } from "@/lib/toast-events";

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [leaving, setLeaving] = useState<Record<string, boolean>>({});

  const dismissToast = (id: string) => {
    if (leaving[id]) return;
    setLeaving((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      setLeaving((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 300);
  };

  useEffect(() => {
    const unsub = onToast((toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => dismissToast(toast.id), 5000);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 sm:top-24 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`w-72 rounded-lg border p-3 shadow-lg duration-300 sm:w-80 ${
            leaving[toast.id]
              ? "animate-out fade-out"
              : "animate-in slide-in-from-right fade-in"
          } ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50"
              : toast.type === "warning"
              ? "border-amber-200 bg-amber-50"
              : "border-blue-200 bg-blue-50"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p
                className={`text-xs font-semibold sm:text-sm ${
                  toast.type === "success"
                    ? "text-emerald-900"
                    : toast.type === "warning"
                    ? "text-amber-900"
                    : "text-blue-900"
                }`}
              >
                {toast.title}
              </p>
              <p
                className={`mt-0.5 text-[10px] sm:text-xs ${
                  toast.type === "success"
                    ? "text-emerald-700"
                    : toast.type === "warning"
                    ? "text-amber-700"
                    : "text-blue-700"
                }`}
              >
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-2 text-zinc-400 hover:text-zinc-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
