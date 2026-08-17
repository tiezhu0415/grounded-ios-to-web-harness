import { useMemo } from 'react';
import type { Order, OrderItem, ShippingAddress } from '../../services/profileService';
import {
  formatOrderDate,
  formatPrice,
  getOrderItems,
  getShippingAddressForOrder,
} from '../../services/profileService';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

const PRIMARY = '#2F2440';
const SECONDARY_BG = '#F2F2F7';
const SECONDARY_LABEL = '#8E8E93';
const RED = '#C62828';

interface OrderListPageProps {
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order) => void;
  onBack: () => void;
}

export function OrderListPage({ orders, selectedOrder, onSelectOrder, onBack }: OrderListPageProps) {
  if (selectedOrder) {
    return (
      <OrderDetailsPage
        order={selectedOrder}
        onBack={() => onSelectOrder(null as unknown as Order)}
      />
    );
  }

  return (
    <div className="profile-page order-list-page" data-testid="order-list-page">
      <div className="profile-header">
        <button className="profile-back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon width={22} height={22} />
        </button>
        <h1>Orders</h1>
      </div>

      <main className="profile-scroll" style={{ background: 'rgba(246, 238, 224, 0.5)' }}>
        <div className="order-list">
          {orders.map((order) => (
            <button
              key={order.id}
              type="button"
              className="order-card-button"
              data-testid="order-card"
              onClick={() => onSelectOrder(order)}
            >
              <OrderCard order={order} />
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <div className="order-card">
      <div className="order-card-content">
        <span className="order-card-date" style={{ color: PRIMARY }}>{formatOrderDate(order.dateCreated)}</span>
        <div className="order-card-row">
          <span className="order-card-total" style={{ color: PRIMARY }}>{formatPrice(order.totalAmount)}</span>
          <ChevronRightIcon width={20} height={20} style={{ color: SECONDARY_LABEL }} />
        </div>
        <span className="order-card-articles" style={{ color: PRIMARY }}>
          {order.numberOfArticles} ARTICLES
        </span>
        <span className="order-card-id" style={{ color: PRIMARY }}>N° {order.id}</span>
      </div>
    </div>
  );
}

interface OrderDetailsPageProps {
  order: Order;
  onBack: () => void;
}

export function OrderDetailsPage({ order, onBack }: OrderDetailsPageProps) {
  const items = useMemo(() => getOrderItems(order.id), [order.id]);
  const address = useMemo(() => getShippingAddressForOrder(), []);
  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <div className="profile-page" data-testid="order-details-page">
      <div className="profile-header">
        <button className="profile-back" onClick={onBack} aria-label="Back">
          <ChevronLeftIcon width={22} height={22} />
        </button>
        <h1>N° {order.id}</h1>
      </div>

      <main className="profile-scroll">
        <OrderPersonalInfoSection order={order} address={address} />

        <div className="order-items-section">
          {items.map((item, index) => (
            <div key={item.id}>
              <OrderItemRow item={item} />
              {index < items.length - 1 && <hr className="profile-divider" />}
            </div>
          ))}
        </div>

        <OrderAmountSummary order={order} subTotal={subTotal} />
      </main>
    </div>
  );
}

interface OrderPersonalInfoSectionProps {
  order: Order;
  address: ShippingAddress;
}

function OrderPersonalInfoSection({ order, address }: OrderPersonalInfoSectionProps) {
  return (
    <div className="order-personal-info-wrapper" style={{ background: SECONDARY_BG }}>
      <div className="order-personal-info-card">
        <div className="order-personal-info-header">
          <span style={{ color: PRIMARY }}>{formatOrderDate(order.dateCreated)}</span>
          <span style={{ color: PRIMARY }}>{order.numberOfArticles} Articles</span>
        </div>
        <div className="order-personal-info-body" style={{ color: PRIMARY }}>
          <p>JANE DOE</p>
          <p>{address.streetNumber} {address.streetName}</p>
          <p>{address.postalCode} {address.town}</p>
          <p>{address.country.toUpperCase()}</p>
        </div>
      </div>
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const total = item.price * item.quantity;
  return (
    <div className="order-item-row">
      <img
        className="order-item-image"
        src={item.imageUrl}
        alt={item.name}
        loading="lazy"
      />
      <div className="order-item-details">
        <span className="order-item-brand" style={{ color: PRIMARY }}>{item.brand}</span>
        <span className="order-item-name" style={{ color: PRIMARY }}>{item.name}</span>
        <div className="order-item-meta">
          <span style={{ color: SECONDARY_LABEL }}>Color:</span>
          <span style={{ color: PRIMARY }}>{item.colorName}</span>
        </div>
        <div className="order-item-meta">
          <span style={{ color: SECONDARY_LABEL }}>Size:</span>
          <span style={{ color: PRIMARY }}>{item.size}</span>
        </div>
        <div className="order-item-meta">
          <span style={{ color: SECONDARY_LABEL }}>Quantity:</span>
          <span style={{ color: PRIMARY }}>{item.quantity}</span>
          <span className="order-item-price" style={{ color: PRIMARY }}>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

interface OrderAmountSummaryProps {
  order: Order;
  subTotal: number;
}

function OrderAmountSummary({ order, subTotal }: OrderAmountSummaryProps) {
  const discountText =
    order.discountAmount > 0 ? `- ${formatPrice(order.discountAmount)}` : formatPrice(order.discountAmount);
  return (
    <div className="order-amount-summary">
      <div className="order-amount-row">
        <span style={{ color: PRIMARY }}>Sub Total</span>
        <span className="order-amount-value" style={{ color: PRIMARY }}>{formatPrice(subTotal)}</span>
      </div>
      <div className="order-amount-row">
        <span style={{ color: PRIMARY }}>Freight costs</span>
        <span className="order-amount-value" style={{ color: PRIMARY }}>{formatPrice(order.freightCosts)}</span>
      </div>
      <div className="order-amount-row">
        <span style={{ color: PRIMARY }}>Discount</span>
        <span
          className="order-amount-value"
          style={{ color: order.discountAmount > 0 ? RED : PRIMARY }}
        >
          {discountText}
        </span>
      </div>
      <hr className="profile-divider" />
      <div className="order-amount-row order-amount-net">
        <span style={{ color: PRIMARY }}>Net Amount</span>
        <span className="order-amount-value" style={{ color: PRIMARY }}>{formatPrice(order.totalAmount)}</span>
      </div>
    </div>
  );
}
