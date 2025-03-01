import { describe, expect, it } from "vitest";
import { CATALOG, filterProducts, isCategory } from "./products";
import { formatCents } from "./money";

describe("filterProducts", () => {
  it("returns everything for an empty query", () => {
    expect(filterProducts(CATALOG, {})).toHaveLength(CATALOG.length);
  });

  it("matches names case-insensitively and ignores padding", () => {
    expect(filterProducts(CATALOG, { q: "  NITRILE " }).map((p) => p.id)).toEqual(["glv-nitrile-m", "glv-nitrile-l"]);
  });

  it("combines search with a category", () => {
    expect(filterProducts(CATALOG, { q: "gloves", category: "masks" })).toEqual([]);
    expect(filterProducts(CATALOG, { category: "masks" })).toHaveLength(2);
  });
});

describe("isCategory", () => {
  it("narrows known categories only", () => {
    expect(isCategory("wound-care")).toBe(true);
    expect(isCategory("syringes")).toBe(false);
  });
});

describe("formatCents", () => {
  it("formats cents as US dollars", () => {
    expect(formatCents(1299)).toBe("$12.99");
    expect(formatCents(0)).toBe("$0.00");
  });
});
