import { AppHeader } from "@/components/app-header";
import { BottomTabBar } from "@/components/bottom-tab-bar";
import { CartButton } from "@/components/cart-button";
import { ToastContainer } from "@/components/toast-container";
import { NotificationPoller } from "@/components/notification-poller";
import { CartProvider } from "@/components/cart-provider";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <CartProvider>
      <div className="flex min-h-dvh w-full flex-col bg-red-500">
        <AppHeader />
        <main className="flex-1 px-4 pb-32 pt-4 sm:px-6 lg:px-8">{children}</main>
        <BottomTabBar />
        <CartButton />
        <ToastContainer />
        <NotificationPoller />
      </div>
    </CartProvider>
  );
}
