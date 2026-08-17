import type { ProductVariant } from '../data/products';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function VariantSelector({ variants, selectedIndex, onSelect }: VariantSelectorProps) {
  return (
    <div className="variant-selector" role="radiogroup" aria-label="Select color variant">
      {variants.map((variant, index) => (
        <button
          key={variant.imageUrl}
          type="button"
          data-testid="variant-thumbnail"
          className={`variant-thumbnail ${index === selectedIndex ? 'selected' : ''}`}
          role="radio"
          aria-checked={index === selectedIndex}
          aria-label={variant.colorName}
          onClick={() => onSelect(index)}
        >
          <img src={variant.imageUrl} alt={variant.colorName} loading="lazy" />
        </button>
      ))}
    </div>
  );
}
