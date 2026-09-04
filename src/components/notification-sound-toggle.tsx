"use client";

import { useState } from "react";
import { isSoundEnabled, setSoundEnabled, playNotificationSound } from "@/lib/sound";

export function NotificationSoundToggle() {
  const [enabled, setEnabled] = useState(() => isSoundEnabled());

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    // When turning sound back on, play a quick confirmation chime.
    if (next) playNotificationSound();
  };

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "Turn notification sound off" : "Turn notification sound on"}
      title={enabled ? "Sound on — tap to mute" : "Sound off — tap to unmute"}
      className={`relative rounded-lg p-2 transition-colors ${
        enabled
          ? "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
      }`}
    >
      {enabled ? (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
        </svg>
      ) : (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9l4 4m0-4l-4 4" />
        </svg>
      )}
    </button>
  );
}
