import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Heart, ShoppingBag } from 'lucide-react';
import { products } from '@/data/products';
import { useAppStore } from '@/store/useAppStore';
import { ProductPrice, formatBrand } from '@/components/Product';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = products.find((p) => p.id === id);
  const addToCart = useAppStore((s) => s.addToCart);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const favorites = useAppStore((s) => s.favorites);
  const [variantIndex, setVariantIndex] = useState(0);
  const [sizeIndex, setSizeIndex] = useState<number | null>(null);

  if (!product) {
    return <div className="p-4">Product not found</div>;
  }

  const variant = product.variants[variantIndex];
  const isFavorite = favorites.includes(product.id);

  const handleAddToCart = () => {
    if (sizeIndex === null) return;
    addToCart({
      id: `${product.id}-${variantIndex}-${sizeIndex}`,
      productId: product.id,
      variantIndex,
      sizeIndex,
      size: product.sizes[sizeIndex],
      colorName: variant.colorName,
      name: product.name,
      brand: product.brand,
      price: product.price,
      discountPercent: product.discountPercent,
      quantity: 1,
      imageUrl: variant.imageUrl,
    });
  };

  return (
    <div className="min-h-full bg-white pb-24">
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center"
        >
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <button
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white shadow flex items-center justify-center"
        >
          <Heart className={`w-6 h-6 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-primary'}`} />
        </button>
        <div className="w-full h-[420px] bg-gray-50">
          <img src={variant.imageUrl} alt={product.name} className="w-full h-full object-contain" />
        </div>
        {product.discountPercent > 0 && (
          <div className="absolute top-20 left-0 bg-red-500 text-white text-xs font-bold px-2 py-1">
            - {product.discountPercent}%
          </div>
        )}
      </div>

      <div className="px-5 pt-5 space-y-5">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Color: <span className="font-semibold text-primary">{variant.colorName}</span>
          </p>
          <div className="flex gap-3">
            {product.variants.map((v, idx) => (
              <button
                key={idx}
                onClick={() => setVariantIndex(idx)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${idx === variantIndex ? 'border-primary' : 'border-transparent'}`}
              >
                <img src={v.imageUrl} alt={v.colorName} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500">{formatBrand(product.brand)}</p>
          <h1 className="text-xl font-bold text-primary">{product.name}</h1>
          <ProductPrice product={product} />
        </div>

        <div>
          <p className="text-sm text-gray-600 mb-2">Select your size</p>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size, idx) => (
              <button
                key={size}
                onClick={() => setSizeIndex(idx)}
                className={`min-w-[3rem] px-3 py-2 rounded-lg border text-sm font-semibold ${
                  sizeIndex === idx
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-primary border-gray-300'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={handleAddToCart}
            disabled={sizeIndex === null}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            Add to Cart
          </button>
        </div>

        <div className="pt-2">
          <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
        </div>
      </div>
    </div>
  );
}
