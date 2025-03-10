import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { ApiError, fetchProducts } from "../api/client";
import { ProductCard } from "../components/ProductCard";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { CATEGORIES, CATEGORY_LABELS, isCategory, type Product } from "../domain/products";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; products: Product[] };

export const SEARCH_DEBOUNCE_MS = 300;

export function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const rawCategory = params.get("category") ?? "";
  const category = isCategory(rawCategory) ? rawCategory : undefined;
  const query = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  // Keep the URL in sync so filtered views can be shared and deep-linked.
  useEffect(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (query) next.set("q", query);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [query, setParams]);

  useEffect(() => {
    // Aborting the previous request means a slow, stale response can never
    // overwrite the results for what the user typed most recently.
    const controller = new AbortController();
    setState({ status: "loading" });
    fetchProducts({ q: query || undefined, category }, controller.signal)
      .then(({ products }) => setState({ status: "ready", products }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: "error", message: err instanceof ApiError ? err.message : "Could not load products." });
      });
    return () => controller.abort();
  }, [query, category, attempt]);

  function onCategoryChange(value: string) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set("category", value);
        else next.delete("category");
        return next;
      },
      { replace: true },
    );
  }

  return (
    <main className="page">
      <h1>Products</h1>
      <div className="toolbar" role="search">
        <div className="field">
          <label htmlFor="product-search">Search products</label>
          <input
            id="product-search"
            type="search"
            placeholder="e.g. gloves"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="product-category">Category</label>
          <select id="product-category" value={category ?? ""} onChange={(e) => onCategoryChange(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.status === "loading" && (
        <p role="status" className="muted">
          Loading products...
        </p>
      )}

      {state.status === "error" && (
        <div role="alert" className="card error-panel">
          <p>{state.message}</p>
          <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}

      {state.status === "ready" && (
        <>
          <p role="status" className="muted">
            {state.products.length === 1 ? "1 product" : `${state.products.length} products`}
          </p>
          {state.products.length === 0 ? (
            <p>No products match your search.</p>
          ) : (
            <ul className="product-grid" aria-label="Products">
              {state.products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}
