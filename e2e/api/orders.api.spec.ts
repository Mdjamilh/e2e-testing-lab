import { test, expect, type APIRequestContext } from "@playwright/test";
import { DEMO_USER, VALID_CUSTOMER } from "../support/constants";

/**
 * API-level tests with Playwright's `request` fixture: no browser, just HTTP
 * against the mock API that the Vite preview server exposes. They are fast and
 * pin down the contract the UI relies on.
 *
 * The deployed site is static (the API lives in a service worker), so there is
 * no HTTP API to call when BASE_URL points at it.
 */
// eslint-disable-next-line playwright/no-skipped-test -- deliberate: nothing to test on a static host
test.skip(!!process.env.BASE_URL, "The static deployment has no HTTP API; MSW serves it in the browser.");

async function token(request: APIRequestContext): Promise<string> {
  const res = await request.post("/api/login", { data: { email: DEMO_USER.email, password: DEMO_USER.password } });
  expect(res.ok()).toBe(true);
  return ((await res.json()) as { token: string }).token;
}

test.describe("orders API", { tag: "@regression" }, () => {
  test("health check responds", { tag: "@smoke" }, async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  test("login rejects bad credentials with 401", async ({ request }) => {
    const res = await request.post("/api/login", { data: { email: DEMO_USER.email, password: "nope" } });
    expect(res.status()).toBe(401);
    expect(await res.json()).toEqual({ error: "Email or password is incorrect." });
  });

  test("products can be filtered by query string", async ({ request }) => {
    const res = await request.get("/api/products", { params: { q: "gauze" } });
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.products[0]).toMatchObject({ id: "wnd-gauze", priceCents: 649, inStock: true });
  });

  test("an unknown category is a 400, not an empty list", async ({ request }) => {
    const res = await request.get("/api/products", { params: { category: "syringes" } });
    expect(res.status()).toBe(400);
  });

  test("orders need a bearer token", async ({ request }) => {
    const res = await request.post("/api/orders", { data: { lines: [{ productId: "msk-n95", quantity: 1 }], customer: VALID_CUSTOMER } });
    expect(res.status()).toBe(401);
  });

  test("creates an order priced by the server, then reads it back", async ({ request }) => {
    const auth = { authorization: `Bearer ${await token(request)}` };
    const created = await request.post("/api/orders", {
      headers: auth,
      data: { lines: [{ productId: "dx-thermometer", quantity: 2 }], customer: VALID_CUSTOMER },
    });
    expect(created.status()).toBe(201);
    const { order } = await created.json();
    // 2 x 19.99 = 39.98 + 8.95 shipping + 3.20 tax
    expect(order).toMatchObject({ customerName: "Riley Chen", totalCents: 5213 });
    expect(order.id).toMatch(/^ORD-\d+$/);

    const fetched = await request.get(`/api/orders/${order.id}`, { headers: auth });
    expect(await fetched.json()).toEqual({ order });
  });

  test("invalid checkout details come back as 422 with field errors", async ({ request }) => {
    const res = await request.post("/api/orders", {
      headers: { authorization: `Bearer ${await token(request)}` },
      data: { lines: [{ productId: "msk-n95", quantity: 1 }], customer: { ...VALID_CUSTOMER, postalCode: "abc" } },
    });
    expect(res.status()).toBe(422);
    expect((await res.json()).fields).toEqual({ postalCode: "Enter a 5-digit ZIP code." });
  });

  test("out-of-stock products are refused with 409", async ({ request }) => {
    const res = await request.post("/api/orders", {
      headers: { authorization: `Bearer ${await token(request)}` },
      data: { lines: [{ productId: "glv-latex-free", quantity: 1 }], customer: VALID_CUSTOMER },
    });
    expect(res.status()).toBe(409);
  });
});
