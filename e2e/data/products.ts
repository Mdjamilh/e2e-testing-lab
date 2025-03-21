/**
 * Search and filter cases for the catalog. Each row becomes its own test, so a
 * new case is one line here, not a new test body.
 */
export interface CatalogCase {
  title: string;
  search?: string;
  category?: string;
  expected: string[];
}

export const CATALOG_CASES: CatalogCase[] = [
  { title: "exact word in two names", search: "nitrile", expected: ["Nitrile exam gloves (M)", "Nitrile exam gloves (L)"] },
  { title: "search is case-insensitive", search: "N95", expected: ["N95 respirators"] },
  { title: "partial word", search: "thermo", expected: ["Digital thermometer"] },
  { title: "category only", category: "Wound care", expected: ["Sterile gauze pads", "Elastic bandage roll"] },
  {
    title: "search narrowed by category",
    search: "gloves",
    category: "Gloves",
    expected: ["Nitrile exam gloves (M)", "Nitrile exam gloves (L)", "Latex-free surgical gloves"],
  },
  { title: "search and category that do not overlap", search: "gloves", category: "Masks", expected: [] },
  { title: "no match at all", search: "defibrillator", expected: [] },
];

/** Products with known prices, used to check cart arithmetic end to end. */
export const PRICED = {
  glovesM: { name: "Nitrile exam gloves (M)", priceCents: 1299 },
  n95: { name: "N95 respirators", priceCents: 3499 },
  gauze: { name: "Sterile gauze pads", priceCents: 649 },
  oximeter: { name: "Fingertip pulse oximeter", priceCents: 2999 },
} as const;
