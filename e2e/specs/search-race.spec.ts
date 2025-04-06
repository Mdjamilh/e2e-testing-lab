import { test, expect } from "../fixtures";
import type { Page, Request } from "@playwright/test";

/**
 * The "flaky" search scenario, solved properly. See the README section
 * "A flaky-looking test, fixed properly" for the full story.
 *
 * Typing into the search box does not change the list straight away: input is
 * debounced for 300 ms, then a request goes out, and the response takes as
 * long as the network takes. A test that reads the DOM once at a fixed moment
 * races all three. The anti-patterns look like this (kept out of the suite):
 *
 *   await productsPage.searchFor("n95");
 *   expect(await productsPage.cards.count()).toBe(1);   // reads 11 or 0: too early
 *
 *   await productsPage.searchFor("n95");
 *   await page.waitForTimeout(1000);                    // passes on a laptop,
 *   expect(await productsPage.cards.count()).toBe(1);   // fails on a slow CI box
 *
 * The fixes below never guess at timing. They either wait for the outcome
 * with a retrying web-first assertion, or take control of timing with
 * page.route so the hard case happens on every run instead of 1 in 50.
 */
test.describe("search timing", { tag: "@regression" }, () => {
  test("web-first assertions wait for the debounced result", async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.searchFor("n95");
    // toHaveText/toHaveCount re-query the DOM until they pass or time out.
    await productsPage.expectProducts(["N95 respirators"]);
    await expect(productsPage.resultCount).toHaveText("1 product");
  });

  test("a slow, stale response never overwrites newer results", async ({ productsPage, page }) => {
    let releaseStale!: () => void;
    const staleGate = new Promise<void>((resolve) => (releaseStale = resolve));

    // Hold the response for the first search ("nitrile") until the second
    // search ("n95") has rendered, forcing responses to arrive out of order.
    await page.route("**/api/products?q=nitrile", async (route) => {
      await staleGate;
      await route.continue().catch(() => {
        // The app aborts superseded requests, so the route may already be gone.
      });
    });

    await productsPage.goto();
    const staleRequest = page.waitForRequest((r) => r.url().includes("q=nitrile"));
    await productsPage.searchFor("nitrile");
    const stale = await staleRequest;

    await productsPage.searchFor("n95");
    await productsPage.expectProducts(["N95 respirators"]);

    releaseStale();
    await settled(page, stale);

    // Without request cancellation the gloves would replace the N95 results here.
    await productsPage.expectProducts(["N95 respirators"]);
    await expect(productsPage.search).toHaveValue("n95");
  });

  test("the result count is announced through a live status region", async ({ productsPage }) => {
    await productsPage.goto();
    await productsPage.filterBy("Masks");
    await expect(productsPage.resultCount).toHaveText("2 products");
    await expect(productsPage.resultCount).toHaveRole("status");
  });
});

/**
 * Resolves once the request has finished or failed (an aborted request has no
 * response), then lets the page render whatever that caused. Waiting for two
 * animation frames is a deterministic "after the next paint", not a guess.
 */
async function settled(page: Page, request: Request) {
  const response = await request.response().catch(() => null);
  if (response) await response.finished().catch(() => null);
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  );
}
