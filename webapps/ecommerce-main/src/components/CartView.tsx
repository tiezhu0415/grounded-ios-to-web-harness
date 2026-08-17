import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  decreaseQuantity,
  formatCurrency,
  getCart,
  getCartItems,
  increaseQuantity,
  removeFromCart,
  type CartItem,
  type Cart,
} from '../services/cartService';

interface CartViewProps {
  onSelectProduct: (productId: string) => void;
}

function CartItemRow({
  item,
  onRemove,
  onDecrease,
  onIncrease,
  onSelect,
}: {
  item: CartItem;
  onRemove: () => void;
  onDecrease: () => void;
  onIncrease: () => void;
  onSelect: () => void;
}) {
  const lineTotal = item.price * item.quantity;

  return (
    <button
      type="button"
      className="cart-item-row"
      onClick={onSelect}
      aria-label={`${item.brand} ${item.name}`}
    >
      <div className="cart-item-image-wrapper">
        <img src={item.imageUrl} alt="" className="cart-item-image" />
      </div>
      <div className="cart-item-info">
        <div className="cart-item-header">
          <span className="cart-item-brand">{item.brand}</span>
          <button
            type="button"
            className="cart-item-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove item"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
            </svg>
          </button>
        </div>
        <p className="cart-item-name">{item.name}</p>
        <div className="cart-item-meta">
          <p>
            Color: <span>{item.colorName}</span>
          </p>
          <p>
            Size: <span>{item.size}</span>
          </p>
        </div>
        <div className="cart-item-quantity">
          <button
            type="button"
            className="quantity-button"
            onClick={(e) => {
              e.stopPropagation();
              onDecrease();
            }}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="quantity-value">{item.quantity}</span>
          <button
            type="button"
            className="quantity-button"
            onClick={(e) => {
              e.stopPropagation();
              onIncrease();
            }}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>
      <div className="cart-item-price">{formatCurrency(lineTotal)}</div>
    </button>
  );
}

function CartAmountSummary({
  cartItems,
  cart,
}: {
  cartItems: CartItem[];
  cart: Cart;
}) {
  const subTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  return (
    <div className="cart-amount-summary">
      <div className="cart-amount-row">
        <span>Sub Total</span>
        <span className="cart-amount-value">{formatCurrency(subTotal)}</span>
      </div>
      <div className="cart-amount-row">
        <span>Freight costs</span>
        <span className="cart-amount-value">
          {formatCurrency(cart.freightCosts)}
        </span>
      </div>
      <div className="cart-amount-row">
        <span>Discount</span>
        <span
          className={`cart-amount-value ${
            cart.discountAmount > 0 ? 'cart-amount-discount' : ''
          }`}
        >
          {cart.discountAmount > 0
            ? `- ${formatCurrency(cart.discountAmount)}`
            : formatCurrency(cart.discountAmount)}
        </span>
      </div>
      <hr className="cart-amount-divider" />
      <div className="cart-amount-row cart-amount-net">
        <span>Net Amount</span>
        <span>{formatCurrency(cart.totalAmount)}</span>
      </div>
    </div>
  );
}

function CheckoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="checkout-button" onClick={onClick}>
      Checkout
    </button>
  );
}

export function CartView({ onSelectProduct }: CartViewProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cart, setCart] = useState<Cart>({
    freightCosts: 0,
    discountAmount: 0,
    totalAmount: 0,
  });

  const refresh = useCallback(() => {
    setItems(getCartItems());
    setCart(getCart());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRemove = useCallback(
    (itemId: string) => {
      removeFromCart(itemId);
      refresh();
    },
    [refresh]
  );

  const handleIncrease = useCallback(
    (itemId: string) => {
      increaseQuantity(itemId);
      refresh();
    },
    [refresh]
  );

  const handleDecrease = useCallback(
    (itemId: string) => {
      decreaseQuantity(itemId);
      refresh();
    },
    [refresh]
  );

  const handleSelect = useCallback(
    (item: CartItem) => {
      onSelectProduct(item.productId);
    },
    [onSelectProduct]
  );

  if (items.length === 0) {
    return (
      <div className="cart-view cart-view-empty">
        <div className="cart-empty-state">
          <img
            src="/icons/cart.png"
            alt="Empty cart"
            className="cart-empty-image"
          />
          <p className="cart-empty-text">Your cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-view">
      <header className="cart-header">
        <h1>Cart</h1>
      </header>
      <div className="cart-list">
        {items.map((item) => (
          <div key={item.id}>
            <CartItemRow
              item={item}
              onRemove={() => handleRemove(item.id)}
              onDecrease={() => handleDecrease(item.id)}
              onIncrease={() => handleIncrease(item.id)}
              onSelect={() => handleSelect(item)}
            />
            <hr className="cart-item-divider" />
          </div>
        ))}
      </div>
      <div className="cart-footer">
        <CartAmountSummary cartItems={items} cart={cart} />
        <CheckoutButton onClick={() => {}} />
      </div>
    </div>
  );
}
