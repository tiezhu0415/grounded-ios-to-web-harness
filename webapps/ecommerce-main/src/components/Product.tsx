import type { Product } from '@/types';
import { products } from '@/data/products';
import { Heart } from 'lucide-react';

const brandMap: Record<string, string> = {
  lacoste: 'Lacoste',
  lauren: 'Ralph Lauren',
  adidas: 'Adidas',
  hugo: 'Hugo Boss',
  diesel: 'Diesel',
  guess: 'Guess',
  rebook: 'Rebook',
  tommy: 'Tommy Hilfiger',
  armani: 'Armani Exchange',
  puma: 'Puma',
  asics: 'Asics',
  nike: 'Nike',
};

export function formatBrand(brand: string) {
  if (!brand) return brand;
  return brandMap[brand.toLowerCase()] || brand.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ProductPrice({ product, showDiscountPrice = true }: { product: Product; showDiscountPrice?: boolean }) {
  const discount = product.discountPercent;
  const discounted = product.price * (1 - discount / 100);
  if (discount > 0 && showDiscountPrice) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-primary line-through">${product.price.toFixed(2)}</span>
        <span className="text-base font-semibold text-red-500">${discounted.toFixed(2)}</span>
      </div>
    );
  }
  return <span className="text-base font-semibold text-primary">${product.price.toFixed(2)}</span>;
}

export function ProductCard({ product, onClick }: { product: Product; onClick?: () => void }) {
  const imageUrl = product.variants[0]?.imageUrl;
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-36 text-left"
    >
      <div className="relative w-full h-44 bg-[#F2F2F2] rounded-2xl overflow-hidden mb-2">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
        {product.discountPercent > 0 && (
          <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5">
            - {product.discountPercent}%
          </div>
        )}
        {product.isNewIn && product.discountPercent === 0 && (
          <div className="absolute bottom-2 left-2 bg-black text-white text-xs font-bold px-1.5 py-0.5">
            New In
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">{formatBrand(product.brand)}</p>
      <p className="text-xs text-primary font-semibold line-clamp-2">{product.name}</p>
      <ProductPrice product={product} />
    </button>
  );
}

export function ProductRow({
  product,
  onClick,
  isFavorite,
  onToggleFavorite,
  showDiscountPrice = true,
}: {
  product: Product;
  onClick?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  showDiscountPrice?: boolean;
}) {
  const imageUrl = product.variants[0]?.imageUrl;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full bg-white rounded-2xl p-2 text-left relative shadow-sm"
    >
      <div className="relative w-28 h-32 flex-shrink-0 rounded-xl overflow-hidden bg-[#F2F2F2]">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full bg-gray-100" />
        )}
        {product.discountPercent > 0 && (
          <div className="absolute bottom-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1 py-0.5">
            - {product.discountPercent}%
          </div>
        )}
        {product.isNewIn && product.discountPercent === 0 && (
          <div className="absolute bottom-1 left-1 bg-black text-white text-[10px] font-bold px-1 py-0.5">
            New In
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 pr-10">
        <p className="text-sm font-semibold text-primary line-clamp-2">{product.name}</p>
        <p className="text-xs text-gray-500">{formatBrand(product.brand)}</p>
        <div className="flex gap-1.5 my-1.5">
          {product.variants.slice(0, 4).map((v) => (
            <div
              key={v.colorKey}
              className="w-5 h-5 rounded-full border border-gray-300 shadow-sm"
              style={{ backgroundColor: v.colorKey }}
              title={v.colorName}
            />
          ))}
        </div>
        <ProductPrice product={product} showDiscountPrice={showDiscountPrice} />
      </div>
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-primary'}`} />
        </button>
      )}
    </button>
  );
}

export function getFeaturedDiscounted() {
  return products.filter((p) => p.discountPercent > 0).slice(0, 5);
}

export function getFeaturedNewIn() {
  return products.filter((p) => p.isNewIn).slice(0, 5);
}

export function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}
