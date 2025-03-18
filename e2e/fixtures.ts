import { test as base, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { AUTH_FILE } from "./support/constants";
import { LoginPage } from "./pages/LoginPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";

/** Pass to `test.use({ storageState: SIGNED_OUT })` for tests that need no session. */
export const SIGNED_OUT = { cookies: [], origins: [] };

interface Fixtures {
  /** A page whose browser context was created from the saved, signed-in storageState. */
  loggedInPage: Page;
  loginPage: LoginPage;
  productsPage: ProductsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  confirmationPage: ConfirmationPage;
  /** Adds the given products to the cart through the UI and opens the cart. */
  cartWith: (names: string[]) => Promise<CartPage>;
  /** Axe configured for WCAG 2.1 A and AA rules. */
  makeAxeBuilder: () => AxeBuilder;
}

export const test = base.extend<Fixtures>({
  // Override Playwright's built-in `storageState` option: every context this
  // test file creates starts signed in, using the state saved by auth.setup.ts.
  // Overriding the option (rather than calling browser.newContext ourselves)
  // keeps device emulation, tracing and the serviceWorkers setting intact.
  storageState: async ({ storageState }, use) => {
    await use(storageState ?? AUTH_FILE);
  },

  loggedInPage: async ({ page }, use) => {
    await use(page);
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  productsPage: async ({ loggedInPage }, use) => use(new ProductsPage(loggedInPage)),
  cartPage: async ({ loggedInPage }, use) => use(new CartPage(loggedInPage)),
  checkoutPage: async ({ loggedInPage }, use) => use(new CheckoutPage(loggedInPage)),
  confirmationPage: async ({ loggedInPage }, use) => use(new ConfirmationPage(loggedInPage)),

  cartWith: async ({ productsPage, cartPage }, use) => {
    await use(async (names) => {
      await productsPage.goto();
      for (const name of names) await productsPage.addToCart(name);
      await productsPage.expectCartCount(names.length);
      await cartPage.goto();
      return cartPage;
    });
  },

  makeAxeBuilder: async ({ page }, use) => {
    await use(() => new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]));
  },
});

export { expect };
