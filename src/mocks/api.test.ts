import { describe, expect, it } from "vitest";
import { DEMO_USER, handleApiRequest, issueToken } from "./api";

const BASE = "http://localhost";

async function call(path: string, init?: RequestInit) {
  const response = await handleApiRequest(new Request(`${BASE}${path}`, init));
  if (!response) throw new Error(`No response for ${path}`);
  return { status: response.status, body: await response.json() };
}

const auth = { authorization: `Bearer ${issueToken(DEMO_USER.email)}` };
const customer = {
  fullName: "Riley Chen",
  email: "riley@clinic.test",
  address: "12 Harbor Street",
  city: "Portland",
  postalCode: "97201",
  cardNumber: "4242424242424242",
  expiry: "12/39",
  cvc: "123",
};

describe("mock API", () => {
  it("ignores paths outside /api", async () => {
    expect(await handleApiRequest(new Request(`${BASE}/products`))).toBeUndefined();
  });

  it("logs in the demo user and rejects a wrong password", async () => {
    const ok = await call("/api/login", {
      method: "POST",
      body: JSON.stringify({ email: DEMO_USER.email, password: DEMO_USER.password }),
    });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBe(issueToken(DEMO_USER.email));

    const bad = await call("/api/login", { method: "POST", body: JSON.stringify({ email: DEMO_USER.email, password: "x" }) });
    expect(bad.status).toBe(401);
  });

  it("filters products by query and category", async () => {
    const { body } = await call("/api/products?q=gloves&category=gloves");
    expect(body.total).toBe(3);
    expect((await call("/api/products?category=syringes")).status).toBe(400);
  });

  it("requires a token to place an order", async () => {
    const res = await call("/api/orders", { method: "POST", body: JSON.stringify({ lines: [] }) });
    expect(res.status).toBe(401);
  });

  it("rejects out-of-stock products with 409", async () => {
    const res = await call("/api/orders", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ lines: [{ productId: "glv-latex-free", quantity: 1 }], customer }),
    });
    expect(res.status).toBe(409);
  });

  it("returns field errors with 422 for invalid checkout details", async () => {
    const res = await call("/api/orders", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ lines: [{ productId: "msk-n95", quantity: 1 }], customer: { ...customer, cvc: "1" } }),
    });
    expect(res.status).toBe(422);
    expect(res.body.fields).toEqual({ cvc: "Security code must be 3 or 4 digits." });
  });

  it("prices the order on the server and makes it retrievable", async () => {
    const created = await call("/api/orders", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ lines: [{ productId: "msk-n95", quantity: 3 }], customer }),
    });
    expect(created.status).toBe(201);
    // 3 x 34.99 = 104.97, free shipping, 8% tax = 8.40
    expect(created.body.order.totalCents).toBe(10497 + 840);

    const fetched = await call(`/api/orders/${created.body.order.id}`, { headers: auth });
    expect(fetched.body.order).toEqual(created.body.order);
  });
});
