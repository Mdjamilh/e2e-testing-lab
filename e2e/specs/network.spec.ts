import { test, expect } from "../fixtures";
import { PRICED } from "../data/products";
import { VALID_CUSTOMER } from "../support/constants";

/**
 * Network mocking and failure injection with page.route. The suite builds the
 * app in "network" API mode, so every /api call is a real HTTP request that
 * page.route can intercept (requests answered by a service worker are not).
 */
test.describe("network failures", { tag: "@regression" }, () => {
  test("a 500 from the products API shows an error with a working retry", async ({ productsPage, page }) => {
    // Fail exactly once, then let requests through to the real mock API.
    await page.route("**/api/products*", (route) => route.fulfill({ status: 500, json: { error: "Inventory service is down." } }), {
      times: 1,
    });

    await productsPage.goto();
    await expect(productsPage.errorAlert).toContainText("Inventory service is down.");
    await expect(productsPage.cards).toHaveCount(0);

    await productsPage.retryButton.click();
    await expect(productsPage.errorAlert).toBeHidden();
    await expect(productsPage.resultCount).toHaveText("11 products");
  });

  test("a 500 with no JSON body still gets a readable message", async ({ productsPage, page }) => {
    await page.route("**/api/products*", (route) => route.fulfill({ status: 500, body: "<html>Bad gateway</html>" }));
    await productsPage.goto();
    await expect(productsPage.errorAlert).toContainText("Request failed with status 500.");
  });

  test("a dropped connection is reported as a connectivity problem", async ({ productsPage, page }) => {
    await page.route("**/api/products*", (route) => route.abort("internetdisconnected"));
    await productsPage.goto();
    await expect(productsPage.errorAlert).toContainText("Could not reach the server.");
  });

  test("a slow API shows a loading state until data arrives", async ({ productsPage, page }) => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/products*", async (route) => {
      await gate;
      await route.continue();
    });

    await productsPage.goto();
    await expect(productsPage.loading).toBeVisible();
    release();
    await expect(productsPage.loading).toBeHidden();
    await expect(productsPage.cards).toHaveCount(11);
  });

  test("a failed order keeps the cart and lets the shopper try again", async ({ cartWith, cartPage, checkoutPage, confirmationPage, page }) => {
    await cartWith([PRICED.n95.name]);
    await cartPage.checkoutLink.click();

    await page.route("**/api/orders", (route) => route.fulfill({ status: 503, json: { error: "Payments are temporarily unavailable." } }), {
      times: 1,
    });
    await checkoutPage.fill(VALID_CUSTOMER);
    await checkoutPage.submit();
    await expect(checkoutPage.alert).toHaveText("Payments are temporarily unavailable.");
    await expect(checkoutPage.placeOrder).toBeEnabled();
    await expect(checkoutPage.summary).toContainText("$34.99");

    await checkoutPage.submit();
    await confirmationPage.expectLoaded();
  });

  test("server-side field errors are shown on the right input", async ({ cartWith, cartPage, checkoutPage, page }) => {
    await cartWith([PRICED.n95.name]);
    await cartPage.checkoutLink.click();
    await page.route("**/api/orders", (route) =>
      route.fulfill({ status: 422, json: { error: "Checkout details are invalid.", fields: { postalCode: "We do not ship to this ZIP code." } } }),
    );
    await checkoutPage.fill(VALID_CUSTOMER);
    await checkoutPage.submit();
    await checkoutPage.expectFieldError("postalCode", "We do not ship to this ZIP code.");
    await expect(checkoutPage.field("postalCode")).toBeFocused();
  });
});

test.describe("response rewriting", { tag: "@regression" }, () => {
  test("renders whatever the API returns: patch a real response with route.fetch", async ({ productsPage, page }) => {
    await page.route("**/api/products*", async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as { products: { name: string; priceCents: number }[] };
      const products = body.products.slice(0, 1).map((p) => ({ ...p, priceCents: 123456 }));
      await route.fulfill({ response, json: { products, total: products.length } });
    });

    await productsPage.goto();
    await expect(productsPage.cards).toHaveCount(1);
    await expect(productsPage.cards.first()).toContainText("$1,234.56");
  });

  test("the order request carries the bearer token and the cart lines", async ({ cartWith, cartPage, checkoutPage, page }) => {
    await cartWith([PRICED.gauze.name, PRICED.gauze.name]);
    await cartPage.checkoutLink.click();
    await checkoutPage.fill(VALID_CUSTOMER);

    const requestPromise = page.waitForRequest((req) => req.url().endsWith("/api/orders") && req.method() === "POST");
    await checkoutPage.submit();
    const request = await requestPromise;

    expect(request.headers()["authorization"]).toMatch(/^Bearer demo\./);
    expect(request.postDataJSON()).toMatchObject({ lines: [{ productId: "wnd-gauze", quantity: 2 }] });
  });
});
