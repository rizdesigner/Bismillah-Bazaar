import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/change-password-form";

export const metadata = { title: "Admin Settings" };

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Manage your admin account security.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
        <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
          Change Password
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Update your admin password. You&apos;ll be asked for your current password first.
        </p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </div>

      {admin && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Account
          </h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Email
              </p>
              <p className="font-medium text-zinc-900">{admin.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Role
              </p>
              <p className="font-medium capitalize text-zinc-900">{admin.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
