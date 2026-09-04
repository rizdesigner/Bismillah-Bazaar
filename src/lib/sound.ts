"use client";

const SOUND_KEY = "bb_notification_sound";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(SOUND_KEY) !== "off";
}

export function setSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_KEY, enabled ? "on" : "off");
}

// Play a short, pleasant notification chime using the Web Audio API.
// No external audio file required.
export function playNotificationSound() {
  if (typeof window === "undefined") return;
  if (!isSoundEnabled()) return;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two ascending notes create a friendly "ding" chime.
    const notes = [880, 1174.66]; // A5, D6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

      osc.start(start);
      osc.stop(start + 0.4);
    });

    // Release the context shortly after playing.
    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 800);
  } catch (e) {
    // Sound is best-effort; never break the app if audio fails.
    console.error("[SOUND] Failed to play notification sound:", e);
  }
}
