import { AdminHeader } from "@/components/admin-header";
import { ToastContainer } from "@/components/toast-container";
import { NotificationPoller } from "@/components/notification-poller";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-zinc-100">
      <AdminHeader />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        {children}
      </main>
      <ToastContainer />
      <NotificationPoller />
    </div>
  );
}
