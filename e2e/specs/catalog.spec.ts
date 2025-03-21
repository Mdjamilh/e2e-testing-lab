import { test, expect } from "../fixtures";
import { CATALOG_CASES } from "../data/products";

test.describe("catalog", () => {
  test("lists the full catalog with prices", { tag: "@smoke" }, async ({ productsPage }) => {
    await productsPage.goto();
    await expect(productsPage.resultCount).toHaveText("11 products");
    await expect(productsPage.card("N95 respirators")).toContainText("$34.99");
  });

  test.describe("search and filter", { tag: "@regression" }, () => {
    for (const row of CATALOG_CASES) {
      test(`${row.title}`, async ({ productsPage }) => {
        await productsPage.goto();
        if (row.category) await productsPage.filterBy(row.category);
        if (row.search) await productsPage.searchFor(row.search);

        if (row.expected.length === 0) {
          await expect(productsPage.emptyMessage).toBeVisible();
          await expect(productsPage.cards).toHaveCount(0);
        } else {
          await productsPage.expectProducts(row.expected);
          await expect(productsPage.resultCount).toHaveText(
            row.expected.length === 1 ? "1 product" : `${row.expected.length} products`,
          );
        }
      });
    }
  });

  test("keeps search and category in the URL so filtered views can be shared", { tag: "@regression" }, async ({ productsPage, page }) => {
    await productsPage.goto();
    await productsPage.filterBy("Diagnostics");
    await productsPage.searchFor("pulse");
    await expect(page).toHaveURL(/category=diagnostics/);
    await expect(page).toHaveURL(/q=pulse/);

    await page.reload();
    await expect(productsPage.search).toHaveValue("pulse");
    await expect(productsPage.category).toHaveValue("diagnostics");
    await productsPage.expectProducts(["Fingertip pulse oximeter"]);
  });

  test("out-of-stock items cannot be added", { tag: "@regression" }, async ({ productsPage }) => {
    await productsPage.goto();
    const card = productsPage.card("Latex-free surgical gloves");
    await expect(card.getByRole("button", { name: /out of stock/ })).toBeDisabled();
  });
});
