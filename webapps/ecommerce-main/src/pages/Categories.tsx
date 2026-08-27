import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { subCategoriesByCategory, categories } from '@/data/products';

export default function Categories() {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const cat = category || 'Clothing';
  const subCategories = subCategoriesByCategory[cat] || [];
  const catImage = categories.find((c) => c.key === cat)?.image || '/images/allCategories.png';

  return (
    <div className="min-h-full bg-cream px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/store')} className="p-1">
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <h1 className="text-2xl font-extrabold text-primary">{cat}</h1>
      </div>

      <button
        onClick={() => navigate(`/products?category=${encodeURIComponent(cat)}`)}
        className="relative w-full h-24 rounded-2xl overflow-hidden mb-4"
      >
        <img src={catImage} alt="All" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <span className="text-white text-xl font-bold">All {cat}</span>
        </div>
      </button>

      {subCategories.map((sub) => (
        <button
          key={sub}
          onClick={() => navigate(`/products?category=${encodeURIComponent(cat)}&subcategory=${encodeURIComponent(sub)}`)}
          className="w-full text-left bg-white rounded-xl shadow-sm px-4 py-4 mb-3 text-primary font-semibold"
        >
          {sub}
        </button>
      ))}
    </div>
  );
}
