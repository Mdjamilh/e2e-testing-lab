import { Link } from "react-router";
import { OrderSummary } from "../components/OrderSummary";
import { MAX_QUANTITY } from "../domain/cart";
import { formatCents } from "../domain/money";
import { useCart } from "../state/cart";

export function CartPage() {
  const { lines, totals, update, remove } = useCart();

  if (lines.length === 0) {
    return (
      <main className="page">
        <h1>Your cart</h1>
        <p>Your cart is empty.</p>
        <Link to="/" className="button primary">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="page">
      <h1>Your cart</h1>
      <div className="two-column">
        <table className="card cart-table">
          <caption className="visually-hidden">Items in your cart</caption>
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Price</th>
              <th scope="col">Quantity</th>
              <th scope="col">Line total</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map(({ product, quantity }) => (
              <tr key={product.id}>
                <th scope="row">{product.name}</th>
                <td>{formatCents(product.priceCents)}</td>
                <td>
                  <label className="visually-hidden" htmlFor={`qty-${product.id}`}>
                    Quantity for {product.name}
                  </label>
                  <input
                    id={`qty-${product.id}`}
                    className="qty-input"
                    type="number"
                    min={0}
                    max={MAX_QUANTITY}
                    value={quantity}
                    onChange={(e) => {
                      // An empty box mid-edit is not a request to delete the line.
                      if (!Number.isNaN(e.target.valueAsNumber)) update(product.id, e.target.valueAsNumber);
                    }}
                  />
                </td>
                <td>{formatCents(product.priceCents * quantity)}</td>
                <td>
                  <button type="button" className="button link" onClick={() => remove(product.id)}>
                    Remove<span className="visually-hidden"> {product.name}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <OrderSummary totals={totals}>
          <Link to="/checkout" className="button primary block">
            Proceed to checkout
          </Link>
        </OrderSummary>
      </div>
    </main>
  );
}
