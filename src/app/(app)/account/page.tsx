export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="px-4 pt-4">
      <h1 className="text-xl font-bold text-zinc-900">Account</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Restaurant profile and approvals.
      </p>

      <div className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
        <p className="text-sm font-medium text-zinc-500">
          Sign-in and profile management will appear here.
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          Coming in Phase 2: Auth &amp; Onboarding
        </p>
      </div>
    </div>
  );
}
