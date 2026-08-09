const listeners = new Set<(toast: ToastMessage) => void>();

export type ToastMessage = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning";
};

export function emitToast(toast: Omit<ToastMessage, "id">) {
  const t: ToastMessage = {
    ...toast,
    id: Math.random().toString(36).slice(2) + Date.now().toString(36),
  };
  listeners.forEach((l) => l(t));
}

export function onToast(listener: (toast: ToastMessage) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
