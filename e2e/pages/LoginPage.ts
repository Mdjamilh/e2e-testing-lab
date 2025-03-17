import { expect, type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly error: Locator;
  readonly demoCredentials: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Sign in to Clinic Supplies" });
    this.email = page.getByLabel("Email");
    this.password = page.getByLabel("Password");
    this.submit = page.getByRole("button", { name: "Sign in" });
    this.error = page.getByRole("alert");
    this.demoCredentials = page.getByRole("complementary", { name: "Demo credentials" });
  }

  async goto() {
    await this.page.goto("/login");
    await expect(this.heading).toBeVisible();
  }

  async login(email: string, password: string) {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }
}
