import { FavoriteButton } from './FavoriteButton';
import { type ProductWithMeta, formatDiscountedPrice, formatPrice } from '../services/productService';

interface ProductCardProps {
  product: ProductWithMeta;
  onClick?: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const colorMap: Record<string, string> = {
    'Navy Blue': '#1267c4', Blue: '#087cf0', Red: '#ff3038', Black: '#111111',
    Pink: '#ff2d73', Bordeaux: '#7b1635', Mint: '#31c78d', Green: '#28a745',
    Orange: '#ff9500', 'Light Orange': '#ff9f43', White: '#ffffff',
    Brown: '#a65d00', Purple: '#a844e0', Grey: '#8e8e93', 'Grey / Beige': '#a8a29b',
  };
  return (
    <div
      data-testid="product-card"
      className={`product-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="product-card-image-wrapper">
        {product.discountPercent ? (
          <span className="tag discount-tag">-{product.discountPercent}%</span>
        ) : product.isNewIn ? (
          <span className="tag new-in-tag">NEW IN</span>
        ) : null}
        <img
          src={product.displayImageUrl}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          }}
        />
      </div>
      <div className="product-card-info">
        <h3 data-testid="product-name">{product.name}</h3>
        <p data-testid="product-brand" className="product-brand">{product.brand}</p>
        <div className="product-meta" aria-label="Product category">
          <span data-testid="product-category" className="product-category">
            {product.category}
          </span>
          <span data-testid="product-subcategory" className="product-subcategory">
            {product.subCategory}
          </span>
        </div>
        <div className="product-colors" aria-label="Available colors">
          {product.variants.map((variant) => (
            <span
              key={`${product.id}-${variant.colorName}`}
              title={variant.colorName}
              style={{ background: colorMap[variant.colorName] ?? '#8e8e93' }}
            />
          ))}
        </div>
        <div className="product-price-row">
          {product.discountPercent ? (
            <>
              <span className="discounted-price">
                {formatDiscountedPrice(product.price, product.discountPercent)}
              </span>
              <span className="original-price">{formatPrice(product.price)}</span>
            </>
          ) : (
            <span className="price">{formatPrice(product.price)}</span>
          )}
          <FavoriteButton productId={product.id} />
        </div>
      </div>
    </div>
  );
}
