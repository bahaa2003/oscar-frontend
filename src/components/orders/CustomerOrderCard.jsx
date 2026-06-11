import React from 'react';
import { CalendarClock, Eye, Hash, ImageIcon, UserRound } from 'lucide-react';
import OrderStatusBadge from './OrderStatusBadge';
import {
  formatOrderDateTime,
  formatOrderMoney,
} from '../../utils/orders';

const CustomerOrderCard = ({ order, isArabic, currencies, onSelect }) => {
  const locale = isArabic ? 'ar-EG' : 'en-US';
  const orderNumber = order.siteOrderNumber || order.orderNumber || order.id;
  const amount = formatOrderMoney(order, currencies, locale);
  const createdAt = formatOrderDateTime(order.createdAt, locale);
  const identifierField = order.primaryIdentifierField;
  const quantity = Number(order?.quantity ?? order?.qty ?? 1);
  const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? quantity : 1;

  return (
    <button
      type="button"
      dir={isArabic ? 'rtl' : 'ltr'}
      onClick={() => onSelect(order)}
      className="orders-logo-card customer-order-card group w-full min-w-0 rounded-xl p-2.5 text-start transition-all focus:outline-none focus:ring-2 focus:ring-[color:rgb(var(--color-primary-rgb)/0.28)]"
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <div className="orders-logo-thumb customer-order-thumb h-12 w-12 shrink-0 overflow-hidden rounded-xl">
          {order.productImage ? (
            <img
              src={order.productImage}
              alt={order.productName}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[var(--color-muted)]">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <h2 className="min-w-0 truncate pt-0.5 text-[13px] font-black leading-5 text-[var(--color-text)]">
              {order.productName || (isArabic ? 'منتج غير معروف' : 'Unknown product')}
            </h2>
            <OrderStatusBadge
              status={order.status}
              isArabic={isArabic}
              className="shrink-0 rounded-lg px-1.5 py-0.5 text-[9px]"
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="customer-order-chip customer-order-chip--cyan">
              <Hash className="h-3 w-3" />
              <span dir="ltr">#{orderNumber}</span>
            </span>
            <span className="customer-order-chip">
              <CalendarClock className="h-3 w-3" />
              <span className="max-w-[8.5rem] truncate">{createdAt}</span>
            </span>
            {identifierField?.value ? (
              <span className="customer-order-chip customer-order-chip--violet">
                <UserRound className="h-3 w-3" />
                <span className="max-w-[7rem] truncate">{identifierField.value}</span>
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
            <span className="customer-order-amount max-w-[9rem] truncate rounded-lg px-2 py-1 text-[12px] font-black" title={amount} dir="ltr">
              {amount}
            </span>
            <span className="customer-order-details inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-black">
              <Eye className="h-3.5 w-3.5" />
              {isArabic ? 'التفاصيل' : 'Details'}
            </span>
          </div>

          <p className="mt-1 truncate text-[10px] font-semibold text-[var(--color-muted)]">
            {isArabic ? `الكمية ${safeQuantity}` : `Qty ${safeQuantity}`}
          </p>
        </div>
      </div>
    </button>
  );
};

export default CustomerOrderCard;
