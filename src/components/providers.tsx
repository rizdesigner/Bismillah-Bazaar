"use client";

import { SessionProvider } from "@/components/session-provider";
import { CartProvider } from "@/components/cart-provider";
import { InstallPrompt } from "@/components/install-prompt";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
      <InstallPrompt />
    </SessionProvider>
  );
}
