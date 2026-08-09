"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-provider";

export function CartButton() {
  const { count } = useCart();
  const pathname = usePathname();

  if (count === 0) return null;
  if (pathname === "/cart") return null;

  return (
    <Link
      href="/cart"
      className="fixed bottom-20 right-3 z-30 flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg hover:bg-emerald-500 sm:bottom-24 sm:right-4 sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
    >
      <svg
        className="h-4 w-4 sm:h-5 sm:w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      View Cart ({count} kg)
    </Link>
  );
}
