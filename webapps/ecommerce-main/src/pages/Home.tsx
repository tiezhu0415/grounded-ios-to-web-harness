import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductCard, getFeaturedDiscounted, getFeaturedNewIn } from '@/components/Product';

const features = ['/images/feature1.png', '/images/feature2.png', '/images/feature3.png'];

function isVisualMode() {
  try {
    return typeof window !== 'undefined' && localStorage.getItem('harness-visual') === '1';
  } catch {
    return false;
  }
}

export default function Home() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (isVisualMode()) return;
    const interval = setInterval(() => setPage((p) => (p + 1) % features.length), 4000);
    return () => clearInterval(interval);
  }, []);

  const discounted = getFeaturedDiscounted();
  const newIns = getFeaturedNewIn();

  return (
    <div className="min-h-full bg-white">
      {/* Feature carousel */}
      <div className="relative w-full h-56 overflow-hidden">
        {features.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt={`Feature ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            style={{ opacity: idx === page ? 1 : 0 }}
          />
        ))}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
          {features.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx)}
              className={`w-2 h-2 rounded-full ${idx === page ? 'bg-white' : 'bg-white/60'}`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 py-5 space-y-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold text-primary tracking-wide">SUMMER SALE</h2>
            <button
              onClick={() => navigate('/products?discounted=true')}
              className="text-sm text-primary"
            >
              Show All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {discounted.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-extrabold text-primary tracking-wide">NEW ARRIVALS</h2>
            <button
              onClick={() => navigate('/products?newIn=true')}
              className="text-sm text-primary"
            >
              Show All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {newIns.map((p) => (
              <ProductCard key={p.id} product={p} onClick={() => navigate(`/product/${p.id}`)} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
