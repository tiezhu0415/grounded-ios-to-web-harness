import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { categories } from '@/data/products';

export default function Store() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-full bg-white px-4 py-5">
      <h1 className="text-2xl font-normal text-primary mb-6 text-center">Store</h1>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white text-primary placeholder-gray-400"
        />
      </div>

      <div className="space-y-4">
        {[{ key: 'All', image: '/images/allCategories.png' }, ...categories].map((cat) => (
          <button
            key={cat.key}
            onClick={() => navigate(cat.key === 'All' ? '/products' : `/store/categories/${cat.key}`)}
            className="w-full h-36 rounded-3xl overflow-hidden bg-[#D9CDB6] flex"
          >
            <div className="flex-1 flex items-center pl-8">
              <span className="text-3xl font-semibold text-primary">{cat.key}</span>
            </div>
            <div className="w-1/2 h-full">
              <img src={cat.image} alt={cat.key} className="w-full h-full object-cover" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
