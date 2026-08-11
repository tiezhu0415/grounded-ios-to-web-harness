import { useCallback, useEffect, useMemo, useState } from 'react';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import {
  fetchProducts,
  type PaginatedProducts,
  type ProductFilter,
} from './services/productService';
import './App.css';

function useQueryParam(key: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key));
  }, [key]);
  return value;
}

function App() {
  const [filter, setFilter] = useState<ProductFilter>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedProducts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const errorParam = useQueryParam('error');
  const emptyParam = useQueryParam('empty');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchProducts(
        {
          ...filter,
          simulateError: errorParam === '1',
          simulateEmpty: emptyParam === '1',
        },
        page
      );
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filter, page, errorParam, emptyParam]);

  useEffect(() => {
    load();
  }, [load]);

  const products = useMemo(() => data?.products ?? [], [data]);

  const handleCategoryChange = useCallback((category: string | null) => {
    setFilter((f) => ({ ...f, category }));
    setPage(1);
  }, []);

  const handleSubCategoryChange = useCallback((subCategory: string | null) => {
    setFilter((f) => ({ ...f, subCategory }));
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Store</h1>
      </header>

      <CategoryFilter
        activeCategory={filter.category ?? null}
        activeSubCategory={filter.subCategory ?? null}
        onCategoryChange={handleCategoryChange}
        onSubCategoryChange={handleSubCategoryChange}
      />

      <main className="product-list" data-testid="product-list">
        {error ? (
          <div data-testid="error-state" className="state-message error">
            <p>Unable to load products.</p>
            <p className="detail">{error}</p>
            <button onClick={load}>Retry</button>
          </div>
        ) : loading && !data ? (
          <div className="state-message">Loading products...⏳</div>
        ) : products.length === 0 ? (
          <div data-testid="empty-state" className="state-message">
            No products match your filters.
          </div>
        ) : (
          <>
            <div className="results-meta">
              Showing {products.length} of {data?.total ?? 0} products
            </div>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {data?.hasMore && (
              <button
                data-testid="load-more-button"
                className="load-more"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
