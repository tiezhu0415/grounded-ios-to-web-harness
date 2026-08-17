import { useCallback, useEffect, useMemo, useState } from 'react';
import { CartView } from './components/CartView';
import { FavoritesView } from './components/FavoritesView';
import { ProductCard } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { ProfilePage } from './components/profile/ProfilePage';
import { StoreLanding, StoreSubcategories } from './components/StoreNavigation';
import { TabBar } from './components/TabBar';
import {
  fetchProducts,
  getProductById,
  type PaginatedProducts,
  type ProductFilter,
} from './services/productService';
import './App.css';

type View = 'store' | 'favorites' | 'cart' | 'profile' | 'detail';
type StoreScreen = 'landing' | 'subcategories' | 'products';

interface RouteState {
  view: View;
  productId: string | null;
  storeScreen: StoreScreen;
  category: string | null;
  subCategory: string | null;
}

function readRoute(): RouteState {
  const productMatch = window.location.pathname.match(/^\/products\/([^/]+)\/?$/);
  if (productMatch) {
    return { view: 'detail', productId: decodeURIComponent(productMatch[1]), storeScreen: 'products', category: null, subCategory: null };
  }
  if (window.location.pathname === '/favorites') {
    return { view: 'favorites', productId: null, storeScreen: 'landing', category: null, subCategory: null };
  }
  if (window.location.pathname === '/cart') {
    return { view: 'cart', productId: null, storeScreen: 'landing', category: null, subCategory: null };
  }
  if (window.location.pathname === '/profile') {
    return { view: 'profile', productId: null, storeScreen: 'landing', category: null, subCategory: null };
  }
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const subCategory = params.get('subCategory');
  const categoryMatch = window.location.pathname.match(/^\/store\/categories\/([^/]+)\/?$/);
  if (categoryMatch) {
    return { view: 'store', productId: null, storeScreen: 'subcategories', category: decodeURIComponent(categoryMatch[1]), subCategory: null };
  }
  if (window.location.pathname === '/store/products') {
    return { view: 'store', productId: null, storeScreen: 'products', category, subCategory };
  }
  return { view: 'store', productId: null, storeScreen: 'landing', category: null, subCategory: null };
}

function routePath(view: View, productId: string | null): string {
  if (view === 'detail' && productId) {
    return `/products/${encodeURIComponent(productId)}`;
  }
  if (view === 'favorites') {
    return '/favorites';
  }
  if (view === 'cart') {
    return '/cart';
  }
  if (view === 'profile') {
    return '/profile';
  }
  return '/store';
}

function useQueryParam(key: string): string | null {
  const [value, setValue] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setValue(params.get(key));
  }, [key]);
  return value;
}

