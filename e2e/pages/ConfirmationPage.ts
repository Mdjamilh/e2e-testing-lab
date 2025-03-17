import { expect, type Locator, type Page } from "@playwright/test";

export class ConfirmationPage {
  readonly heading: Locator;
  readonly items: Locator;
  readonly total: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Order confirmed" });
    this.items = page.getByRole("list", { name: "Ordered items" }).getByRole("listitem");
    this.total = page.getByText(/^Total charged:/);
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.page).toHaveURL(/\/orders\/ORD-\d+$/);
  }

  orderId(): string {
    return new URL(this.page.url()).pathname.split("/").pop() ?? "";
  }
}
