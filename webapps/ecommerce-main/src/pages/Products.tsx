import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { products, categoryDisplay } from '@/data/products';
import { ProductRow } from '@/components/Product';
import { useAppStore } from '@/store/useAppStore';

function normalizeCategory(input?: string): string | undefined {
  if (!input) return undefined;
  const match = Object.entries(categoryDisplay).find(([_, display]) => display.toLowerCase() === input.toLowerCase());
  return match ? match[0] : input.toLowerCase();
}

function normalizeSubCategory(input?: string): string | undefined {
  if (!input) return undefined;
  return input.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export default function Products() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const category = normalizeCategory(searchParams.get('category') || undefined);
  const subcategory = normalizeSubCategory(searchParams.get('subcategory') || undefined);
  const discounted = searchParams.get('discounted') === 'true';
  const newIn = searchParams.get('newIn') === 'true';

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category && p.category.toLowerCase() !== category.toLowerCase()) return false;
      if (subcategory && p.subCategory.toLowerCase().replace(/[^a-z0-9]/g, '') !== subcategory) return false;
      if (discounted && p.discountPercent === 0) return false;
      if (newIn && !p.isNewIn) return false;
      return true;
    });
  }, [category, subcategory, discounted, newIn]);

  const title = discounted
    ? 'Discounted'
    : newIn
    ? 'New Arrivals'
    : subcategory
    ? (searchParams.get('subcategory') || subcategory)
    : category
    ? (categoryDisplay[category] || category)
    : 'All Products';

  return (
    <div className="min-h-full bg-[#F6F6F6] px-4 py-5">
      <div className="relative flex items-center justify-center mb-4">
        <button onClick={() => navigate(-1)} className="absolute left-0 p-1">
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <h1 className="text-xl font-medium text-primary">{title}</h1>
      </div>

      <div className="space-y-3">
        {filtered.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            isFavorite={favorites.includes(p.id)}
            onToggleFavorite={() => toggleFavorite(p.id)}
            onClick={() => navigate(`/product/${p.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
