import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addToCart, cartTotals, removeFromCart, setQuantity, type CartLine, type CartTotals } from "../domain/cart";
import type { Product } from "../domain/products";
import { readJson, writeJson } from "./storage";

export const CART_KEY = "clinic-supplies.cart";

interface CartValue {
  lines: CartLine[];
  totals: CartTotals;
  add(product: Product, quantity?: number): void;
  update(productId: string, quantity: number): void;
  remove(productId: string): void;
  clear(): void;
}

const CartContext = createContext<CartValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readJson<CartLine[]>(CART_KEY, []));

  useEffect(() => writeJson(CART_KEY, lines.length ? lines : null), [lines]);

  const value = useMemo<CartValue>(
    () => ({
      lines,
      totals: cartTotals(lines),
      add: (product, quantity = 1) => setLines((prev) => addToCart(prev, product, quantity)),
      update: (productId, quantity) => setLines((prev) => setQuantity(prev, productId, quantity)),
      remove: (productId) => setLines((prev) => removeFromCart(prev, productId)),
      clear: () => setLines([]),
    }),
    [lines],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used inside <CartProvider>");
  return value;
}
