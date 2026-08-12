"use client";

import { useSession } from "./session-provider";
import { createClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NotificationBell } from "./notification-bell";
import { InstallButton } from "./install-button";

export function AppHeader() {
  const router = useRouter();
  const { profile } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMenu]);

  const displayName = profile?.restaurant_name || profile?.email;

  const handleSignOut = async (redirectUrl: string) => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(redirectUrl);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex w-full items-center justify-between px-4 py-2.5 sm:py-3">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
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
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <InstallButton />
          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Account menu"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 sm:h-10 sm:w-10"
            >
              {displayName?.charAt(0)?.toUpperCase() || "U"}
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
                <div className="border-b border-zinc-100 px-3.5 py-3">
                  <p className="truncate text-sm font-semibold text-zinc-900">
                    {displayName || "User"}
                  </p>
                  {profile?.email && (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      {profile.email}
                    </p>
                  )}
                </div>

                <nav className="p-1.5">
                  <Link
                    href="/account"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <svg
                      className="h-4 w-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Change Password
                  </Link>

                  <button
                    onClick={() => handleSignOut("/login")}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <svg
                      className="h-4 w-4 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <path d="M16 17l5-5-5-5" />
                      <path d="M21 12H9" />
                    </svg>
                    Switch Account
                  </button>

                  <button
                    onClick={() => handleSignOut("/")}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M10 17l5-5-5-5" />
                      <path d="M15 12H3" />
                      <path d="M21 21V3" />
                    </svg>
                    Logout
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
