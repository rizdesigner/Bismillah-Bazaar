"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const tabs: Tab[] = [
  {
    href: "/catalog",
    label: "Catalog",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 sm:h-6 sm:w-6"
        aria-hidden="true"
      >
        <path d="M4 4h16v16H4z" fill={active ? "currentColor" : "none"} />
        <path d="M4 10h16M10 4v16" opacity={0.9} />
      </svg>
    ),
  },
  {
    href: "/orders",
    label: "Orders",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 sm:h-6 sm:w-6"
        aria-hidden="true"
      >
        <path d="M6 3h12l2 6v12H4V9z" fill={active ? "currentColor" : "none"} />
        <path d="M8 3v6h8V3" opacity={0.9} />
      </svg>
    ),
  },
  {
    href: "/messages",
    label: "Messages",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 sm:h-6 sm:w-6"
        aria-hidden="true"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill={active ? "currentColor" : "none"} />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account",
    icon: (active) => (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 sm:h-6 sm:w-6"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" fill={active ? "currentColor" : "none"} />
        <path
          d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"
          fill={active ? "currentColor" : "none"}
        />
      </svg>
    ),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:mx-auto sm:max-w-md"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium sm:gap-1 sm:py-2.5 sm:text-xs"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={
                    active
                      ? "text-emerald-600"
                      : "text-zinc-500"
                  }
                >
                  {tab.icon(active)}
                </span>
                <span
                  className={
                    active ? "text-emerald-700" : "text-zinc-500"
                  }
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
