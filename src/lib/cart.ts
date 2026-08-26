export type CartItem = {
  itemId: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  quantity: number;
  chunkSize?: string;
};

export function parseChunkGrams(chunkSize: string): number | null {
  const match = chunkSize.match(/(\d+(?:\.\d+)?)\s*g/i);
  return match ? parseFloat(match[1]) : null;
}

export function calcWeightLb(quantity: number, chunkSize?: string): number {
  if (!chunkSize) return quantity;
  const grams = parseChunkGrams(chunkSize);
  if (grams == null) return quantity;
  return (quantity * grams) / 453.592;
}

const CART_KEY = "bismillah_cart";

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CART_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function cartItemKey(item: CartItem): string {
  return item.chunkSize != null ? `${item.itemId}::${item.chunkSize}` : item.itemId;
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity: number): CartItem[] {
  const cart = getCart();
  const key = item.chunkSize != null ? `${item.itemId}::${item.chunkSize}` : item.itemId;
  const existing = cart.find((i) => cartItemKey(i) === key);
  if (existing) {
    existing.quantity = Math.round((existing.quantity + quantity) * 10) / 10;
  } else {
    cart.push({ ...item, quantity });
  }
  saveCart(cart);
  return cart;
}

export function updateCartQty(itemId: string, chunkSize: string | undefined, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(itemId, chunkSize);
  }
  const cart = getCart();
  const key = chunkSize != null ? `${itemId}::${chunkSize}` : itemId;
  const existing = cart.find((i) => cartItemKey(i) === key);
  if (existing) {
    existing.quantity = Math.round(quantity * 10) / 10;
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId: string, chunkSize?: string): CartItem[] {
  const key = chunkSize != null ? `${itemId}::${chunkSize}` : itemId;
  const cart = getCart().filter((i) => cartItemKey(i) !== key);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
