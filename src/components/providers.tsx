"use client";

import { SessionProvider } from "@/components/session-provider";
import { CartProvider } from "@/components/cart-provider";
import { InstallPrompt } from "@/components/install-prompt";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("SW registration failed:", err);
        });
      });
    }
  }, []);

  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
      <InstallPrompt />
    </SessionProvider>
  );
}
