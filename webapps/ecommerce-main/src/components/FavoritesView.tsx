import { ProductCard } from './ProductCard';
import { useFavorites } from '../hooks/useFavorites';
import { getProductById } from '../services/productService';

interface FavoritesViewProps {
  onSelectProduct: (productId: string) => void;
}

export function FavoritesView({ onSelectProduct }: FavoritesViewProps) {
  const { favoriteIds } = useFavorites();

  const favoriteProducts = favoriteIds
    .map((id) => getProductById(id))
    .filter((product): product is NonNullable<typeof product> => product !== undefined);

  if (favoriteProducts.length === 0) {
    return (
      <div data-testid="favorites-empty" className="favorites-empty">
        <div className="favorites-empty-icon">♡</div>
        <p>Your favorite list is empty</p>
      </div>
    );
  }

  return (
    <div data-testid="favorites-view" className="favorites-view">
      <h2 className="favorites-title">Favorites</h2>
      <div className="favorites-list">
        {favoriteProducts.map((product) => (
          <div key={product.id} data-testid="favorite-item">
            <ProductCard product={product} onClick={() => onSelectProduct(product.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
