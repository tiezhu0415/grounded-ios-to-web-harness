import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/components/Product';

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const order = useAppStore((s) => s.orders.find((o) => o.id === id));

  if (!order) {
    return <div className="p-4">Order not found</div>;
  }

  return (
    <div className="min-h-full bg-cream px-4 py-5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/profile/orders')} className="p-1">
          <ChevronLeft className="w-7 h-7 text-primary" />
        </button>
        <h1 className="text-xl font-extrabold text-primary">Order {order.id}</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <p className="font-bold text-primary mb-2">Shipping Address</p>
        <p className="text-sm text-gray-700">{order.shippingAddress.streetNumber} {order.shippingAddress.streetName}</p>
        <p className="text-sm text-gray-700">{order.shippingAddress.postalCode} {order.shippingAddress.town}</p>
        <p className="text-sm text-gray-700 uppercase">{order.shippingAddress.country}</p>
      </div>

      <div className="space-y-3 mb-4">
        {order.items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-3 flex gap-3">
            <img src={item.imageUrl} alt={item.name} className="w-20 h-24 object-cover rounded-lg" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">{item.name}</p>
              <p className="text-xs text-gray-500">{item.brand} · {item.size} · {item.colorName}</p>
              <p className="text-sm font-bold text-primary">Qty: {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Discount</span>
          <span>-{formatPrice(order.discountAmount)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>
    </div>
  );
}
