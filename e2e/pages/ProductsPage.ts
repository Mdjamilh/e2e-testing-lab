import { expect, type Locator, type Page } from "@playwright/test";

export class ProductsPage {
  readonly heading: Locator;
  readonly search: Locator;
  readonly category: Locator;
  readonly list: Locator;
  readonly cards: Locator;
  readonly resultCount: Locator;
  readonly loading: Locator;
  readonly errorAlert: Locator;
  readonly retryButton: Locator;
  readonly emptyMessage: Locator;
  readonly cartLink: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole("heading", { name: "Products", level: 1 });
    this.search = page.getByRole("searchbox", { name: "Search products" });
    this.category = page.getByRole("combobox", { name: "Category" });
    this.list = page.getByRole("list", { name: "Products" });
    this.cards = this.list.getByRole("article");
    this.resultCount = page.getByRole("status").filter({ hasText: /\d+ products?$/ });
    this.loading = page.getByRole("status").filter({ hasText: "Loading products" });
    this.errorAlert = page.getByRole("alert");
    this.retryButton = page.getByRole("button", { name: "Try again" });
    this.emptyMessage = page.getByText("No products match your search.");
    this.cartLink = page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /Cart/ });
  }

  async goto(query = "") {
    await this.page.goto(`/${query}`);
    await expect(this.heading).toBeVisible();
  }

  card(name: string): Locator {
    return this.cards.filter({ has: this.page.getByRole("heading", { name, exact: true }) });
  }

  async addToCart(name: string) {
    await this.page.getByRole("button", { name: `Add ${name} to cart` }).click();
  }

  async searchFor(term: string) {
    await this.search.fill(term);
  }

  async filterBy(categoryLabel: string) {
    await this.category.selectOption({ label: categoryLabel });
  }

  async applyFilters({ search, category }: { search?: string; category?: string }) {
    if (category) await this.filterBy(category);
    if (search) await this.searchFor(search);
  }

  /** Web-first: waits until the visible product names equal `names`, in order. */
  async expectProducts(names: string[]) {
    await expect(this.cards.getByRole("heading")).toHaveText(names);
  }

  async expectCartCount(count: number) {
    await expect(this.cartLink).toHaveAccessibleName(`Cart ${count} items`);
  }
}
