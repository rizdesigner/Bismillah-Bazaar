"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "bb_install_dismissed";
const INSTALLED_KEY = "bb_app_installed";

function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;

  // Check if running in standalone mode (already installed)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;

  // Check localStorage fallback
  const wasInstalled = localStorage.getItem(INSTALLED_KEY) === "true";

  return isStandalone || isIOSStandalone || wasInstalled;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (isAppInstalled()) {
      localStorage.setItem(INSTALLED_KEY, "true");
      return; // Don't show install prompt
    }

    const wasDismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    setDismissed(wasDismissed);

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      if (!wasDismissed) {
        setTimeout(() => setVisible(true), 1500);
      }
    };

    const onAppInstalled = () => {
      localStorage.setItem(INSTALLED_KEY, "true");
      setDeferredPrompt(null);
      setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    // iOS doesn't fire beforeinstallprompt, so show the prompt manually
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = (window.navigator as any).standalone === true;
    if (isIOS && !isStandalone && !iosStandalone && !wasDismissed) {
      setTimeout(() => setVisible(true), 2000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (dismissed || !visible) return null;

  const isIOS = typeof window !== "undefined" && /iPhone|iPad|iPod/.test(navigator.userAgent);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }
    setDeferredPrompt(null);
    setVisible(false);
    localStorage.setItem(INSTALLED_KEY, "true");
    // On iOS there's no programmatic install — navigate to a page that
    // shows the "(App)" InstallButton modal with the Share -> Add steps.
    if (isIOS) {
      window.location.href = "/login";
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 top-16 z-50 mx-auto flex w-full max-w-md justify-center px-3 sm:top-20 sm:px-4">
      <div className="flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-lg sm:gap-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white sm:h-10 sm:w-10 sm:text-lg">
            B
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-emerald-900 sm:text-sm">
              Install Bismillah Bazaar
            </p>
            <p className="text-[10px] text-emerald-700 sm:text-xs">
              Add to home screen for quick ordering
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={handleInstall}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 sm:px-4 sm:py-2 sm:text-sm"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-100 sm:p-2"
            aria-label="Dismiss"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
