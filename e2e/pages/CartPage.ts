import { expect, type Locator, type Page } from "@playwright/test";

export class CartPage {
  readonly heading: Locator;
  readonly table: Locator;
  readonly summary: Locator;
  readonly checkoutLink: Locator;
  readonly emptyMessage: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Your cart" });
    this.table = page.getByRole("table", { name: "Items in your cart" });
    this.summary = page.getByRole("region", { name: "Order summary" });
    this.checkoutLink = page.getByRole("link", { name: "Proceed to checkout" });
    this.emptyMessage = page.getByText("Your cart is empty.");
  }

  async goto() {
    await this.page.goto("/cart");
    await expect(this.heading).toBeVisible();
  }

  row(productName: string): Locator {
    return this.table.getByRole("row").filter({ has: this.page.getByRole("rowheader", { name: productName }) });
  }

  quantity(productName: string): Locator {
    return this.page.getByRole("spinbutton", { name: `Quantity for ${productName}` });
  }

  async setQuantity(productName: string, quantity: number) {
    await this.quantity(productName).fill(String(quantity));
  }

  async remove(productName: string) {
    await this.page.getByRole("button", { name: `Remove ${productName}` }).click();
  }

  /** Reads one value from the order summary, e.g. summaryValue("Total"). */
  summaryValue(term: "Items" | "Subtotal" | "Shipping" | "Tax (8%)" | "Total"): Locator {
    return this.summary.locator("div").filter({ has: this.page.getByText(term, { exact: true }) }).locator("dd");
  }
}
