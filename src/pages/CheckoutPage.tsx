import { useRef, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { ApiError, placeOrder } from "../api/client";
import { OrderSummary } from "../components/OrderSummary";
import {
  EMPTY_CHECKOUT,
  hasErrors,
  validateCheckout,
  type CheckoutErrors,
  type CheckoutField,
  type CheckoutForm,
} from "../domain/checkout";
import { useAuth } from "../state/auth";
import { useCart } from "../state/cart";

interface FieldSpec {
  name: CheckoutField;
  label: string;
  autoComplete: string;
  inputMode?: "numeric" | "email";
  hint?: string;
}

const CONTACT_FIELDS: FieldSpec[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  { name: "email", label: "Email", autoComplete: "email", inputMode: "email" },
  { name: "address", label: "Street address", autoComplete: "street-address" },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "postalCode", label: "ZIP code", autoComplete: "postal-code", inputMode: "numeric" },
];

const PAYMENT_FIELDS: FieldSpec[] = [
  { name: "cardNumber", label: "Card number", autoComplete: "cc-number", inputMode: "numeric", hint: "Test card: 4242 4242 4242 4242" },
  { name: "expiry", label: "Expiry (MM/YY)", autoComplete: "cc-exp" },
  { name: "cvc", label: "Security code", autoComplete: "cc-csc", inputMode: "numeric" },
];

const FIELD_ORDER = [...CONTACT_FIELDS, ...PAYMENT_FIELDS].map((f) => f.name);

export function CheckoutPage() {
  const { session } = useAuth();
  const { lines, totals, clear } = useCart();
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<CheckoutForm>(EMPTY_CHECKOUT);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (lines.length === 0) return <Navigate to="/cart" replace />;

  function focusFirstError(found: CheckoutErrors) {
    const first = FIELD_ORDER.find((name) => found[name]);
    if (first) formRef.current?.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    const found = validateCheckout(form);
    setErrors(found);
    if (hasErrors(found)) {
      focusFirstError(found);
      return;
    }
    if (!session) return;

    setSubmitting(true);
    try {
      const { order } = await placeOrder(
        session.token,
        lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        form,
      );
      clear();
      navigate(`/orders/${order.id}`, { state: { order } });
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields);
        focusFirstError(err.fields);
      }
      setSubmitError(err instanceof ApiError ? err.message : "Could not place the order. Please try again.");
      setSubmitting(false);
    }
  }

  function renderField(spec: FieldSpec) {
    const error = errors[spec.name];
    const id = `checkout-${spec.name}`;
    const describedBy = [spec.hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
    return (
      <div className="field" key={spec.name}>
        <label htmlFor={id}>{spec.label}</label>
        <input
          id={id}
          name={spec.name}
          autoComplete={spec.autoComplete}
          inputMode={spec.inputMode}
          value={form[spec.name]}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          onChange={(e) => setForm((prev) => ({ ...prev, [spec.name]: e.target.value }))}
        />
        {spec.hint && (
          <p id={`${id}-hint`} className="muted small">
            {spec.hint}
          </p>
        )}
        {error && (
          <p id={`${id}-error`} className="error-text">
            {error}
          </p>
        )}
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <main className="page">
      <h1>Checkout</h1>
      <div className="two-column">
        <form ref={formRef} className="card checkout-form" onSubmit={onSubmit} noValidate aria-label="Checkout">
          {(errorCount > 0 || submitError) && (
            <div role="alert" className="error-panel">
              {submitError ?? `Please fix ${errorCount === 1 ? "1 field" : `${errorCount} fields`} below.`}
            </div>
          )}
          <fieldset>
            <legend>Shipping details</legend>
            {CONTACT_FIELDS.map(renderField)}
          </fieldset>
          <fieldset>
            <legend>Payment</legend>
            {PAYMENT_FIELDS.map(renderField)}
          </fieldset>
          <button type="submit" className="button primary block" disabled={submitting}>
            {submitting ? "Placing order..." : "Place order"}
          </button>
        </form>
        <OrderSummary totals={totals} />
      </div>
    </main>
  );
}
