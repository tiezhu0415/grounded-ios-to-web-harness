import { useState } from 'react';
import { addToCart } from '../services/cartService';
import { FavoriteButton } from './FavoriteButton';
import { SizeSelector } from './SizeSelector';
import { VariantSelector } from './VariantSelector';
import { type ProductWithMeta, formatDiscountedPrice, formatPrice } from '../services/productService';

interface ProductDetailProps {
  product: ProductWithMeta;
  onBack: () => void;
}

export function ProductDetail({ product, onBack }: ProductDetailProps) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const variant = product.variants[selectedVariant];

  const handleAddToCart = () => {
    if (selectedSize == null) return;
    const sizeIndex = product.sizes.indexOf(selectedSize);
    if (sizeIndex < 0) return;
    addToCart(product.id, selectedVariant, sizeIndex, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  return (
    <div data-testid="product-detail" className="product-detail">
      <header className="detail-header">
        <button
          type="button"
          data-testid="back-button"
          className="back-button"
          onClick={onBack}
          aria-label="Go back"
        >
          ← Back
        </button>
      </header>

      <div className="detail-image-wrapper">
        {product.discountPercent ? (
          <span className="tag discount-tag">-{product.discountPercent}%</span>
        ) : product.isNewIn ? (
          <span data-testid="product-detail-new-in-tag" className="tag new-in-tag">NEW IN</span>
        ) : null}
        <img
          data-testid="product-detail-image"
          src={variant?.imageUrl ?? product.displayImageUrl}
          alt={product.name}
        />
        <div className="detail-favorite-overlay">
          <FavoriteButton productId={product.id} />
        </div>
      </div>

      <div className="detail-info">
        <div className="detail-variant">
          <p className="variant-label">
            Color: <span data-testid="selected-variant-color">{variant?.colorName ?? ''}</span>
          </p>
          <VariantSelector
            variants={product.variants}
            selectedIndex={selectedVariant}
            onSelect={setSelectedVariant}
          />
        </div>

        <div className="detail-meta">
          <p data-testid="product-detail-brand" className="detail-brand">{product.brand}</p>
          <h2 data-testid="product-detail-name" className="detail-name">{product.name}</h2>

          <div className="detail-price">
            {product.discountPercent ? (
              <>
                <span data-testid="product-detail-discounted-price" className="discounted-price">
                  {formatDiscountedPrice(product.price, product.discountPercent)}
                </span>
                <span data-testid="product-detail-original-price" className="original-price">
                  {formatPrice(product.price)}
                </span>
              </>
            ) : (
              <span className="price">{formatPrice(product.price)}</span>
            )}
          </div>
        </div>

        <div className="detail-section">
          <h3>Select your size</h3>
          <SizeSelector
            sizes={product.sizes}
            selectedSize={selectedSize}
            onSelect={setSelectedSize}
          />
        </div>

        <details className="detail-description">
          <summary>Description</summary>
          <p>{product.description}</p>
        </details>

        <button
          type="button"
          className={`add-to-cart-button ${added ? 'added' : ''}`}
          disabled={selectedSize == null}
          onClick={handleAddToCart}
        >
          {added ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
