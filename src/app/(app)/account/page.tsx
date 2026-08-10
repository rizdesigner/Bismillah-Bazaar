import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/change-password-form";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return null;
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Account</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Your restaurant profile and security settings.
      </p>

      <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Restaurant Profile
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Restaurant Name
              </p>
              <p className="text-sm font-medium text-zinc-900">
                {user.restaurantName || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Email
              </p>
              <p className="text-sm font-medium text-zinc-900">{user.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Phone
              </p>
              <p className="text-sm font-medium text-zinc-900">
                {user.phone || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Location
              </p>
              <p className="text-sm font-medium text-zinc-900">
                {user.location || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
          <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
            Change Password
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Update your password. You&apos;ll be asked for your current password first.
          </p>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
