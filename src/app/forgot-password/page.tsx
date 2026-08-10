"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 sm:px-6">
      <div className="mb-6 text-center sm:mb-8">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-xl font-bold text-white sm:mb-4 sm:h-16 sm:w-16 sm:text-2xl">
          B
        </div>
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Forgot Password</h1>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          Enter your email to receive a reset link
        </p>
      </div>

      {submitted ? (
        <div className="rounded-xl bg-emerald-50 p-4 text-center sm:p-6">
          <p className="text-sm font-medium text-emerald-800">
            If an account exists with that email, a password reset link has been sent.
          </p>
          <p className="mt-2 text-xs text-emerald-700">
            No email? Contact your administrator or ask them to generate a reset link for you.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-xs font-medium text-emerald-600 hover:text-emerald-500 sm:text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 sm:p-3 sm:text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-700 sm:text-sm"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:px-4 sm:py-2.5"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-zinc-600 sm:mt-6 sm:text-sm">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
