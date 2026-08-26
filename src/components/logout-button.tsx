"use client";

import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
    window.location.href = "/";
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 sm:text-base"
    >
      {loading ? "Signing out..." : "Logout"}
    </button>
  );
}
