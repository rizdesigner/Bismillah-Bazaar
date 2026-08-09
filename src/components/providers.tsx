"use client";

import { SerwistProvider } from "@serwist/turbopack/react";
import { SessionProvider } from "@/components/session-provider";
import { CartProvider } from "@/components/cart-provider";
import { InstallPrompt } from "@/components/install-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <SessionProvider>
        <CartProvider>{children}</CartProvider>
      </SessionProvider>
      <InstallPrompt />
    </SerwistProvider>
  );
}
