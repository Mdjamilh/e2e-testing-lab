import { test, expect, SIGNED_OUT } from "../fixtures";
import { PRICED } from "../data/products";

/**
 * Visual regression for a few stable components, not whole pages. Small
 * targets keep diffs readable and avoid noise from unrelated layout changes.
 *
 * Baselines are committed for Linux only (`*-chromium-linux.png`) and are
 * generated inside the Playwright Docker image, the same one CI uses, so fonts
 * and anti-aliasing match. playwright.config.ts skips @visual on other OSes.
 * Regenerate them with the "Update visual baselines" workflow.
 */
test.describe("visual", { tag: ["@visual", "@regression"] }, () => {
  test.describe("signed out", () => {
    test.use({ storageState: SIGNED_OUT });

    test("login card", async ({ loginPage }) => {
      await loginPage.goto();
      await expect(loginPage.card).toHaveScreenshot("login-card.png");
    });
  });

  test("product card", async ({ productsPage }) => {
    await productsPage.goto();
    const card = productsPage.card(PRICED.oximeter.name);
    await expect(card).toBeVisible();
    await expect(card).toHaveScreenshot("product-card.png");
  });

  test("order summary with shipping hint", async ({ cartWith }) => {
    const cart = await cartWith([PRICED.glovesM.name, PRICED.gauze.name]);
    await expect(cart.summaryValue("Total")).toHaveText("$29.99");
    await expect(cart.summary).toHaveScreenshot("order-summary.png");
  });
});
