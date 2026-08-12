import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/change-password-form";

export const metadata = { title: "Account" };

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/");
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
                {profile.restaurant_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Email
              </p>
              <p className="text-sm font-medium text-zinc-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Phone
              </p>
              <p className="text-sm font-medium text-zinc-900">
                {profile.phone || "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 sm:text-xs">
                Location
              </p>
              <p className="text-sm font-medium text-zinc-900">
                {profile.location || "—"}
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
