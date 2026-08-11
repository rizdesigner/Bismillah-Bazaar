"use client";

import { useEffect, useState } from "react";

function isAppInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const wasInstalled = localStorage.getItem("bb_app_installed") === "true";
  return isStandalone || isIOSStandalone || wasInstalled;
}

export function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isAppInstalled()) {
      localStorage.setItem("bb_app_installed", "true");
      setInstalled(true);
      return;
    }

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const onAppInstalled = () => {
      localStorage.setItem("bb_app_installed", "true");
      setDeferredPrompt(null);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-500 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
    >
      <svg
        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <path d="M7 10l5 5 5-5" />
        <path d="M12 15V3" />
      </svg>
      <span className="hidden sm:inline">Download App</span>
      <span className="sm:hidden">App</span>
    </button>
  );
}
