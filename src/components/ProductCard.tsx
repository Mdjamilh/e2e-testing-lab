import { useState } from "react";
import { CATEGORY_LABELS, type Product } from "../domain/products";
import { formatCents } from "../domain/money";
import { useCart } from "../state/cart";

export function ProductCard({ product }: { product: Product }) {
  const { add, lines } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = lines.find((l) => l.product.id === product.id)?.quantity ?? 0;
  const headingId = `product-${product.id}`;

  return (
    <article className="card product-card" aria-labelledby={headingId}>
      <p className="eyebrow">{CATEGORY_LABELS[product.category]}</p>
      <h2 id={headingId}>{product.name}</h2>
      <p className="muted">{product.unit}</p>
      <p className="price">{formatCents(product.priceCents)}</p>
      {product.inStock ? (
        <button
          type="button"
          className="button primary"
          aria-label={`Add ${product.name} to cart`}
          onClick={() => {
            add(product);
            setJustAdded(true);
          }}
        >
          Add to cart
        </button>
      ) : (
        <button type="button" className="button" disabled aria-label={`${product.name} is out of stock`}>
          Out of stock
        </button>
      )}
      <p className="muted small" aria-live="polite">
        {justAdded && inCart > 0 ? `${inCart} in cart` : ""}
      </p>
    </article>
  );
}
