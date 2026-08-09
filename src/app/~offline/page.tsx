import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white">
        B
      </div>
      <h1 className="text-xl font-semibold text-zinc-900">
        You&apos;re offline
      </h1>
      <p className="mt-2 max-w-xs text-sm text-zinc-600">
        Reconnect to browse the catalog and place orders.
      </p>
    </div>
  );
}
