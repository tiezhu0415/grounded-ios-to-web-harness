import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { productById } from '@/data/products';
import { useAppStore } from '@/store/useAppStore';
import { ProductRow } from '@/components/Product';
import type { Product } from '@/types';

export default function Favorites() {
  const navigate = useNavigate();
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  const favoriteProducts = useMemo(() => {
    const list: Product[] = [];
    for (const id of favorites) {
      const p = productById.get(id);
      if (p) list.push(p);
    }
    return list;
  }, [favorites]);

  return (
    <div className="min-h-full bg-white px-4 py-5">
      <h1 className="text-2xl font-normal text-primary mb-6 text-center">Favorites</h1>

      {favoriteProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20">
          <img src="/images/favorites.png" alt="Empty favorites" className="w-40 h-40 object-contain mb-4" />
          <p className="text-accent text-xl font-light">Your favorite list is empty</p>
        </div>
      ) : (
        <div className="space-y-3">
          {favoriteProducts.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              isFavorite
              showDiscountPrice={false}
              onToggleFavorite={() => toggleFavorite(p.id)}
              onClick={() => navigate(`/product/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
