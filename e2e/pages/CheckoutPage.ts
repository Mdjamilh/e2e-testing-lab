import { expect, type Locator, type Page } from "@playwright/test";

export interface CheckoutDetails {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
}

export const FIELD_LABELS: Record<keyof CheckoutDetails, string> = {
  fullName: "Full name",
  email: "Email",
  address: "Street address",
  city: "City",
  postalCode: "ZIP code",
  cardNumber: "Card number",
  expiry: "Expiry (MM/YY)",
  cvc: "Security code",
};

export class CheckoutPage {
  readonly heading: Locator;
  readonly form: Locator;
  readonly placeOrder: Locator;
  readonly alert: Locator;
  readonly summary: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Checkout" });
    this.form = page.getByRole("form", { name: "Checkout" });
    this.placeOrder = page.getByRole("button", { name: /Place order|Placing order/ });
    this.alert = this.form.getByRole("alert");
    this.summary = page.getByRole("region", { name: "Order summary" });
  }

  async goto() {
    await this.page.goto("/checkout");
    await expect(this.heading).toBeVisible();
  }

  field(name: keyof CheckoutDetails): Locator {
    return this.form.getByRole("textbox", { name: FIELD_LABELS[name], exact: true });
  }

  async fill(details: Partial<CheckoutDetails>) {
    for (const [name, value] of Object.entries(details) as [keyof CheckoutDetails, string][]) {
      await this.field(name).fill(value);
    }
  }

  async submit() {
    await this.placeOrder.click();
  }

  /** Asserts the field is flagged invalid and announces `message` through aria-describedby. */
  async expectFieldError(name: keyof CheckoutDetails, message: string) {
    const field = this.field(name);
    await expect(field).toHaveAttribute("aria-invalid", "true");
    await expect(field).toHaveAccessibleDescription(new RegExp(escapeRegExp(message)));
  }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
