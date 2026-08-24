"use client";

import { useEffect, useState } from "react";

type Platform = "android" | "ios" | "desktop" | "unknown";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

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
  const [showModal, setShowModal] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");

  useEffect(() => {
    setPlatform(detectPlatform());
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
      setShowModal(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (installed) return null;

  const handleInstall = async () => {
    if (platform === "android" && deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowModal(false);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-zinc-900">
                Install Bismillah Bazaar
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {platform === "ios" && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  To install on your iPhone or iPad:
                </p>
                <div className="space-y-2.5">
                  <Step number={1} text="Tap the Share button" iosIcon />
                  <Step number={2} text='Tap "Add to Home Screen"' />
                  <Step number={3} text="Tap Add to confirm" />
                </div>
                <div className="mt-3 rounded-lg bg-emerald-50 p-3">
                  <p className="text-xs text-emerald-700">
                    The app will appear on your home screen like a native app.
                  </p>
                </div>
              </div>
            )}

            {platform === "android" && deferredPrompt && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  Install Bismillah Bazaar on your Android device:
                </p>
                <button
                  onClick={async () => {
                    deferredPrompt.prompt();
                    await deferredPrompt.userChoice;
                    setDeferredPrompt(null);
                    setShowModal(false);
                  }}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Install Now
                </button>
              </div>
            )}

            {platform === "android" && !deferredPrompt && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  To install on Android:
                </p>
                <div className="space-y-2.5">
                  <Step number={1} text='Open Chrome menu (⋮)' />
                  <Step number={2} text='Tap "Install app" or "Add to Home Screen"' />
                  <Step number={3} text="Tap Install to confirm" />
                </div>
              </div>
            )}

            {platform === "desktop" && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">
                  To install on your computer:
                </p>
                <div className="space-y-2.5">
                  <Step number={1} text='Click the install icon in the address bar' />
                  <Step number={2} text='Or use the browser menu → "Install app"' />
                </div>
                <div className="mt-3 rounded-lg bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-600">
                    Works on Chrome, Edge, and Safari.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Step({ number, text, iosIcon }: { number: number; text: string; iosIcon?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        {number}
      </div>
      <p className="pt-0.5 text-sm text-zinc-700">
        {text}
        {iosIcon && (
          <svg className="ml-1 inline h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        )}
      </p>
    </div>
  );
}