function App() {
  const initialRoute = useMemo(readRoute, []);
  const [filter, setFilter] = useState<ProductFilter>({ category: initialRoute.category, subCategory: initialRoute.subCategory });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedProducts | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>(initialRoute.view);
  const [storeScreen, setStoreScreen] = useState<StoreScreen>(initialRoute.storeScreen);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    initialRoute.productId
  );
  const [previousView, setPreviousView] = useState<'store' | 'favorites' | 'cart' | 'profile'>('store');
  const [previousStorePath, setPreviousStorePath] = useState('/store/products');

  const errorParam = useQueryParam('error');
  const emptyParam = useQueryParam('empty');
  const productParam = useQueryParam('product');

  useEffect(() => {
    if (productParam) {
      window.history.replaceState(null, '', `/products/${encodeURIComponent(productParam)}`);
      setSelectedProductId(productParam);
      setView('detail');
    }
  }, [productParam]);

  useEffect(() => {
    if (window.location.pathname === '/') {
      window.history.replaceState(null, '', '/store');
    }

    const handlePopState = () => {
      const route = readRoute();
      setView(route.view);
      setSelectedProductId(route.productId);
      setStoreScreen(route.storeScreen);
      setFilter({ category: route.category, subCategory: route.subCategory });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  const showStoreLanding = useCallback(() => {
    window.history.pushState(null, '', '/store');
    setStoreScreen('landing');
    setFilter({});
    setPage(1);
  }, []);

  const handleCategoryChange = useCallback((category: string | null) => {
    if (category) {
      window.history.pushState(null, '', `/store/categories/${encodeURIComponent(category)}`);
      setStoreScreen('subcategories');
      setFilter({ category, subCategory: null });
    } else {
      window.history.pushState(null, '', '/store/products');
      setStoreScreen('products');
      setFilter({});
    }
    setPage(1);
  }, []);

  const handleSubCategoryChange = useCallback((subCategory: string | null) => {
    const params = new URLSearchParams();
    if (filter.category) params.set('category', filter.category);
    if (subCategory) params.set('subCategory', subCategory);
    const query = params.toString();
    window.history.pushState(null, '', `/store/products${query ? `?${query}` : ''}`);
    setStoreScreen('products');
    setFilter((current) => ({ ...current, subCategory }));
    setPage(1);
  }, [filter.category]);

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const handleSelectProduct = useCallback((productId: string) => {
    setPreviousView(view === 'detail' ? previousView : view);
    if (view === 'store') setPreviousStorePath(`${window.location.pathname}${window.location.search}`);
    window.history.pushState(null, '', routePath('detail', productId));
    setSelectedProductId(productId);
    setView('detail');
  }, [view, previousView]);

  const handleBack = useCallback(() => {
    const destination = previousView === 'store' ? previousStorePath : routePath(previousView, null);
    window.history.pushState(null, '', destination);
    setView(previousView);
    setSelectedProductId(null);
    if (previousView === 'store') {
      const route = readRoute();
      setStoreScreen(route.storeScreen);
      setFilter({ category: route.category, subCategory: route.subCategory });
    }
  }, [previousView, previousStorePath]);

  const handleTabChange = useCallback((tab: 'store' | 'favorites' | 'cart' | 'profile') => {
    window.history.pushState(null, '', routePath(tab, null));
    setView(tab);
    setSelectedProductId(null);
    if (tab === 'store') {
      setStoreScreen('landing');
      setFilter({});
    }
  }, []);

  const selectedProduct = useMemo(
    () => (selectedProductId ? getProductById(selectedProductId) : undefined),
    [selectedProductId]
  );

  const renderProducts = () => (
    <>
      <header className="products-header">
        <button type="button" className="store-back-button" onClick={filter.category ? () => handleCategoryChange(filter.category ?? null) : showStoreLanding} aria-label="Back"><span aria-hidden="true">‹</span></button>
        <h1>{filter.subCategory ?? ''}</h1>
      </header>
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
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleSelectProduct(product.id)}
                />
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
    </>
  );

  const renderStore = () => {
    if (storeScreen === 'landing') return <StoreLanding onSelectCategory={handleCategoryChange} />;
    if (storeScreen === 'subcategories' && filter.category) {
      return <StoreSubcategories category={filter.category} onBack={showStoreLanding} onSelectSubcategory={handleSubCategoryChange} />;
    }
    return renderProducts();
  };

  return (
    <div className={`app app-${view}`}>
      {view === 'store' && renderStore()}
      {view === 'favorites' && (
        <FavoritesView onSelectProduct={handleSelectProduct} />
      )}
      {view === 'cart' && (
        <CartView onSelectProduct={handleSelectProduct} />
      )}
      {view === 'profile' && (
        <ProfilePage
          onSignOut={() => {
            setView('store');
            window.history.pushState(null, '', '/store');
          }}
        />
      )}
      {view === 'detail' && selectedProduct && (
        <ProductDetail product={selectedProduct} onBack={handleBack} />
      )}
      {view === 'detail' && !selectedProduct && (
        <div className="state-message">Product not found.</div>
      )}
      <TabBar activeView={view === 'detail' ? previousView : view} onChange={handleTabChange} />
    </div>
  );
}

export default App;
