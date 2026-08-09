export type CartItem = {
  itemId: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  quantity: number;
};

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

export function addToCart(item: Omit<CartItem, "quantity">, quantity: number): CartItem[] {
  const cart = getCart();
  const existing = cart.find((i) => i.itemId === item.itemId);
  if (existing) {
    existing.quantity = Math.round((existing.quantity + quantity) * 10) / 10;
  } else {
    cart.push({ ...item, quantity });
  }
  saveCart(cart);
  return cart;
}

export function updateCartQty(itemId: string, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(itemId);
  }
  const cart = getCart();
  const existing = cart.find((i) => i.itemId === itemId);
  if (existing) {
    existing.quantity = Math.round(quantity * 10) / 10;
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId: string): CartItem[] {
  const cart = getCart().filter((i) => i.itemId !== itemId);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
