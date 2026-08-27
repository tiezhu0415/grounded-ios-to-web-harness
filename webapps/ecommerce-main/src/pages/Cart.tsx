import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatBrand, formatPrice } from '@/components/Product';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart } = useAppStore();
  const subTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = cart.reduce((sum, i) => sum + (i.price * i.discountPercent / 100) * i.quantity, 0);
  const freightCosts = 0;
  const netAmount = subTotal - discountAmount;

  return (
    <div className="min-h-full bg-white px-4 py-5">
      <h1 className="text-2xl font-normal text-primary mb-6 text-center">Cart</h1>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-20">
          <img src="/images/cart.png" alt="Empty cart" className="w-40 h-40 object-contain mb-4" />
          <p className="text-accent text-xl font-light">Your cart is empty</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="w-full flex gap-3 text-left relative pb-4 border-b border-gray-100"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-24 h-32 object-contain rounded-lg bg-[#F2F2F2]"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary">{formatBrand(item.brand)}</p>
                <p className="text-sm text-primary">{item.name}</p>
                <p className="text-xs text-gray-500">Color: {item.colorName}</p>
                <p className="text-xs text-gray-500">Size: {item.size}</p>
                <div
                  className="inline-flex items-center gap-3 mt-2 bg-gray-100 px-2 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeFromCart(item.id)}
                className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center text-gray-400"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <p className="absolute bottom-4 right-0 text-sm font-bold text-primary">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}

          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Sub Total</span>
              <span>{formatPrice(subTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Freight costs</span>
              <span>{formatPrice(freightCosts)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Discount</span>
              <span className="text-red-500">- {formatPrice(discountAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
              <span>Net Amount</span>
              <span>{formatPrice(netAmount)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-black text-white py-3 rounded-xl font-semibold"
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
}
