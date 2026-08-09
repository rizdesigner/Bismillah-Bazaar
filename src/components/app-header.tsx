"use client";

import { NotificationBell } from "./notification-bell";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex w-full items-center justify-between px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-base font-bold text-white sm:h-9 sm:w-9 sm:text-lg">
            B
          </div>
          <div className="leading-tight">
            <p className="text-xs font-bold text-zinc-900 sm:text-sm">
              Bismillah Bazaar
            </p>
            <p className="text-[9px] font-medium text-emerald-700 sm:text-[11px]">
              100% Halal Wholesale
            </p>
          </div>
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
