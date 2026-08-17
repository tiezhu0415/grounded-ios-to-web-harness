interface SizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSelect: (size: string | null) => void;
}

export function SizeSelector({ sizes, selectedSize, onSelect }: SizeSelectorProps) {
  return (
    <div className="size-selector" role="group" aria-label="Select size">
      {sizes.map((size) => {
        const isSelected = selectedSize === size;
        return (
          <button
            key={size}
            type="button"
            data-testid="size-chip"
            className={`size-chip ${isSelected ? 'selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onSelect(isSelected ? null : size)}
          >
            {size}
          </button>
        );
      })}
    </div>
  );
}
