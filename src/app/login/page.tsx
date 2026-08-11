"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Fetch session to determine role
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        
        if (session?.user?.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/catalog";
        }
      }
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
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Sign In</h1>
        <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
          Access your wholesale account
        </p>
      </div>

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

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-700 sm:text-sm"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-500 sm:text-xs"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 sm:px-4 sm:py-2.5"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-zinc-600 sm:mt-6 sm:text-sm">
        New restaurant?{" "}
        <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-500">
          Create an account
        </Link>
      </p>
    </div>
  );
}
