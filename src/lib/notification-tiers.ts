export type NotificationTier = 1 | 2;

// Tier 1 (Immediate Action): audio alert + red bell + UI toast.
const TIER1_ADMIN_TYPES = new Set([
  "new_registration",
  "new_order",
  "order_edited",
  "order_cancelled",
  "amendment_requested",
  "amendment_accepted",
  "amendment_rejected",
]);

const TIER1_RESTAURANT_TYPES = new Set([
  "account_approved",
  "order_modified",
  "amendment_requested",
  "amendment_accepted",
  "amendment_rejected",
]);

// Everything else (order_delivered, order_paid, pricing_assigned,
// account_update, order_confirmed, ...) defaults to Tier 2 (status update):
// silently increment the bell badge, no audio and no toast.
export function isTier1(type: string, role?: string): boolean {
  const set = role === "admin" ? TIER1_ADMIN_TYPES : TIER1_RESTAURANT_TYPES;
  return set.has(type);
}