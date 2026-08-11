"use client";

import { useState, useEffect } from "react";

export function SmtpSettingsForm() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [host, setHost] = useState("");
  const [port, setPort] = useState("587");
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [from, setFrom] = useState("");

  useEffect(() => {
    fetchSmtpSettings();
  }, []);

  async function fetchSmtpSettings() {
    setFetching(true);
    try {
      const res = await fetch("/api/admin/smtp-settings");
      if (res.ok) {
        const data = await res.json();
        setHost(data.smtp_host || "");
        setPort(data.smtp_port || "587");
        setSecure(data.smtp_secure === "true");
        setUser(data.smtp_user || "");
        setFrom(data.smtp_from || "");
        if (data.smtp_pass) setPass(data.smtp_pass);
      }
    } catch (err) {
      console.error("Failed to fetch SMTP settings:", err);
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/smtp-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: host,
          smtp_port: port,
          smtp_secure: secure,
          smtp_user: user,
          smtp_pass: pass,
          smtp_from: from || user,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save settings");
        return;
      }

      setMessage("Email settings saved successfully");
      fetchSmtpSettings();
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          SMTP Host
        </label>
        <input
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          placeholder="smtp.gmail.com"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Port
          </label>
          <input
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
            placeholder="587"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input
              type="checkbox"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            Use SSL/TLS
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Username / Email
        </label>
        <input
          type="text"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          placeholder="your-email@gmail.com"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Password / App Password
        </label>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          placeholder={pass.startsWith("••••••••") ? "Leave blank to keep current" : "Enter password"}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <p className="mt-1 text-xs text-zinc-500">
          For Gmail, use an App Password (not your regular password)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          From Email (optional)
        </label>
        <input
          type="email"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          placeholder="noreply@yourdomain.com"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Leave blank to use the username as sender
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Saving..." : "Save Email Settings"}
      </button>
    </form>
  );
}
