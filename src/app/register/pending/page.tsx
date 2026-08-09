import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
        <svg
          className="h-10 w-10 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-zinc-900">
        Account Pending Approval
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-600">
        Thanks for registering! Your account is awaiting admin approval.
        You&apos;ll be able to browse the catalog and place orders once
        activated.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Back to Sign In
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
