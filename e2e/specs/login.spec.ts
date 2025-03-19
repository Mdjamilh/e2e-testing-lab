import { test, expect, SIGNED_OUT } from "../fixtures";
import { DEMO_USER } from "../support/constants";

test.use({ storageState: SIGNED_OUT });

test.describe("login", () => {
  test("signs in with the demo credentials shown on the page", { tag: "@smoke" }, async ({ loginPage, page }) => {
    await loginPage.goto();
    await expect(loginPage.demoCredentials).toContainText(DEMO_USER.email);
    await loginPage.login(DEMO_USER.email, DEMO_USER.password);
    await expect(page.getByRole("heading", { name: "Products", level: 1 })).toBeVisible();
    await expect(page.getByRole("banner")).toContainText(DEMO_USER.name);
  });

  test("rejects a wrong password", { tag: "@regression" }, async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_USER.email, "not-the-password");
    await expect(loginPage.error).toHaveText("Email or password is incorrect.");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("asks for both fields before calling the API", { tag: "@regression" }, async ({ loginPage, page }) => {
    let calls = 0;
    page.on("request", (req) => {
      if (req.url().endsWith("/api/login")) calls++;
    });
    await loginPage.goto();
    await loginPage.submit.click();
    await expect(loginPage.error).toHaveText("Enter your email and password.");
    expect(calls).toBe(0);
  });

  test("sends a signed-out visitor to login, then back to the page they wanted", { tag: "@regression" }, async ({ loginPage, page }) => {
    await page.goto("/cart");
    await expect(loginPage.heading).toBeVisible();
    await loginPage.login(DEMO_USER.email, DEMO_USER.password);
    await expect(page).toHaveURL(/\/cart$/);
  });

  test("signing out clears the session", { tag: "@regression" }, async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(DEMO_USER.email, DEMO_USER.password);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(loginPage.heading).toBeVisible();
    await page.reload();
    await expect(loginPage.heading).toBeVisible();
  });
});
