import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatPrice } from '@/components/Product';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, address, setAddress, clearCart, addOrder, user } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    streetNumber: address?.streetNumber || '',
    streetName: address?.streetName || '',
    postalCode: address?.postalCode || '',
    town: address?.town || '',
    country: address?.country || '',
  });

  const discountAmount = cart.reduce((sum, i) => sum + (i.price * i.discountPercent / 100) * i.quantity, 0);
  const totalAmount = cart.reduce((sum, i) => sum + (i.price * (1 - i.discountPercent / 100)) * i.quantity, 0);
  const articleCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleSaveAddress = () => {
    setAddress({ id: user?.uid || 'guest', ...form });
    setIsAdding(false);
  };

  const handlePay = () => {
    setIsLoading(true);
    setTimeout(() => {
      const order = {
        id: `ORD-${Date.now()}`,
        userId: user?.uid || 'guest',
        freightCosts: 0,
        discountAmount,
        totalAmount,
        numberOfArticles: articleCount,
        shippingAddress: address!,
        dateCreated: new Date().toISOString(),
        items: cart.map((i) => ({ ...i })),
      };
      addOrder(order);
      clearCart();
      setIsLoading(false);
      setIsPaid(true);
    }, 800);
  };

  return (
    <div className="min-h-full bg-white px-4 py-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-primary">Checkout</h1>
        <button onClick={() => navigate('/cart')} className="p-1">
          <X className="w-6 h-6 text-primary" />
        </button>
      </div>

      <div className="bg-cream rounded-xl p-4 mb-4">
        <p className="text-sm font-semibold text-primary mb-1">MY CART SUMMARY</p>
        <div className="flex justify-between items-center">
          <span className="text-base text-primary">{articleCount} articles</span>
          <span className="text-xl font-bold text-primary">{formatPrice(totalAmount)}</span>
        </div>
      </div>

      <div className="bg-cream rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-primary">MY SHIPPING ADDRESS</h2>
          <button
            onClick={() => setIsAdding((v) => !v)}
            className="text-accent font-bold text-xl"
          >
            {address ? '✎' : '+'}
          </button>
        </div>

        {address && !isAdding ? (
          <div className="bg-white rounded-lg p-4 space-y-1 text-primary">
            <p>{address.streetNumber} {address.streetName}</p>
            <p>{address.postalCode} {address.town}</p>
            <p className="uppercase">{address.country}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { key: 'streetNumber', label: 'Street Number' },
              { key: 'streetName', label: 'Street Name' },
              { key: 'postalCode', label: 'Postal Code' },
              { key: 'town', label: 'Town' },
              { key: 'country', label: 'Country' },
            ].map(({ key, label }) => (
              <input
                key={key}
                type="text"
                placeholder={label}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-primary"
              />
            ))}
            <button
              onClick={handleSaveAddress}
              disabled={!form.streetNumber || !form.streetName || !form.postalCode || !form.town || !form.country}
              className="w-full bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-50"
            >
              Save
            </button>
          </div>
        )}
      </div>

      {!isPaid && address && !isAdding && (
        <button
          onClick={handlePay}
          disabled={isLoading}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          {isLoading ? 'Loading…' : 'Continue'}
        </button>
      )}

      {isPaid && (
        <div className="bg-green-500 text-white rounded-xl p-4 text-center">
          <p className="font-bold">Payment complete ✓</p>
          <button
            onClick={() => navigate('/profile/orders')}
            className="mt-3 underline text-sm"
          >
            View Orders
          </button>
        </div>
      )}
    </div>
  );
}
