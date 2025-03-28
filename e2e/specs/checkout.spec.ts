import { test, expect } from "../fixtures";
import { ACCEPTED_VARIANTS, INVALID_CHECKOUT_CASES } from "../data/checkout-cases";
import { PRICED } from "../data/products";
import { VALID_CUSTOMER } from "../support/constants";

test.describe("checkout", () => {
  test.beforeEach(async ({ cartWith, cartPage }) => {
    await cartWith([PRICED.n95.name, PRICED.glovesM.name]);
    await cartPage.checkoutLink.click();
  });

  test("places an order and shows the confirmation", { tag: "@smoke" }, async ({ checkoutPage, confirmationPage, productsPage, page }) => {
    await checkoutPage.fill(VALID_CUSTOMER);
    await checkoutPage.submit();

    await confirmationPage.expectLoaded();
    await expect(confirmationPage.items).toHaveText([
      `1 x ${PRICED.n95.name} - $34.99`,
      `1 x ${PRICED.glovesM.name} - $12.99`,
    ]);
    // 47.98 + 8.95 shipping + 3.84 tax
    await expect(confirmationPage.total).toHaveText("Total charged: $60.77");
    await expect(page.getByText(VALID_CUSTOMER.email)).toBeVisible();
    await productsPage.expectCartCount(0);
  });

  test("an empty submit flags every field and focuses the first one", { tag: "@regression" }, async ({ checkoutPage }) => {
    await checkoutPage.submit();
    await expect(checkoutPage.alert).toHaveText("Please fix 8 fields below.");
    await expect(checkoutPage.field("fullName")).toBeFocused();
    await checkoutPage.expectFieldError("cvc", "Security code must be 3 or 4 digits.");
  });

  test.describe("rejects invalid input", { tag: "@regression" }, () => {
    for (const row of INVALID_CHECKOUT_CASES) {
      test(row.title, async ({ checkoutPage }) => {
        await checkoutPage.fill({ ...VALID_CUSTOMER, ...row.patch });
        await checkoutPage.submit();
        await expect(checkoutPage.alert).toHaveText("Please fix 1 field below.");
        await checkoutPage.expectFieldError(row.field, row.message);
        await expect(checkoutPage.field(row.field)).toBeFocused();
      });
    }
  });

  test.describe("accepts valid variants", { tag: "@regression" }, () => {
    for (const row of ACCEPTED_VARIANTS) {
      test(row.title, async ({ checkoutPage, confirmationPage }) => {
        await checkoutPage.fill({ ...VALID_CUSTOMER, ...row.patch });
        await checkoutPage.submit();
        await confirmationPage.expectLoaded();
      });
    }
  });

  test("the confirmation page reloads from the API", { tag: "@regression" }, async ({ checkoutPage, confirmationPage, page }) => {
    await checkoutPage.fill(VALID_CUSTOMER);
    await checkoutPage.submit();
    await confirmationPage.expectLoaded();
    await page.reload();
    await expect(confirmationPage.heading).toBeVisible();
    await expect(confirmationPage.items).toHaveCount(2);
  });
});
