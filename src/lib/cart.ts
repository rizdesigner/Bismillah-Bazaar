export type PieceSize = {
  id: string;
  sizeLabel: string;
  sizeValue: number;
  sizeUnit: string;
};

export type CartItem = {
  itemId: string;
  itemName: string;
  category: string;
  basePriceKg: number;
  quantity: number;
  pieceSize?: PieceSize;
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

function cartItemKey(item: CartItem): string {
  return item.pieceSize ? `${item.itemId}::${item.pieceSize.id}` : item.itemId;
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity: number): CartItem[] {
  const cart = getCart();
  const key = item.pieceSize ? `${item.itemId}::${item.pieceSize.id}` : item.itemId;
  const existing = cart.find((i) => cartItemKey(i) === key);
  if (existing) {
    existing.quantity = Math.round((existing.quantity + quantity) * 10) / 10;
  } else {
    cart.push({ ...item, quantity });
  }
  saveCart(cart);
  return cart;
}

export function updateCartQty(itemId: string, pieceSizeId: string | undefined, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return removeFromCart(itemId, pieceSizeId);
  }
  const cart = getCart();
  const key = pieceSizeId ? `${itemId}::${pieceSizeId}` : itemId;
  const existing = cart.find((i) => cartItemKey(i) === key);
  if (existing) {
    existing.quantity = Math.round(quantity * 10) / 10;
  }
  saveCart(cart);
  return cart;
}

export function removeFromCart(itemId: string, pieceSizeId?: string): CartItem[] {
  const key = pieceSizeId ? `${itemId}::${pieceSizeId}` : itemId;
  const cart = getCart().filter((i) => cartItemKey(i) !== key);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
}
