import { test, expect, SIGNED_OUT } from "../fixtures";
import type AxeBuilder from "@axe-core/playwright";
import { PRICED } from "../data/products";

/** Fails with a readable list of rule ids and the offending selectors. */
async function expectNoViolations(builder: AxeBuilder) {
  const results = await builder.analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
  expect(summary).toEqual([]);
}

test.describe("accessibility (axe, WCAG 2.1 AA)", { tag: "@regression" }, () => {
  test.describe("signed out", () => {
    test.use({ storageState: SIGNED_OUT });

    test("login page", async ({ loginPage, makeAxeBuilder }) => {
      await loginPage.goto();
      await expectNoViolations(makeAxeBuilder());
    });

    test("login page with an error message", async ({ loginPage, makeAxeBuilder }) => {
      await loginPage.goto();
      await loginPage.login("nurse@clinic.test", "wrong");
      await expect(loginPage.error).toBeVisible();
      await expectNoViolations(makeAxeBuilder());
    });
  });

  test("product list", async ({ productsPage, makeAxeBuilder }) => {
    await productsPage.goto();
    await expect(productsPage.cards).toHaveCount(11);
    await expectNoViolations(makeAxeBuilder());
  });

  test("product list error state", async ({ productsPage, page, makeAxeBuilder }) => {
    await page.route("**/api/products*", (route) => route.fulfill({ status: 500, json: { error: "Down" } }));
    await productsPage.goto();
    await expect(productsPage.retryButton).toBeVisible();
    await expectNoViolations(makeAxeBuilder());
  });

  test("cart", async ({ cartWith, makeAxeBuilder }) => {
    await cartWith([PRICED.n95.name, PRICED.gauze.name]);
    await expectNoViolations(makeAxeBuilder());
  });

  test("checkout with validation errors showing", async ({ cartWith, cartPage, checkoutPage, makeAxeBuilder }) => {
    await cartWith([PRICED.n95.name]);
    await cartPage.checkoutLink.click();
    await checkoutPage.submit();
    await expect(checkoutPage.alert).toBeVisible();
    await expectNoViolations(makeAxeBuilder());
  });
});
