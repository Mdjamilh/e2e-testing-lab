import type { ReactNode } from "react";
import { FREE_SHIPPING_THRESHOLD_CENTS, type CartTotals } from "../domain/cart";
import { formatCents } from "../domain/money";

export function OrderSummary({ totals, children }: { totals: CartTotals; children?: ReactNode }) {
  const toFreeShipping = FREE_SHIPPING_THRESHOLD_CENTS - totals.subtotalCents;
  return (
    <section className="card summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Order summary</h2>
      <dl>
        <div>
          <dt>Items</dt>
          <dd>{totals.itemCount}</dd>
        </div>
        <div>
          <dt>Subtotal</dt>
          <dd>{formatCents(totals.subtotalCents)}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{totals.shippingCents === 0 ? "Free" : formatCents(totals.shippingCents)}</dd>
        </div>
        <div>
          <dt>Tax (8%)</dt>
          <dd>{formatCents(totals.taxCents)}</dd>
        </div>
        <div className="summary-total">
          <dt>Total</dt>
          <dd>{formatCents(totals.totalCents)}</dd>
        </div>
      </dl>
      {totals.subtotalCents > 0 && toFreeShipping > 0 && (
        <p className="muted small">Add {formatCents(toFreeShipping)} more for free shipping.</p>
      )}
      {children}
    </section>
  );
}
