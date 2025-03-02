import type { Product } from "./products";

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface CartTotals {
  itemCount: number;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

export const MAX_QUANTITY = 20;
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const FLAT_SHIPPING_CENTS = 895;
/** Sales tax applied to the subtotal only, never to shipping. */
export const TAX_RATE = 0.08;

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(MAX_QUANTITY, Math.max(0, Math.floor(quantity)));
}

export function addToCart(lines: readonly CartLine[], product: Product, quantity = 1): CartLine[] {
  const existing = lines.find((l) => l.product.id === product.id);
  if (!existing) {
    const qty = clampQuantity(quantity);
    return qty > 0 ? [...lines, { product, quantity: qty }] : [...lines];
  }
  return setQuantity(lines, product.id, existing.quantity + quantity);
}

/** Sets the quantity of one line. A quantity of zero removes the line. */
export function setQuantity(lines: readonly CartLine[], productId: string, quantity: number): CartLine[] {
  const qty = clampQuantity(quantity);
  return lines
    .map((l) => (l.product.id === productId ? { ...l, quantity: qty } : l))
    .filter((l) => l.quantity > 0);
}

export function removeFromCart(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((l) => l.product.id !== productId);
}

export function cartTotals(lines: readonly CartLine[]): CartTotals {
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotalCents = lines.reduce((sum, l) => sum + l.product.priceCents * l.quantity, 0);
  const shippingCents =
    subtotalCents === 0 || subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return { itemCount, subtotalCents, shippingCents, taxCents, totalCents: subtotalCents + shippingCents + taxCents };
}
