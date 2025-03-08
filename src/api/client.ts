import type { Category, Product } from "../domain/products";
import type { CheckoutErrors, CheckoutForm } from "../domain/checkout";
import type { Order, OrderLineInput } from "../mocks/api";

export class ApiError extends Error {
  readonly status: number;
  readonly fields?: CheckoutErrors;

  constructor(status: number, message: string, fields?: CheckoutErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

export interface SessionUser {
  email: string;
  name: string;
}

async function request<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
  }

  const body: unknown = await response.json().catch(() => undefined);
  if (!response.ok) {
    const record = (typeof body === "object" && body !== null ? body : {}) as {
      error?: string;
      fields?: CheckoutErrors;
    };
    throw new ApiError(response.status, record.error ?? `Request failed with status ${response.status}.`, record.fields);
  }
  return body as T;
}

export function login(email: string, password: string) {
  return request<{ token: string; user: SessionUser }>("/api/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchProducts(params: { q?: string; category?: Category }, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  const qs = search.toString();
  return request<{ products: Product[]; total: number }>(`/api/products${qs ? `?${qs}` : ""}`, { signal });
}

export function placeOrder(token: string, lines: OrderLineInput[], customer: CheckoutForm) {
  return request<{ order: Order }>("/api/orders", {
    method: "POST",
    token,
    body: JSON.stringify({ lines, customer }),
  });
}

export function fetchOrder(token: string, id: string) {
  return request<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}`, { token });
}
