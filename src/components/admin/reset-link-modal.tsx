"use client";

import { useState, useEffect } from "react";

type ResetUser = {
  id: string;
  email: string;
  restaurantName: string | null;
};

export function ResetLinkModal({
  user,
  onClose,
}: {
  user: ResetUser | null;
  onClose: () => void;
}) {
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;

    const generate = async () => {
      setLoading(true);
      setError("");
      setCopied(false);

      try {
        const res = await fetch(`/api/admin/users/${user.id}/reset-link`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to generate reset link");
          return;
        }

        setResetUrl(data.resetUrl);
      } catch {
        setError("An error occurred");
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [user]);

  if (!user) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy. Select and copy the link manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full rounded-t-2xl bg-white p-4 shadow-xl sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <h2 className="text-base font-bold text-zinc-900 sm:text-xl">
            Password Reset Link
          </h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-zinc-600 sm:text-sm">
          Share this one-time link with{" "}
          <span className="font-medium text-zinc-900">
            {user.restaurantName || user.email}
          </span>
          . It expires in 1 hour and can only be used once.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 sm:p-3 sm:text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-4 rounded-lg bg-zinc-50 p-4 text-center text-sm text-zinc-500">
            Generating link...
          </div>
        ) : (
          resetUrl && (
            <div className="mt-4 space-y-3">
              <textarea
                readOnly
                value={resetUrl}
                rows={3}
                className="w-full rounded-lg border border-zinc-300 bg-zinc-50 p-2 text-[10px] text-zinc-700 focus:outline-none sm:p-3 sm:text-xs"
              />
              <div className="flex gap-2">
                <button
                  onClick={copyLink}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Done
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
