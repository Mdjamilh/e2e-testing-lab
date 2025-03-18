import { test as setup, expect } from "@playwright/test";
import { AUTH_FILE, DEMO_USER } from "./support/constants";
import { LoginPage } from "./pages/LoginPage";

// Runs once before the browser projects. Logging in through the real form
// (not by writing localStorage directly) means the setup itself doubles as a
// check that login works.
setup.use({ storageState: { cookies: [], origins: [] } });

setup("sign in and save storage state", async ({ page }) => {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(DEMO_USER.email, DEMO_USER.password);
  await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
  await page.context().storageState({ path: AUTH_FILE });
});
