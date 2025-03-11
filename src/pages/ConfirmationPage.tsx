import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { ApiError, fetchOrder } from "../api/client";
import { formatCents } from "../domain/money";
import type { Order } from "../mocks/api";
import { useAuth } from "../state/auth";

export function ConfirmationPage() {
  const { orderId = "" } = useParams();
  const location = useLocation();
  const { session } = useAuth();
  const passed = (location.state as { order?: Order } | null)?.order;
  const [order, setOrder] = useState<Order | null>(passed?.id === orderId ? passed : null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order || !session) return;
    let cancelled = false;
    fetchOrder(session.token, orderId)
      .then((res) => !cancelled && setOrder(res.order))
      .catch((err: unknown) => !cancelled && setError(err instanceof ApiError ? err.message : "Could not load the order."));
    return () => {
      cancelled = true;
    };
  }, [order, orderId, session]);

  if (error) {
    return (
      <main className="page">
        <h1>Order not found</h1>
        <p role="alert">{error}</p>
        <Link to="/">Back to products</Link>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="page">
        <p role="status">Loading order...</p>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card confirmation" aria-labelledby="confirmation-heading">
        <h1 id="confirmation-heading">Order confirmed</h1>
        <p>
          Thanks, {order.customerName}. Your order number is <strong>{order.id}</strong>. A receipt is on its way to{" "}
          {order.email}.
        </p>
        <ul aria-label="Ordered items">
          {order.lines.map((line) => (
            <li key={line.productId}>
              {line.quantity} x {line.name} - {formatCents(line.priceCents * line.quantity)}
            </li>
          ))}
        </ul>
        <p className="price">Total charged: {formatCents(order.totalCents)}</p>
        <Link to="/" className="button primary">
          Continue shopping
        </Link>
      </section>
    </main>
  );
}
