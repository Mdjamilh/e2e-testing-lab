export type Category = "gloves" | "masks" | "wound-care" | "diagnostics" | "sanitizing";

export interface Product {
  id: string;
  name: string;
  category: Category;
  /** Price in cents, so totals never suffer from floating point drift. */
  priceCents: number;
  unit: string;
  inStock: boolean;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  gloves: "Gloves",
  masks: "Masks",
  "wound-care": "Wound care",
  diagnostics: "Diagnostics",
  sanitizing: "Sanitizing",
};

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export function isCategory(value: string): value is Category {
  return (CATEGORIES as string[]).includes(value);
}

/** The fixed catalog served by the mock API. */
export const CATALOG: readonly Product[] = [
  { id: "glv-nitrile-m", name: "Nitrile exam gloves (M)", category: "gloves", priceCents: 1299, unit: "box of 100", inStock: true },
  { id: "glv-nitrile-l", name: "Nitrile exam gloves (L)", category: "gloves", priceCents: 1299, unit: "box of 100", inStock: true },
  { id: "glv-latex-free", name: "Latex-free surgical gloves", category: "gloves", priceCents: 2450, unit: "box of 50 pairs", inStock: false },
  { id: "msk-surgical", name: "Surgical face masks", category: "masks", priceCents: 899, unit: "box of 50", inStock: true },
  { id: "msk-n95", name: "N95 respirators", category: "masks", priceCents: 3499, unit: "box of 20", inStock: true },
  { id: "wnd-gauze", name: "Sterile gauze pads", category: "wound-care", priceCents: 649, unit: "pack of 25", inStock: true },
  { id: "wnd-bandage", name: "Elastic bandage roll", category: "wound-care", priceCents: 399, unit: "single roll", inStock: true },
  { id: "dx-thermometer", name: "Digital thermometer", category: "diagnostics", priceCents: 1999, unit: "each", inStock: true },
  { id: "dx-oximeter", name: "Fingertip pulse oximeter", category: "diagnostics", priceCents: 2999, unit: "each", inStock: true },
  { id: "san-hand-gel", name: "Hand sanitizer gel", category: "sanitizing", priceCents: 549, unit: "500 ml bottle", inStock: true },
  { id: "san-wipes", name: "Disinfectant surface wipes", category: "sanitizing", priceCents: 799, unit: "tub of 160", inStock: true },
];

export interface ProductQuery {
  q?: string;
  category?: Category;
}

/** Case-insensitive name search combined with an optional category filter. */
export function filterProducts(products: readonly Product[], query: ProductQuery): Product[] {
  const needle = query.q?.trim().toLowerCase() ?? "";
  return products.filter(
    (p) =>
      (!query.category || p.category === query.category) &&
      (needle === "" || p.name.toLowerCase().includes(needle)),
  );
}
