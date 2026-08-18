import { createClient } from "@/lib/supabase-server";
import { ChangePasswordForm } from "@/components/change-password-form";
import { SmtpSettingsForm } from "@/components/admin/smtp-settings-form";

export const runtime = 'edge';
export const metadata = { title: "Admin Settings" };

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: admin } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Settings</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Manage your admin account and email configuration.
      </p>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
        <h2 className="text-sm font-bold text-zinc-900 sm:text-base">
          Email Settings
        </h2>
        <p className="mt-1 text-xs text-zinc-600">
          Configure SMTP for delivery receipts and password reset emails.
        </p>
        <div className="mt-4">
          <SmtpSettingsForm />
        </div>
      </div>

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
