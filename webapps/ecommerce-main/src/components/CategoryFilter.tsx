import { getCategories, getSubCategories } from '../services/productService';

interface CategoryFilterProps {
  activeCategory: string | null;
  activeSubCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onSubCategoryChange: (subCategory: string | null) => void;
}

export function CategoryFilter({
  activeCategory,
  activeSubCategory,
  onCategoryChange,
  onSubCategoryChange,
}: CategoryFilterProps) {
  const categories = getCategories();
  const subCategories = activeCategory ? getSubCategories(activeCategory) : [];

  return (
    <div className="category-filter">
      <div className="category-buttons" aria-label="Categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            aria-pressed={activeCategory === cat.id || (cat.id === 'all' && !activeCategory)}
            className={
              (activeCategory === cat.id || (cat.id === 'all' && !activeCategory))
                ? 'active'
                : ''
            }
            onClick={() => {
              onCategoryChange(cat.id === 'all' ? null : cat.id);
              onSubCategoryChange(null);
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {activeCategory && subCategories.length > 0 && (
        <div className="subcategory-buttons" aria-label="Subcategories">
          <button
            aria-pressed={!activeSubCategory}
            className={!activeSubCategory ? 'active' : ''}
            onClick={() => onSubCategoryChange(null)}
          >
            All {activeCategory}
          </button>
          {subCategories.map((sub) => (
            <button
              key={sub.id}
              aria-pressed={activeSubCategory === sub.id}
              className={activeSubCategory === sub.id ? 'active' : ''}
              onClick={() => onSubCategoryChange(sub.id)}
            >
              {sub.label}
            </button>
          ))}
        </div>
      )}
      <div data-testid="active-category" className="active-category">
        {activeCategory ?? 'All'}
      </div>
    </div>
  );
}
