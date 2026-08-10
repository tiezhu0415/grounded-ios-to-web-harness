import { type ProductWithMeta, formatDiscountedPrice, formatPrice } from '../services/productService';

interface ProductCardProps {
  product: ProductWithMeta;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div data-testid="product-card" className="product-card">
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
        <h3>{product.name}</h3>
        <p className="product-brand">{product.brand}</p>
        <div className="product-meta">
          <span data-testid="product-category" className="product-category">
            {product.category}
          </span>
          <span data-testid="product-subcategory" className="product-subcategory">
            {product.subCategory}
          </span>
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
        </div>
      </div>
    </div>
  );
}
