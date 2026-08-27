import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/components/Product';

export default function Orders() {
  const navigate = useNavigate();
  const orders = useAppStore((s) => s.orders);

  return (
    <div className="min-h-full bg-cream px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile')} className="p-1">
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <h1 className="text-xl font-extrabold text-primary">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <p className="text-center text-gray-500 mt-10">No orders yet</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => navigate(`/profile/orders/${order.id}`)}
              className="w-full bg-white rounded-xl shadow-sm p-4 text-left"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-primary">{order.id}</span>
                <span className="text-sm text-gray-500">{new Date(order.dateCreated).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-gray-500">{order.numberOfArticles} articles</p>
              <p className="text-lg font-bold text-primary">{formatPrice(order.totalAmount)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
