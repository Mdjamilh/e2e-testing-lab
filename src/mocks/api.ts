/**
 * The mock clinic-supplies API, written against the Fetch API's Request and
 * Response so the same code runs in two places:
 *
 * - in the browser, behind Mock Service Worker (the deployed static site), and
 * - in Node, as Vite dev/preview middleware (what Playwright tests talk to).
 */
import { CATALOG, filterProducts, isCategory } from "../domain/products";
import { cartTotals, type CartLine } from "../domain/cart";
import { hasErrors, validateCheckout, type CheckoutForm } from "../domain/checkout";

export const DEMO_USER = { email: "nurse@clinic.test", password: "supplies123", name: "Riley Chen" } as const;

export interface OrderLineInput {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  lines: { productId: string; name: string; quantity: number; priceCents: number }[];
  totalCents: number;
}

const orders = new Map<string, Order>();
let orderSequence = 1000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function error(status: number, message: string): Response {
  return json({ error: message }, status);
}

/** Tokens are stateless so a page reload (or a fresh MSW instance) keeps the session. */
export function issueToken(email: string): string {
  return `demo.${btoa(email)}`;
}

function userFromRequest(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "");
  if (!token.startsWith("demo.")) return null;
  try {
    const email = atob(token.slice(5));
    return email === DEMO_USER.email ? email : null;
  } catch {
    return null;
  }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function login(request: Request): Promise<Response> {
  const body = await readJson(request);
  if (!isRecord(body)) return error(400, "Expected a JSON body.");
  const { email, password } = body;
  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return error(401, "Email or password is incorrect.");
  }
  return json({ token: issueToken(DEMO_USER.email), user: { email: DEMO_USER.email, name: DEMO_USER.name } });
}

function listProducts(url: URL): Response {
  const q = url.searchParams.get("q") ?? undefined;
  const rawCategory = url.searchParams.get("category");
  if (rawCategory && !isCategory(rawCategory)) return error(400, `Unknown category "${rawCategory}".`);
  const category = rawCategory && isCategory(rawCategory) ? rawCategory : undefined;
  const products = filterProducts(CATALOG, { q, category });
  return json({ products, total: products.length });
}

function parseLines(value: unknown): OrderLineInput[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const lines: OrderLineInput[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.productId !== "string") return null;
    const quantity = item.quantity;
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) return null;
    lines.push({ productId: item.productId, quantity });
  }
  return lines;
}

async function createOrder(request: Request): Promise<Response> {
  const email = userFromRequest(request);
  if (!email) return error(401, "Sign in to place an order.");

  const body = await readJson(request);
  if (!isRecord(body)) return error(400, "Expected a JSON body.");
  const lines = parseLines(body.lines);
  if (!lines) return error(400, "An order needs at least one line with a positive quantity.");

  const cartLines: CartLine[] = [];
  for (const line of lines) {
    const product = CATALOG.find((p) => p.id === line.productId);
    if (!product) return error(400, `Unknown product "${line.productId}".`);
    if (!product.inStock) return error(409, `${product.name} is out of stock.`);
    cartLines.push({ product, quantity: line.quantity });
  }

  const form = (isRecord(body.customer) ? body.customer : {}) as Partial<CheckoutForm>;
  const filled: CheckoutForm = {
    fullName: String(form.fullName ?? ""),
    email: String(form.email ?? ""),
    address: String(form.address ?? ""),
    city: String(form.city ?? ""),
    postalCode: String(form.postalCode ?? ""),
    cardNumber: String(form.cardNumber ?? ""),
    expiry: String(form.expiry ?? ""),
    cvc: String(form.cvc ?? ""),
  };
  const errors = validateCheckout(filled);
  if (hasErrors(errors)) return json({ error: "Checkout details are invalid.", fields: errors }, 422);

  const order: Order = {
    id: `ORD-${++orderSequence}`,
    createdAt: new Date().toISOString(),
    customerName: filled.fullName.trim(),
    email: filled.email.trim(),
    lines: cartLines.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      quantity: l.quantity,
      priceCents: l.product.priceCents,
    })),
    totalCents: cartTotals(cartLines).totalCents,
  };
  orders.set(order.id, order);
  return json({ order }, 201);
}

function getOrder(request: Request, id: string): Response {
  if (!userFromRequest(request)) return error(401, "Sign in to view orders.");
  const order = orders.get(id);
  return order ? json({ order }) : error(404, `Order ${id} was not found.`);
}

/**
 * Handles any /api/* request. Returns undefined for paths outside /api so the
 * caller can fall through to its normal behaviour.
 */
export async function handleApiRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) return undefined;
  const route = `${request.method} ${url.pathname}`;

  if (route === "GET /api/health") return json({ status: "ok" });
  if (route === "POST /api/login") return login(request);
  if (route === "GET /api/products") return listProducts(url);
  if (route === "POST /api/orders") return createOrder(request);
  const orderMatch = /^GET \/api\/orders\/([\w-]+)$/.exec(route);
  if (orderMatch) return getOrder(request, orderMatch[1]);

  return error(404, `No route for ${route}.`);
}
