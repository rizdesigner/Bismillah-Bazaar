"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as cart from "@/lib/cart";

type CartContextType = {
  items: cart.CartItem[];
  count: number;
  total: number;
  addItem: (item: Omit<cart.CartItem, "quantity">, qty: number) => void;
  updateQty: (itemId: string, pieceSizeId: string | undefined, qty: number) => void;
  removeItem: (itemId: string, pieceSizeId?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<cart.CartItem[]>([]);

  useEffect(() => {
    setItems(cart.getCart());
  }, []);

  const addItem = useCallback((item: Omit<cart.CartItem, "quantity">, qty: number) => {
    const next = cart.addToCart(item, qty);
    setItems(next);
  }, []);

  const updateQty = useCallback((itemId: string, pieceSizeId: string | undefined, qty: number) => {
    const next = cart.updateCartQty(itemId, pieceSizeId, qty);
    setItems(next);
  }, []);

  const removeItem = useCallback((itemId: string, pieceSizeId?: string) => {
    const next = cart.removeFromCart(itemId, pieceSizeId);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    cart.clearCart();
    setItems([]);
  }, []);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => {
    const weightKg = i.pieceSize ? (i.quantity * i.pieceSize.sizeValue) / 453.592 : i.quantity;
    return sum + weightKg * i.basePriceKg;
  }, 0);

  return (
    <CartContext.Provider value={{ items, count, total, addItem, updateQty, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
