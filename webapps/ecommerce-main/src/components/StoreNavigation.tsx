const storeCategories = [
  { id: 'all', label: 'All', image: '/categories/all.png' },
  { id: 'Clothing', label: 'Clothing', image: '/categories/clothing.png' },
  { id: 'Shoes', label: 'Shoes', image: '/categories/shoes.png' },
  { id: 'Accessories', label: 'Accessories', image: '/categories/accessories.png' },
] as const;

const subcategories: Record<string, string[]> = {
  Clothing: [
    'Dresses',
    'T-Shirts',
    'Shirts',
    'Sweatshirts',
    'Trousers',
    'Jeans',
    'Shorts',
    'Skirts',
    'Jackets',
    'Coats',
  ],
  Shoes: ['Trainers', 'Sandals', 'Pumps', 'Boots', 'Ballerinas'],
  Accessories: ['Bags', 'Sunglasses', 'Watches', 'Belts'],
};

interface StoreLandingProps {
  onSelectCategory: (category: string | null) => void;
}

export function StoreLanding({ onSelectCategory }: StoreLandingProps) {
  return (
    <main className="store-landing" data-testid="store-landing">
      <header className="store-title"><h1>Store</h1></header>
      <label className="store-search">
        <span aria-hidden="true" className="search-icon" />
        <span className="sr-only">Search</span>
        <input type="search" placeholder="Search" aria-label="Search" />
      </label>
      <div className="store-category-list">
        {storeCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className="store-category-card"
            onClick={() => onSelectCategory(category.id === 'all' ? null : category.id)}
          >
            <span>{category.label}</span>
            <img src={category.image} alt="" />
          </button>
        ))}
      </div>
    </main>
  );
}
interface StoreSubcategoriesProps {
  category: string;
  onBack: () => void;
  onSelectSubcategory: (subcategory: string | null) => void;
}

export function StoreSubcategories({
  category,
  onBack,
  onSelectSubcategory,
}: StoreSubcategoriesProps) {
  const rows = ['All', ...(subcategories[category] ?? [])];
  return (
    <main className="store-subcategories" data-testid="store-subcategories">
      <button type="button" className="store-back-button" onClick={onBack} aria-label="Back">
        <span aria-hidden="true">‹</span>
      </button>
      <h1>{category}</h1>
      <div className="subcategory-list">
        {rows.map((row) => (
          <button
            type="button"
            key={row}
            onClick={() => onSelectSubcategory(row === 'All' ? null : row)}
          >
            <span>{row}</span><span className="chevron" aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </main>
  );
}
