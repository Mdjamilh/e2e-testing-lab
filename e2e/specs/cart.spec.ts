import { test, expect } from "../fixtures";
import { PRICED } from "../data/products";

test.describe("cart", () => {
  test("adding products updates the header badge", { tag: "@smoke" }, async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.expectCartCount(0);
    await productsPage.addToCart(PRICED.n95.name);
    await productsPage.addToCart(PRICED.n95.name);
    await productsPage.addToCart(PRICED.gauze.name);
    await productsPage.expectCartCount(3);
    await expect(productsPage.card(PRICED.n95.name)).toContainText("2 in cart");
  });

  test("totals charge shipping under $75 and tax the subtotal", { tag: "@regression" }, async ({ cartWith }) => {
    const cart = await cartWith([PRICED.glovesM.name, PRICED.gauze.name]);
    // 12.99 + 6.49 = 19.48; shipping 8.95; tax 8% of 19.48 = 1.56
    await expect(cart.summaryValue("Subtotal")).toHaveText("$19.48");
    await expect(cart.summaryValue("Shipping")).toHaveText("$8.95");
    await expect(cart.summaryValue("Tax (8%)")).toHaveText("$1.56");
    await expect(cart.summaryValue("Total")).toHaveText("$29.99");
    await expect(cart.summary).toContainText("Add $55.52 more for free shipping.");
  });

  test("raising a quantity past $75 makes shipping free", { tag: "@regression" }, async ({ cartWith }) => {
    const cart = await cartWith([PRICED.oximeter.name]);
    await cart.setQuantity(PRICED.oximeter.name, 3);
    await expect(cart.row(PRICED.oximeter.name)).toContainText("$89.97");
    await expect(cart.summaryValue("Shipping")).toHaveText("Free");
    await expect(cart.summaryValue("Items")).toHaveText("3");
  });

  test("setting a quantity to zero or removing a line drops it", { tag: "@regression" }, async ({ cartWith }) => {
    const cart = await cartWith([PRICED.n95.name, PRICED.gauze.name]);
    await cart.setQuantity(PRICED.n95.name, 0);
    await expect(cart.row(PRICED.n95.name)).toHaveCount(0);
    await cart.remove(PRICED.gauze.name);
    await expect(cart.emptyMessage).toBeVisible();
  });

  test("the cart survives a reload", { tag: "@regression" }, async ({ cartWith, page }) => {
    const cart = await cartWith([PRICED.n95.name]);
    await page.reload();
    await expect(cart.quantity(PRICED.n95.name)).toHaveValue("1");
  });
});
