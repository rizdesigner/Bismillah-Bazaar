"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [valid, setValid] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setValid(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        setValid(!!data.valid);
      } catch {
        setValid(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        return;
      }

      setSuccess(true);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (valid === null) {
    return (
      <div className="text-center text-sm text-zinc-500">Checking link...</div>
    );
  }

  if (!valid) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-center sm:p-6">
        <p className="text-sm font-medium text-red-700">
          This reset link is invalid or has expired.
        </p>
        <p className="mt-1 text-xs text-red-600">
          Please request a new one or contact your administrator.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-xs font-medium text-red-700 hover:text-red-600 sm:text-sm"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-center sm:p-6">
        <p className="text-sm font-medium text-emerald-800">
          Your password has been reset successfully.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 sm:p-3 sm:text-sm">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="password"
          className="block text-xs font-medium text-zinc-700 sm:text-sm"
        >
          New Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:px-4 sm:py-2.5"
        />
      </div>

      <div>
        <label
          htmlFor="confirm"
          className="block text-xs font-medium text-zinc-700 sm:text-sm"
        >
          Confirm New Password
        </label>
        <input
          id="confirm"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:px-4 sm:py-2.5"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 sm:px-6">
      <div className="mb-6 text-center sm:mb-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white sm:mb-4 sm:h-16 sm:w-16 sm:text-2xl">
          B
        </div>
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Reset Password</h1>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          Choose a new password for your account
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-sm text-zinc-500">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
