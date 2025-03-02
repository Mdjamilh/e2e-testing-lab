import { describe, expect, it } from "vitest";
import {
  FLAT_SHIPPING_CENTS,
  MAX_QUANTITY,
  addToCart,
  cartTotals,
  removeFromCart,
  setQuantity,
  type CartLine,
} from "./cart";
import { CATALOG } from "./products";

const gloves = CATALOG.find((p) => p.id === "glv-nitrile-m")!; // $12.99
const oximeter = CATALOG.find((p) => p.id === "dx-oximeter")!; // $29.99

describe("addToCart", () => {
  it("adds a new line", () => {
    expect(addToCart([], gloves)).toEqual([{ product: gloves, quantity: 1 }]);
  });

  it("merges repeated adds into one line", () => {
    const lines = addToCart(addToCart([], gloves), gloves, 2);
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });

  it("caps the quantity at the maximum", () => {
    const lines = addToCart([], gloves, MAX_QUANTITY + 5);
    expect(lines[0].quantity).toBe(MAX_QUANTITY);
  });

  it("does not mutate the input array", () => {
    const original: CartLine[] = [];
    addToCart(original, gloves);
    expect(original).toEqual([]);
  });
});

describe("setQuantity and removeFromCart", () => {
  it("removes a line when the quantity drops to zero", () => {
    expect(setQuantity([{ product: gloves, quantity: 2 }], gloves.id, 0)).toEqual([]);
  });

  it("treats non-numeric input as zero", () => {
    expect(setQuantity([{ product: gloves, quantity: 2 }], gloves.id, Number.NaN)).toEqual([]);
  });

  it("floors fractional quantities", () => {
    expect(setQuantity([{ product: gloves, quantity: 1 }], gloves.id, 2.7)[0].quantity).toBe(2);
  });

  it("removes only the named product", () => {
    const lines = [
      { product: gloves, quantity: 1 },
      { product: oximeter, quantity: 1 },
    ];
    expect(removeFromCart(lines, gloves.id).map((l) => l.product.id)).toEqual([oximeter.id]);
  });
});

describe("cartTotals", () => {
  it("is all zeros for an empty cart, with no shipping charge", () => {
    expect(cartTotals([])).toEqual({ itemCount: 0, subtotalCents: 0, shippingCents: 0, taxCents: 0, totalCents: 0 });
  });

  it("charges flat shipping below the free-shipping threshold", () => {
    const totals = cartTotals([{ product: gloves, quantity: 2 }]);
    expect(totals.subtotalCents).toBe(2598);
    expect(totals.shippingCents).toBe(FLAT_SHIPPING_CENTS);
    expect(totals.taxCents).toBe(208); // 8% of 25.98 = 2.0784
    expect(totals.totalCents).toBe(2598 + FLAT_SHIPPING_CENTS + 208);
  });

  it("ships free at or above $75", () => {
    const totals = cartTotals([
      { product: oximeter, quantity: 2 },
      { product: gloves, quantity: 2 },
    ]);
    expect(totals.subtotalCents).toBe(8596);
    expect(totals.shippingCents).toBe(0);
    expect(totals.itemCount).toBe(4);
  });

  it("does not tax shipping", () => {
    const totals = cartTotals([{ product: gloves, quantity: 1 }]);
    expect(totals.taxCents).toBe(Math.round(1299 * 0.08));
  });
});
